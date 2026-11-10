import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { ROLE_ERROR_CODES } from "@/constants/permission.constants.ts"
import {
  AppRole,
  CreateRoleDto,
  IRoleRepository,
  PaginatedRolesDto,
  Permission,
  RoleListQuery,
  UpdateRoleDto,
} from "@/types"

import { Prisma, AppRole as PrismaAppRole, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for managing AppRole database operations in PostgreSQL using Prisma.
 * Implements the IRoleRepository boundary.
 */
export class PrismaRoleRepository extends BaseRepository implements IRoleRepository {
  /**
   * Initializes the repository with the PrismaClient.
   * @param prisma The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps database AppRole to domain AppRole object.
   * @param role The PrismaAppRole record.
   * @returns The mapped AppRole domain object.
   * @protected
   */
  protected mapToDomain(
    role: PrismaAppRole & {
      _count?: {
        permissions: number
        employees: number
      }
    },
  ): AppRole {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      isAdministrative: role.isAdministrative,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
      deletedAt: role.deletedAt,
      permissionsCount: role._count?.permissions,
      employeesCount: role._count?.employees,
    }
  }

  /**
   * Retrieves a paginated and filtered list of roles.
   * Excludes soft-deleted records.
   * @param query Filtering and pagination parameters.
   * @returns A paginated result containing roles list and metadata.
   */
  async listRolesPaginated(query: RoleListQuery): Promise<PaginatedRolesDto> {
    const {
      page = 1,
      limit = 50,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = SORT_ORDER.DESC,
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.AppRoleWhereInput = { deletedAt: null }

    // Apply trimmed text search on name or description (case-insensitive)
    if (search) {
      const trimmedSearch = search.trim()
      where.OR = [
        { name: { contains: trimmedSearch, mode: "insensitive" } },
        { description: { contains: trimmedSearch, mode: "insensitive" } },
      ]
    }

    // Apply active status filter if provided
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Define ordering criteria dynamically
    const orderBy: Prisma.AppRoleOrderByWithRelationInput = {
      [sortBy]: sortOrder === SORT_ORDER.ASC ? SORT_ORDER.ASC : SORT_ORDER.DESC,
    }

    // Fetch data and count concurrently
    const [data, total] = await Promise.all([
      this.prisma.appRole.findMany({
        where,
        orderBy,
        skip: Number(skip),
        take: Number(limit),
        include: {
          _count: {
            select: {
              permissions: true,
              employees: true,
            },
          },
        },
      }),
      this.prisma.appRole.count({ where }),
    ])

    return {
      data: data.map((role) => this.mapToDomain(role)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Finds an active role by its unique ID.
   * Excludes soft-deleted records.
   * @param id The role ID.
   * @returns The AppRole domain object if found, otherwise null.
   */
  async findById(id: string): Promise<AppRole | null> {
    const role = await this.prisma.appRole.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            permissions: true,
            employees: true,
          },
        },
      },
    })
    if (!role) return null
    return this.mapToDomain(role)
  }

  /**
   * Finds active roles matching a list of unique IDs.
   * @param ids The list of role IDs.
   * @returns List of active roles.
   */
  async findActiveByIds(ids: string[]): Promise<AppRole[]> {
    const roles = await this.prisma.appRole.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            permissions: true,
            employees: true,
          },
        },
      },
    })
    return roles.map((role) => this.mapToDomain(role))
  }

  /**
   * Finds a role by its unique name.
   * @param name The role name.
   * @param includeSoftDeleted Flag to indicate if soft-deleted records should be included.
   * @returns The AppRole domain object if found, otherwise null.
   */
  async findByName(name: string, includeSoftDeleted = false): Promise<AppRole | null> {
    const where: Prisma.AppRoleWhereInput = {
      name: { equals: name, mode: "insensitive" },
    }
    if (!includeSoftDeleted) {
      where.deletedAt = null
    }

    const role = await this.prisma.appRole.findFirst({
      where,
      include: {
        _count: {
          select: {
            permissions: true,
            employees: true,
          },
        },
      },
    })
    if (!role) return null
    return this.mapToDomain(role)
  }

  /**
   * Persists a new role record in the database.
   * @param data DTO containing the role details.
   * @returns The newly created AppRole domain object.
   */
  async createRole(data: CreateRoleDto): Promise<AppRole> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.appRole.updateMany({
          where: { deletedAt: null },
          data: { isDefault: false },
        })
      }
      const role = await tx.appRole.create({
        data: {
          name: data.name,
          description: data.description || null,
          createdBy: data.createdBy || null,
          isAdministrative: data.isAdministrative || false,
          isDefault: data.isDefault || false,
        },
      })
      return this.mapToDomain(role)
    })
  }

  /**
   * Updates an existing role's details.
   * @param id The ID of the role to update.
   * @param data DTO containing partial updates.
   * @returns The updated AppRole domain object, or null if update fails.
   */
  async updateRole(id: string, data: UpdateRoleDto): Promise<AppRole | null> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.appRole.findFirst({
        where: { id, deletedAt: null },
      })

      if (!record) return null

      // If deactivating the role or disabling default role, enforce locks & checks
      if (data.isActive === false && record.isDefault) {
        throw new Error(ROLE_ERROR_CODES.CANNOT_DEACTIVATE_DEFAULT_ROLE)
      }
      if (data.isDefault === false && record.isDefault) {
        throw new Error(ROLE_ERROR_CODES.CANNOT_DISABLE_ONLY_DEFAULT_ROLE)
      }

      if (data.isActive === false) {
        // Locking is based on the case-normalized role name "admin" because the unique constraint on the name field is case-sensitive, allowing different cases like "Admin" and "admin" to coexist. Normalized lock LOWER(TRIM(name)) = 'admin' ensures deactivating/deleting any of these active roles named "Admin" (case-insensitively) will acquire a lock on ALL of them, preventing race conditions.
        await tx.$executeRaw`
          SELECT id FROM roles 
          WHERE LOWER(TRIM(name)) = 'admin' 
            AND "deletedAt" IS NULL 
          FOR UPDATE
        `

        if (record.name.trim().toLowerCase() === "admin") {
          const remainingAdminUsers = await this.countRemainingAdminUsers(id, tx)
          if (remainingAdminUsers === 0) {
            throw new Error(ROLE_ERROR_CODES.CANNOT_REMOVE_LAST_ADMIN)
          }
        }
      }

      if (data.isDefault === true) {
        await tx.appRole.updateMany({
          where: { id: { not: id }, deletedAt: null },
          data: { isDefault: false },
        })
      }

      const role = await tx.appRole.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          updatedBy: data.updatedBy,
          isAdministrative: data.isAdministrative,
          isDefault: data.isDefault,
        },
      })
      return this.mapToDomain(role)
    })
  }

  /**
   * Performs a soft delete on a role record.
   * Sets deletedAt, renames the unique name, and updates auditor fields.
   * @param id The ID of the role to delete.
   * @param actorId The ID of the employee performing the delete.
   * @returns A boolean representing whether the soft delete succeeded.
   */
  async deleteRole(id: string, actorId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      // Locking is based on the case-normalized role name "admin" because the unique constraint on the name field is case-sensitive, allowing different cases like "Admin" and "admin" to coexist. Normalized lock LOWER(TRIM(name)) = 'admin' ensures deactivating/deleting any of these active roles named "Admin" (case-insensitively) will acquire a lock on ALL of them, preventing race conditions.
      await tx.$executeRaw`
        SELECT id FROM roles 
        WHERE LOWER(TRIM(name)) = 'admin' 
          AND "deletedAt" IS NULL 
        FOR UPDATE
      `

      const record = await tx.appRole.findFirst({
        where: { id, deletedAt: null },
      })
      if (!record) return false

      // Verify system role protection
      if (record.isSystem) {
        throw new Error(ROLE_ERROR_CODES.ROLE_SYSTEM_PROTECTED)
      }

      // Verify deleting this role doesn't leave the system with 0 active admins
      if (record.name.trim().toLowerCase() === "admin") {
        const remainingAdminUsers = await this.countRemainingAdminUsers(id, tx)
        if (remainingAdminUsers === 0) {
          throw new Error(ROLE_ERROR_CODES.CANNOT_REMOVE_LAST_ADMIN)
        }
      }

      // Verify deleting this role doesn't remove the default role
      if (record.isDefault) {
        throw new Error(ROLE_ERROR_CODES.CANNOT_DELETE_DEFAULT_ROLE)
      }

      // Check employee assignments
      const employeesCount = await tx.employeeRole.count({
        where: { roleId: id },
      })
      if (employeesCount > 0) {
        throw new Error(ROLE_ERROR_CODES.ROLE_ASSIGNED_EMPLOYEE)
      }

      // Check permission assignments
      const permissionsCount = await tx.rolePermission.count({
        where: { roleId: id },
      })
      if (permissionsCount > 0) {
        throw new Error(ROLE_ERROR_CODES.ROLE_ASSIGNED_PERMISSION)
      }

      await tx.appRole.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: actorId,
        },
      })
      return true
    })
  }

  /**
   * Counts the number of employee assignments for a role.
   * @param id The role ID.
   * @returns The count of assignments.
   */
  async countEmployeeAssignments(id: string): Promise<number> {
    return this.prisma.employeeRole.count({
      where: {
        roleId: id,
      },
    })
  }

  /**
   * Counts the number of permission assignments for a role.
   * @param id The role ID.
   * @returns The count of assignments.
   */
  async countPermissionAssignments(id: string): Promise<number> {
    return this.prisma.rolePermission.count({
      where: {
        roleId: id,
      },
    })
  }

  /**
   * Counts the number of active employees that possess administrative authority, excluding a specific role.
   * Considers static admin role and dynamic admin role assignments.
   * Temporary cross-domain query for Sprint D2.2. Will be migrated to EmployeeRepository or AdminRepository in future sprints.
   * @param roleId The role ID to exclude from dynamic assignments.
   * @param tx Optional Prisma transaction client to execute the query within an active transaction.
   * @returns The count of active admin employees.
   */
  async countRemainingAdminUsers(roleId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx || this.prisma
    return client.employee.count({
      where: {
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              name: { equals: "Admin", mode: "insensitive" },
              isActive: true,
              deletedAt: null,
              id: { not: roleId },
            },
          },
        },
      },
    })
  }

  /**
   * Performs operations for mapPermissionToDomain.
   */
  private mapPermissionToDomain(permission: any): Permission {
    return {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      module: permission.module,
      description: permission.description,
      isActive: permission.isActive,
      isSystem: permission.isSystem,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      createdBy: permission.createdBy,
      updatedBy: permission.updatedBy,
      deletedAt: permission.deletedAt,
    }
  }

  /**
   * Performs operations for findPermissionsByRoleId.
   */
  async findPermissionsByRoleId(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: {
          deletedAt: null,
        },
      },
      include: {
        permission: true,
      },
    })
    return rolePermissions.map((rp) => this.mapPermissionToDomain(rp.permission))
  }

  /**
   * Performs operations for assignPermission.
   */
  async assignPermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }> {
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    })
    if (existing) {
      return { success: true, created: false }
    }
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        assignedBy: actorId,
      },
    })
    return { success: true, created: true }
  }

  /**
   * Performs operations for revokePermission.
   */
  async revokePermission(roleId: string, permissionId: string): Promise<boolean> {
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    })
    if (!existing) {
      return false
    }
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    })
    return true
  }

  /**
   * Performs operations for updatePermissions.
   */
  async updatePermissions(
    roleId: string,
    permissionIds: string[],
    actorId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Exclusive lock on the role record to serialize concurrent updates
      await tx.$queryRawUnsafe('SELECT id FROM "roles" WHERE id = $1 FOR UPDATE', roleId)

      await tx.rolePermission.deleteMany({
        where: { roleId },
      })
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
            assignedBy: actorId,
          })),
        })
      }
    })
  }
}
