/// <reference types="jest" />
/* eslint-disable @typescript-eslint/unbound-method */
import { prisma } from "../../libs/database.ts"
import { AuthorizationService } from "../../services/authorization.service.ts"
import { cacheService } from "../../services/cache.service.ts"
import { logger } from "../../utils/logger.util.ts"

jest.mock("../../libs/database.ts", () => ({
  prisma: {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    employeeRole: {
      findMany: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock("../../services/cache.service.ts", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock("../../utils/logger.util.ts", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe("AuthorizationService", () => {
  let service: AuthorizationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuthorizationService(cacheService)
  })

  describe("incrementMetric", () => {
    it("UTCID01 - should increment the metric when the metric key is known", () => {
      // Arrange
      const metricKey = "authorization_cache_hits_total"

      // Act
      service.incrementMetric(metricKey)

      // Assert
      expect(service.getMetrics().authorization_cache_hits_total).toBe(1)
    })

    it("UTCID02 - should not increment when the metric key is unknown", () => {
      // Arrange
      const initialMetrics = service.getMetrics()
      const invalidKey = "invalid_metric_key"

      // Act
      service.incrementMetric(invalidKey)

      // Assert
      expect(service.getMetrics()).toEqual(initialMetrics)
    })

    it("UTCID03 - should handle empty metric string without throwing error", () => {
      // Arrange
      const initialMetrics = service.getMetrics()

      // Act
      service.incrementMetric("")

      // Assert
      expect(service.getMetrics()).toEqual(initialMetrics)
    })
  })

  describe("getMetrics", () => {
    it("UTCID01 - should return a snapshot of current authorization service metrics", () => {
      // Arrange
      service.incrementMetric("authorization_cache_misses_total")

      // Act
      const metrics = service.getMetrics()

      // Assert
      expect(metrics.authorization_cache_misses_total).toBe(1)
      expect(metrics.authorization_cache_hits_total).toBe(0)
    })

    it("UTCID02 - should return a new copy of the metrics object", () => {
      // Arrange
      const metrics1 = service.getMetrics()

      // Act
      metrics1.authorization_cache_hits_total = 999
      const metrics2 = service.getMetrics()

      // Assert
      expect(metrics2.authorization_cache_hits_total).toBe(0)
    })

    it("UTCID03 - should have default zero values for all tracked metrics", () => {
      // Arrange & Act
      const metrics = service.getMetrics()

      // Assert
      expect(metrics).toEqual({
        authorization_cache_hits_total: 0,
        authorization_cache_misses_total: 0,
        authorization_denied_total: 0,
        authorization_allowed_total: 0,
        authorization_resolve_duration_ms: 0,
      })
    })
  })

  describe("logDecision", () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
      delete process.env.AUTH_DEBUG
    })

    it("UTCID01 - should increment allowed total and log JSON to console if AUTH_DEBUG is true", () => {
      // Arrange
      process.env.AUTH_DEBUG = "true"
      const employeeId = "emp-123"
      const permission = "users:create"
      const allowed = true
      const source = "cache"

      // Act
      service.logDecision(employeeId, permission, allowed, source)

      // Assert
      expect(service.getMetrics().authorization_allowed_total).toBe(1)
      expect(service.getMetrics().authorization_denied_total).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({ employeeId, permission, allowed, source }),
      )
    })

    it("UTCID02 - should increment denied total and not log to console if AUTH_DEBUG is false", () => {
      // Arrange
      process.env.AUTH_DEBUG = "false"
      const employeeId = "emp-123"
      const permission = "users:delete"
      const allowed = false
      const source = "db"

      // Act
      service.logDecision(employeeId, permission, allowed, source)

      // Assert
      expect(service.getMetrics().authorization_allowed_total).toBe(0)
      expect(service.getMetrics().authorization_denied_total).toBe(1)
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it("UTCID03 - should increment denied total and not log to console if AUTH_DEBUG is undefined", () => {
      // Arrange
      delete process.env.AUTH_DEBUG
      const employeeId = "emp-123"
      const permission = "users:update"
      const allowed = false
      const source = "db"

      // Act
      service.logDecision(employeeId, permission, allowed, source)

      // Assert
      expect(service.getMetrics().authorization_allowed_total).toBe(0)
      expect(service.getMetrics().authorization_denied_total).toBe(1)
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe("getAuthorizationContext", () => {
    it("UTCID01 - should return cached authorization context when available and skipCache is false", async () => {
      // Arrange
      const employeeId = "emp-123"
      const cachedPayload = {
        isDynamicAdmin: false,
        roles: ["Editor"],
        permissions: ["post:edit"],
      }
      ;(prisma.employee.findUnique as jest.Mock).mockResolvedValueOnce({ authorizationVersion: 1 })
      ;(cacheService.get as jest.Mock).mockResolvedValueOnce(cachedPayload)

      // Act
      const context = await service.getAuthorizationContext(employeeId)

      // Assert
      expect(context.isDynamicAdmin).toBe(false)
      expect(context.roles).toEqual(new Set(["Editor"]))
      expect(context.permissions).toEqual(new Set(["post:edit"]))
      expect(service.getMetrics().authorization_cache_hits_total).toBe(1)
      expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1)
    })

    it("UTCID02 - should return default context if employee record does not exist in DB", async () => {
      // Arrange
      const employeeId = "emp-nonexistent"
      ;(prisma.employee.findUnique as jest.Mock).mockResolvedValueOnce(null)

      // Act
      const context = await service.getAuthorizationContext(employeeId)

      // Assert
      expect(context.isDynamicAdmin).toBe(false)
      expect(context.roles.size).toBe(0)
      expect(context.permissions.size).toBe(0)
      expect(service.getMetrics().authorization_cache_hits_total).toBe(0)
      expect(service.getMetrics().authorization_cache_misses_total).toBe(0)
    })

    it("UTCID03 - should bypass cache if skipCache option is true", async () => {
      // Arrange
      const employeeId = "emp-123"
      const dbEmployee = {
        employeeRoles: [
          {
            role: {
              name: "Viewer",
              isAdministrative: false,
              permissions: [{ permission: { code: "post:view" } }],
            },
          },
        ],
      }
      ;(prisma.employee.findUnique as jest.Mock)
        .mockResolvedValueOnce({ authorizationVersion: 2 })
        .mockResolvedValueOnce(dbEmployee)

      // Act
      const context = await service.getAuthorizationContext(employeeId, { skipCache: true })

      // Assert
      expect(context.isDynamicAdmin).toBe(false)
      expect(context.roles).toEqual(new Set(["Viewer"]))
      expect(context.permissions).toEqual(new Set(["post:view"]))
      expect(jest.mocked(cacheService.get)).not.toHaveBeenCalled()
      expect(service.getMetrics().authorization_cache_misses_total).toBe(1)
    })

    it("UTCID04 - should fall back to DB and log warning if cache.get throws error", async () => {
      // Arrange
      const employeeId = "emp-123"
      const dbEmployee = {
        employeeRoles: [
          {
            role: {
              name: "Viewer",
              isAdministrative: false,
              permissions: [{ permission: { code: "post:view" } }],
            },
          },
        ],
      }
      ;(prisma.employee.findUnique as jest.Mock)
        .mockResolvedValueOnce({ authorizationVersion: 2 })
        .mockResolvedValueOnce(dbEmployee)
      ;(cacheService.get as jest.Mock).mockRejectedValueOnce(new Error("Redis connection down"))

      // Act
      const context = await service.getAuthorizationContext(employeeId)

      // Assert
      expect(context.roles).toEqual(new Set(["Viewer"]))
      expect(logger.warn).toHaveBeenCalledWith(
        "Cache get failed, falling back to DB:",
        expect.any(Error),
      )
      expect(service.getMetrics().authorization_cache_misses_total).toBe(1)
    })

    it("UTCID05 - should return dynamic admin permissions if employee has administrative role", async () => {
      // Arrange
      const employeeId = "admin-123"
      const dbEmployee = {
        employeeRoles: [
          {
            role: {
              name: "SuperAdmin",
              isAdministrative: true,
              permissions: [],
            },
          },
        ],
      }
      ;(prisma.employee.findUnique as jest.Mock)
        .mockResolvedValueOnce({ authorizationVersion: 3 })
        .mockResolvedValueOnce(dbEmployee)
      ;(cacheService.get as jest.Mock).mockResolvedValueOnce(null)
      ;(prisma.permission.findMany as jest.Mock).mockResolvedValueOnce([
        { code: "system:reboot" },
        { code: "users:delete" },
      ])

      // Act
      const context = await service.getAuthorizationContext(employeeId)

      // Assert
      expect(context.isDynamicAdmin).toBe(true)
      expect(context.roles).toEqual(new Set(["SuperAdmin"]))
      expect(context.permissions).toEqual(new Set(["system:reboot", "users:delete"]))
      expect(jest.mocked(cacheService.set)).toHaveBeenCalledWith(
        "permissions:v2:3:admin-123",
        {
          isDynamicAdmin: true,
          roles: ["SuperAdmin"],
          permissions: ["system:reboot", "users:delete"],
        },
        300,
      )
    })

    it("UTCID06 - should handle fetchAndCacheContext failing if prisma throws inside it", async () => {
      // Arrange
      const employeeId = "emp-123"
      ;(prisma.employee.findUnique as jest.Mock)
        .mockResolvedValueOnce({ authorizationVersion: 1 })
        .mockRejectedValueOnce(new Error("Database unique constraint failed"))
      ;(cacheService.get as jest.Mock).mockResolvedValueOnce(null)

      // Act & Assert
      await expect(service.getAuthorizationContext(employeeId)).rejects.toThrow(
        "Database unique constraint failed",
      )
    })

    it("UTCID07 - should log warning and resolve context if cache.set throws error", async () => {
      // Arrange
      const employeeId = "emp-123"
      const dbEmployee = {
        employeeRoles: [],
      }
      ;(prisma.employee.findUnique as jest.Mock)
        .mockResolvedValueOnce({ authorizationVersion: 1 })
        .mockResolvedValueOnce(dbEmployee)
      ;(cacheService.get as jest.Mock).mockResolvedValueOnce(null)
      ;(cacheService.set as jest.Mock).mockRejectedValueOnce(new Error("Redis set failure"))

      // Act
      const context = await service.getAuthorizationContext(employeeId)

      // Assert
      expect(context.isDynamicAdmin).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith(
        "Cache set failed, continuing without cache:",
        expect.any(Error),
      )
    })
  })

  describe("invalidateUserCache", () => {
    it("UTCID01 - should successfully increment authorizationVersion in database", async () => {
      // Arrange
      const employeeId = "emp-123"
      ;(prisma.employee.update as jest.Mock).mockResolvedValueOnce({ id: employeeId })

      // Act
      await service.invalidateUserCache(employeeId)

      // Assert
      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      })
    })

    it("UTCID02 - should propagate DB error if update query fails", async () => {
      // Arrange
      const employeeId = "emp-123"
      const dbError = new Error("Database down")
      ;(prisma.employee.update as jest.Mock).mockRejectedValueOnce(dbError)

      // Act & Assert
      await expect(service.invalidateUserCache(employeeId)).rejects.toThrow("Database down")
    })

    it("UTCID03 - should propagate DB error when target employeeId is missing or empty", async () => {
      // Arrange
      const dbError = new Error("Prisma error: Record not found")
      ;(prisma.employee.update as jest.Mock).mockRejectedValueOnce(dbError)

      // Act & Assert
      await expect(service.invalidateUserCache("")).rejects.toThrow(
        "Prisma error: Record not found",
      )
    })
  })

  describe("getGlobalVersion", () => {
    it("UTCID01 - should return the initial global version of 1", async () => {
      // Arrange & Act
      const version = await service.getGlobalVersion()

      // Assert
      expect(version).toBe(1)
    })

    it("UTCID02 - should return updated version if it gets modified", async () => {
      // Arrange
      ;(prisma.employee.updateMany as jest.Mock).mockResolvedValueOnce({ count: 5 })
      await service.invalidateGlobalVersion()

      // Act
      const version = await service.getGlobalVersion()

      // Assert
      expect(version).toBe(2)
    })

    it("UTCID03 - should return progressively incremented versions", async () => {
      // Arrange
      ;(prisma.employee.updateMany as jest.Mock).mockResolvedValue({ count: 5 })
      await service.invalidateGlobalVersion()
      await service.invalidateGlobalVersion()

      // Act
      const version = await service.getGlobalVersion()

      // Assert
      expect(version).toBe(3)
    })
  })

  describe("invalidateGlobalVersion", () => {
    it("UTCID01 - should increment globalVersion and update all active employee authorizationVersions", async () => {
      // Arrange
      ;(prisma.employee.updateMany as jest.Mock).mockResolvedValueOnce({ count: 10 })

      // Act
      await service.invalidateGlobalVersion()

      // Assert
      expect(prisma.employee.updateMany).toHaveBeenCalledWith({
        where: { deletedAt: null, status: "active" },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      })
      expect(await service.getGlobalVersion()).toBe(2)
    })

    it("UTCID02 - should propagate DB error if updateMany query fails", async () => {
      // Arrange
      const dbError = new Error("Bulk update failed")
      ;(prisma.employee.updateMany as jest.Mock).mockRejectedValueOnce(dbError)

      // Act & Assert
      await expect(service.invalidateGlobalVersion()).rejects.toThrow("Bulk update failed")
    })

    it("UTCID03 - should increment local globalVersion counter even if DB call throws error", async () => {
      // Arrange
      ;(prisma.employee.updateMany as jest.Mock).mockRejectedValueOnce(new Error("DB failure"))

      // Act & Assert
      await expect(service.invalidateGlobalVersion()).rejects.toThrow("DB failure")
      expect(await service.getGlobalVersion()).toBe(2)
    })
  })

  describe("invalidateRoleCache", () => {
    it("UTCID01 - should find employees assigned to role and increment their versions", async () => {
      // Arrange
      const roleId = "role-abc"
      ;(prisma.employeeRole.findMany as jest.Mock).mockResolvedValueOnce([
        { employeeId: "emp-1" },
        { employeeId: "emp-2" },
      ])
      ;(prisma.employee.updateMany as jest.Mock).mockResolvedValueOnce({ count: 2 })

      // Act
      await service.invalidateRoleCache(roleId)

      // Assert
      expect(prisma.employeeRole.findMany).toHaveBeenCalledWith({
        where: {
          roleId,
          employee: {
            deletedAt: null,
            status: "active",
          },
        },
        select: { employeeId: true },
      })
      expect(prisma.employee.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["emp-1", "emp-2"] } },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      })
    })

    it("UTCID02 - should do nothing if no employees are assigned to the role", async () => {
      // Arrange
      const roleId = "role-empty"
      ;(prisma.employeeRole.findMany as jest.Mock).mockResolvedValueOnce([])

      // Act
      await service.invalidateRoleCache(roleId)

      // Assert
      expect(prisma.employee.updateMany).not.toHaveBeenCalled()
    })

    it("UTCID03 - should propagate DB query errors when fetching mappings", async () => {
      // Arrange
      const roleId = "role-abc"
      ;(prisma.employeeRole.findMany as jest.Mock).mockRejectedValueOnce(new Error("Select failed"))

      // Act & Assert
      await expect(service.invalidateRoleCache(roleId)).rejects.toThrow("Select failed")
    })
  })

  describe("invalidatePermissionCache", () => {
    it("UTCID01 - should find affected roles and employees, then increment employee versions", async () => {
      // Arrange
      const permissionId = "perm-123"
      ;(prisma.rolePermission.findMany as jest.Mock).mockResolvedValueOnce([
        { roleId: "role-1" },
        { roleId: "role-2" },
      ])
      ;(prisma.employeeRole.findMany as jest.Mock).mockResolvedValueOnce([{ employeeId: "emp-1" }])
      ;(prisma.employee.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 })

      // Act
      await service.invalidatePermissionCache(permissionId)

      // Assert
      expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { permissionId },
        select: { roleId: true },
      })
      expect(prisma.employeeRole.findMany).toHaveBeenCalledWith({
        where: {
          roleId: { in: ["role-1", "role-2"] },
          employee: {
            deletedAt: null,
            status: "active",
          },
        },
        select: { employeeId: true },
      })
      expect(prisma.employee.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["emp-1"] } },
        data: {
          authorizationVersion: {
            increment: 1,
          },
        },
      })
    })

    it("UTCID02 - should do nothing if permission is not mapped to any roles", async () => {
      // Arrange
      const permissionId = "perm-unused"
      ;(prisma.rolePermission.findMany as jest.Mock).mockResolvedValueOnce([])

      // Act
      await service.invalidatePermissionCache(permissionId)

      // Assert
      expect(prisma.employeeRole.findMany).not.toHaveBeenCalled()
      expect(prisma.employee.updateMany).not.toHaveBeenCalled()
    })

    it("UTCID03 - should do nothing if roles are found but no active employees are assigned to those roles", async () => {
      // Arrange
      const permissionId = "perm-123"
      ;(prisma.rolePermission.findMany as jest.Mock).mockResolvedValueOnce([{ roleId: "role-1" }])
      ;(prisma.employeeRole.findMany as jest.Mock).mockResolvedValueOnce([])

      // Act
      await service.invalidatePermissionCache(permissionId)

      // Assert
      expect(prisma.employee.updateMany).not.toHaveBeenCalled()
    })
  })
})
