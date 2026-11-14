import { prisma } from "../libs/database.ts"
import { AuthorizationContext, IAuthorizationService, ICacheService } from "../types/index.ts"
import { logger } from "../utils/logger.util.ts"
import { cacheService } from "./cache.service.ts"

/**
 * Authorization service responsible for resolving, caching, and invalidating user access context.
 */
export class AuthorizationService implements IAuthorizationService {
  private singleFlightMap = new Map<string, Promise<AuthorizationContext>>()
  private globalVersion = 1

  private metrics = {
    authorization_cache_hits_total: 0,
    authorization_cache_misses_total: 0,
    authorization_denied_total: 0,
    authorization_allowed_total: 0,
    authorization_resolve_duration_ms: 0,
  }

  /**
   * Initializes the authorization service with its cache dependency.
   */
  constructor(private cache: ICacheService) {}

  /**
   * Increments a tracked authorization metric when the metric key is known.
   */
  incrementMetric(metric: string): void {
    if (metric in this.metrics) {
      this.metrics[metric as keyof typeof this.metrics]++
    }
  }

  /**
   * Returns a snapshot of current authorization service metrics.
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics }
  }

  /**
   * Records an authorization decision for metrics and optional debug logging.
   */
  logDecision(employeeId: string, permission: string, allowed: boolean, source: string): void {
    if (allowed) {
      this.metrics.authorization_allowed_total++
    } else {
      this.metrics.authorization_denied_total++
    }

    if (process.env.AUTH_DEBUG === "true") {
      console.log(
        JSON.stringify({
          employeeId,
          permission,
          allowed,
          source,
        }),
      )
    }
  }

  /**
   * Resolves the effective authorization context for an employee, with optional cache bypass.
   */
  async getAuthorizationContext(
    employeeId: string,
    options?: { skipCache?: boolean },
  ): Promise<AuthorizationContext> {
    const skipCache = options?.skipCache ?? false

    // Fetch user's current authorizationVersion from DB
    const employeeVersionRecord = await prisma.employee.findUnique({
      where: { id: employeeId, status: "active", deletedAt: null },
      select: { authorizationVersion: true },
    })

    if (!employeeVersionRecord) {
      return {
        isDynamicAdmin: false,
        roles: new Set<string>(),
        permissions: new Set<string>(),
      }
    }

    const snapshotVersion = employeeVersionRecord.authorizationVersion
    const cacheKey = `permissions:v2:${snapshotVersion}:${employeeId}`

    if (!skipCache) {
      try {
        const cached = await this.cache.get<{
          isDynamicAdmin: boolean
          roles: string[]
          permissions: string[]
        }>(cacheKey)
        if (cached) {
          this.metrics.authorization_cache_hits_total++
          return {
            isDynamicAdmin: cached.isDynamicAdmin,
            roles: new Set(cached.roles),
            permissions: new Set(cached.permissions),
          }
        }
      } catch (err) {
        logger.warn("Cache get failed, falling back to DB:", err)
      }
    }

    this.metrics.authorization_cache_misses_total++

    let promise = this.singleFlightMap.get(employeeId)
    if (!promise) {
      promise = this.fetchAndCacheContext(employeeId, snapshotVersion, cacheKey)
      this.singleFlightMap.set(employeeId, promise)
    }

    try {
      return await promise
    } finally {
      this.singleFlightMap.delete(employeeId)
    }
  }

  /**
   * Loads authorization data from the database and persists a cacheable snapshot.
   */
  private async fetchAndCacheContext(
    employeeId: string,
    snapshotVersion: number,
    cacheKey: string,
  ): Promise<AuthorizationContext> {
    const start = performance.now()

    // Highly optimized projection query
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, status: "active", deletedAt: null },
      select: {
        employeeRoles: {
          where: {
            role: {
              isActive: true,
              deletedAt: null,
            },
          },
          select: {
            role: {
              select: {
                name: true,
                isAdministrative: true,
                permissions: {
                  where: {
                    permission: {
                      isActive: true,
                      deletedAt: null,
                    },
                  },
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const duration = performance.now() - start
    this.metrics.authorization_resolve_duration_ms = duration

    if (!employee) {
      return {
        isDynamicAdmin: false,
        roles: new Set<string>(),
        permissions: new Set<string>(),
      }
    }

    let isDynamicAdmin = false
    const permissionsSet = new Set<string>()
    const rolesSet = new Set<string>()

    for (const empRole of employee.employeeRoles) {
      rolesSet.add(empRole.role.name)
      if (empRole.role.isAdministrative) {
        isDynamicAdmin = true
      }
      for (const rolePerm of empRole.role.permissions) {
        permissionsSet.add(rolePerm.permission.code)
      }
    }

    if (isDynamicAdmin) {
      const activePermissions = await prisma.permission.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          code: true,
        },
      })

      for (const permission of activePermissions) {
        permissionsSet.add(permission.code)
      }
    }

    const context: AuthorizationContext = {
      isDynamicAdmin,
      roles: rolesSet,
      permissions: permissionsSet,
    }

    // Convert Set to Array for Redis serialization
    const cachePayload = {
      isDynamicAdmin,
      roles: Array.from(rolesSet),
      permissions: Array.from(permissionsSet),
    }

    try {
      await this.cache.set(cacheKey, cachePayload, 300)
    } catch (err) {
      logger.warn("Cache set failed, continuing without cache:", err)
    }

    return context
  }

  /**
   * Invalidates cached authorization context for a single employee by bumping its version.
   */
  async invalidateUserCache(employeeId: string): Promise<void> {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        authorizationVersion: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Returns the current global authorization version marker.
   */
  async getGlobalVersion(): Promise<number> {
    return this.globalVersion
  }

  /**
   * Invalidates authorization context for all active employees by bumping their versions.
   */
  async invalidateGlobalVersion(): Promise<void> {
    this.globalVersion++
    // Global version invalidation: increment version for all active employees
    await prisma.employee.updateMany({
      where: { deletedAt: null, status: "active" },
      data: {
        authorizationVersion: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Invalidates authorization context for employees assigned to a specific role.
   */
  async invalidateRoleCache(roleId: string): Promise<void> {
    const mappings = await prisma.employeeRole.findMany({
      where: {
        roleId,
        employee: {
          deletedAt: null,
          status: "active",
        },
      },
      select: { employeeId: true },
    })

    if (mappings.length > 0) {
      const employeeIds = mappings.map((m) => m.employeeId)
      await prisma.employee.updateMany({
        where: { id: { in: employeeIds } },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      })
    }
  }

  /**
   * Invalidates authorization context for employees affected by a permission change.
   */
  async invalidatePermissionCache(permissionId: string): Promise<void> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId },
      select: { roleId: true },
    })

    const roleIds = rolePermissions.map((rp) => rp.roleId)
    if (roleIds.length > 0) {
      const mappings = await prisma.employeeRole.findMany({
        where: {
          roleId: { in: roleIds },
          employee: {
            deletedAt: null,
            status: "active",
          },
        },
        select: { employeeId: true },
      })

      if (mappings.length > 0) {
        const employeeIds = mappings.map((m) => m.employeeId)
        await prisma.employee.updateMany({
          where: { id: { in: employeeIds } },
          data: {
            authorizationVersion: {
              increment: 1,
            },
          },
        })
      }
    }
  }
}

export const authorizationService = new AuthorizationService(cacheService)
