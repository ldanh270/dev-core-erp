import { PROTECTED_PERMISSIONS } from "@/configs/auth/auth.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  AppRole,
  CreateRoleDto,
  IRoleRepository,
  IRoleService,
  PaginatedRolesDto,
  Permission,
  RoleListQuery,
  UpdateRoleDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { auditService } from "./audit.service.ts"
import { authorizationService } from "./authorization.service.ts"

/**
 * Service class implementing the business logic for AppRole CRUD operations.
 */
export class RoleService implements IRoleService {
  /**
   * Initializes the service with the AppRole repository.
   * @param repository Concrete implementation of IRoleRepository.
   */
  constructor(private repository: IRoleRepository) {}

  /**
   * Lists roles with pagination and filtering.
   * @param query Filtering and pagination query parameters.
   * @returns A paginated list of AppRole records.
   */
  async listRoles(query: RoleListQuery): Promise<PaginatedRolesDto> {
    return this.repository.listRolesPaginated(query)
  }

  /**
   * Retrieves details of a specific role by ID.
   * @param id The role ID.
   * @returns The AppRole object or null.
   * @throws {AppError} If role is not found.
   */
  async getRole(id: string): Promise<AppRole | null> {
    const role = await this.repository.findById(id)
    if (!role) {
      throw new AppError("Role not found", HttpStatusCode.NOT_FOUND, "RoleService")
    }
    return role
  }

  /**
   * Creates a new role record.
   * Enforces case-insensitive uniqueness on role name.
   * @param data DTO containing role data and the creator actorId.
   * @returns The newly created AppRole record.
   */
  async createRole(data: CreateRoleDto & { actorId: string }): Promise<AppRole> {
    const trimmedName = data.name.trim()

    // Check if role name already exists case-insensitively (active only)
    const existing = await this.repository.findByName(trimmedName)
    if (existing) {
      throw new AppError(
        `Role with name '${trimmedName}' already exists.`,
        HttpStatusCode.CONFLICT,
        "RoleService",
      )
    }

    const role = await this.repository.createRole({
      name: trimmedName,
      description: data.description,
      createdBy: data.actorId,
      isDefault: data.isDefault,
    })

    await auditService.log({
      actorId: data.actorId,
      targetRoleId: role.id,
      action: "ROLE_CREATED",
      newValue: { name: role.name, description: role.description, isDefault: role.isDefault },
    })

    return role
  }

  /**
   * Updates an existing role record.
   * Enforces system role rules and case-insensitive unique checks.
   * @param id The role ID to update.
   * @param data DTO containing updates and the updater actorId.
   * @returns The updated AppRole record or null.
   */
  async updateRole(id: string, data: UpdateRoleDto & { actorId: string }): Promise<AppRole | null> {
    const current = await this.getRole(id)
    if (!current) return null

    // Enforce Admin role protection rules
    if (current.name.toLowerCase() === "admin") {
      const isNameChanged =
        data.name !== undefined && data.name.trim().toLowerCase() !== current.name.toLowerCase()
      if (isNameChanged) {
        throw new AppError(
          "Cannot rename the Admin role.",
          HttpStatusCode.FORBIDDEN,
          "RoleService",
          "SYSTEM_ROLE_PROTECTED",
        )
      }
    }

    // If deactivating a role, check if it's an Admin role and if it leaves 0 active admin users
    if (data.isActive === false && current.name.trim().toLowerCase() === "admin") {
      const remainingAdminUsers = await this.repository.countRemainingAdminUsers(id)
      if (remainingAdminUsers === 0) {
        throw new AppError(
          "Cannot deactivate the last active Admin role assignment in the system.",
          HttpStatusCode.CONFLICT,
          "RoleService",
        )
      }
    }

    let trimmedName: string | undefined
    if (data.name) {
      trimmedName = data.name.trim()

      // If name is being updated, verify uniqueness case-insensitively (excluding current record)
      if (trimmedName.toLowerCase() !== current.name.toLowerCase()) {
        const duplicate = await this.repository.findByName(trimmedName)
        if (duplicate && duplicate.id !== id) {
          throw new AppError(
            `Role with name '${trimmedName}' already exists.`,
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
      }
    }

    try {
      const updated = await this.repository.updateRole(id, {
        name: trimmedName,
        description: data.description,
        isActive: data.isActive,
        updatedBy: data.actorId,
        isDefault: data.isDefault,
      })
      if (updated) {
        await authorizationService.invalidateRoleCache(id)
        await auditService.log({
          actorId: data.actorId,
          targetRoleId: id,
          action: "ROLE_UPDATED",
          oldValue: {
            name: current.name,
            description: current.description,
            isActive: current.isActive,
            isDefault: current.isDefault,
          },
          newValue: {
            name: updated.name,
            description: updated.description,
            isActive: updated.isActive,
            isDefault: updated.isDefault,
          },
        })
      }
      return updated
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "CANNOT_REMOVE_LAST_ADMIN") {
          throw new AppError(
            "Cannot deactivate the last active Admin role assignment in the system.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
        if (error.message === "CANNOT_DEACTIVATE_DEFAULT_ROLE") {
          throw new AppError(
            "Cannot deactivate the default role. Assign another role as default first.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
        if (error.message === "CANNOT_DISABLE_ONLY_DEFAULT_ROLE") {
          throw new AppError(
            "Cannot disable the only default role. Assign another role as default first.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
      }
      throw error
    }
  }

  /**
   * Soft deletes a role.
   * Enforces system role constraints, role mappings, and Admin count protection.
   * @param id The ID of the role to delete.
   * @param actorId The ID of the employee performing the delete.
   * @returns A boolean indicating whether the delete succeeded.
   * @throws {AppError} If role is not found or constraints fail.
   */
  async deleteRole(id: string, actorId: string): Promise<boolean> {
    const current = await this.getRole(id)
    if (!current) return false

    // Block deleting the Admin role for safety
    if (current.name.toLowerCase() === "admin") {
      throw new AppError(
        "Cannot delete the Admin role.",
        HttpStatusCode.FORBIDDEN,
        "RoleService",
        "SYSTEM_ROLE_PROTECTED",
      )
    }

    // Block deleting the last active Admin role assignment in the system
    const isAdminRole = current.name.trim().toLowerCase() === "admin"
    if (isAdminRole) {
      const remainingAdminUsers = await this.repository.countRemainingAdminUsers(id)
      if (remainingAdminUsers === 0) {
        throw new AppError(
          "Cannot delete the last admin role assignment in the system.",
          HttpStatusCode.CONFLICT,
          "RoleService",
        )
      }
    }

    try {
      // Invalidate cache for employees having this role before deleting the mappings
      await authorizationService.invalidateRoleCache(id)
      const deleted = await this.repository.deleteRole(id, actorId)
      if (deleted) {
        await auditService.log({
          actorId: actorId,
          targetRoleId: id,
          action: "ROLE_DELETED",
        })
      }
      return deleted
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "CANNOT_REMOVE_LAST_ADMIN") {
          throw new AppError(
            "Cannot delete the last admin role assignment in the system.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
        if (error.message === "CANNOT_DELETE_DEFAULT_ROLE") {
          throw new AppError(
            "Cannot delete the default role. Assign another role as default first.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
        if (error.message === "ROLE_SYSTEM_PROTECTED") {
          throw new AppError(
            "Cannot delete system roles.",
            HttpStatusCode.FORBIDDEN,
            "RoleService",
            "SYSTEM_ROLE_PROTECTED",
          )
        }
        if (error.message === "ROLE_ASSIGNED_EMPLOYEE") {
          throw new AppError(
            "Role is assigned to one or more employees.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
        if (error.message === "ROLE_ASSIGNED_PERMISSION") {
          throw new AppError(
            "Role is assigned to one or more permissions.",
            HttpStatusCode.CONFLICT,
            "RoleService",
          )
        }
      }
      throw error
    }
  }

  /**
   * Retrieves permissions currently assigned to a specific role.
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.repository.findById(roleId)
    if (!role) {
      throw new AppError("Role not found", HttpStatusCode.NOT_FOUND, "RoleService")
    }
    return this.repository.findPermissionsByRoleId(roleId)
  }

  /**
   * Assigns a permission to a role after validating role, permission, and protected access rules.
   */
  async assignPermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }> {
    const role = await this.repository.findById(roleId)
    if (!role) {
      throw new AppError("Role not found", HttpStatusCode.NOT_FOUND, "RoleService")
    }
    const permission = await prisma.permission.findFirst({
      where: { id: permissionId, deletedAt: null, isActive: true },
    })
    if (!permission) {
      throw new AppError(
        "Permission not found or inactive",
        HttpStatusCode.NOT_FOUND,
        "RoleService",
      )
    }

    if (PROTECTED_PERMISSIONS.includes(permission.code) && actorId) {
      const actorContext = await authorizationService.getAuthorizationContext(actorId)
      if (!actorContext.isDynamicAdmin) {
        throw new AppError(
          "Only administrators can assign protected permissions.",
          HttpStatusCode.FORBIDDEN,
          "RoleService",
          "FORBIDDEN",
        )
      }
    }

    const res = await this.repository.assignPermission(roleId, permissionId, actorId)
    if (res.success) {
      await authorizationService.invalidateRoleCache(roleId)
      await auditService.log({
        actorId,
        targetRoleId: roleId,
        targetPermissionId: permissionId,
        action: "PERMISSION_ASSIGNED",
      })
    }
    return res
  }

  /**
   * Revokes a permission from a role while enforcing protected permission rules.
   */
  async revokePermission(roleId: string, permissionId: string, actorId?: string): Promise<boolean> {
    const perm = await prisma.permission.findFirst({
      where: { id: permissionId, deletedAt: null },
    })

    if (perm && PROTECTED_PERMISSIONS.includes(perm.code) && actorId) {
      const actorContext = await authorizationService.getAuthorizationContext(actorId)
      if (!actorContext.isDynamicAdmin) {
        throw new AppError(
          "Only administrators can revoke protected permissions.",
          HttpStatusCode.FORBIDDEN,
          "RoleService",
          "FORBIDDEN",
        )
      }
    }

    const res = await this.repository.revokePermission(roleId, permissionId)
    if (res) {
      await authorizationService.invalidateRoleCache(roleId)
      await auditService.log({
        actorId,
        targetRoleId: roleId,
        targetPermissionId: permissionId,
        action: "PERMISSION_REVOKED",
      })
    }
    return res
  }

  /**
   * Replaces the full permission set of a role after validating affected permissions.
   */
  async updatePermissions(
    roleId: string,
    permissionIds: string[],
    actorId?: string,
  ): Promise<void> {
    const role = await this.repository.findById(roleId)
    if (!role) {
      throw new AppError("Role not found", HttpStatusCode.NOT_FOUND, "RoleService")
    }

    // Find current permissions
    const currentPermissions = await this.repository.findPermissionsByRoleId(roleId)

    // Check if all new permissionIds exist and are active
    let perms: { id: string; code: string }[] = []
    if (permissionIds.length > 0) {
      perms = await prisma.permission.findMany({
        where: {
          id: { in: permissionIds },
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, code: true },
      })
      if (perms.length !== permissionIds.length) {
        throw new AppError(
          "One or more permissions not found or inactive",
          HttpStatusCode.NOT_FOUND,
          "RoleService",
        )
      }
    }

    // Hardening check: verify only admin can link/unlink protected permissions
    const currentIds = currentPermissions.map((p) => p.id)
    const addedIds = permissionIds.filter((id) => !currentIds.includes(id))
    const removedIds = currentIds.filter((id) => !permissionIds.includes(id))
    const affectedIds = [...addedIds, ...removedIds]

    if (affectedIds.length > 0 && actorId) {
      const affectedCodes: string[] = []
      for (const id of affectedIds) {
        const p = currentPermissions.find((cp) => cp.id === id) || perms.find((np) => np.id === id)
        if (p) {
          affectedCodes.push(p.code)
        }
      }

      const hasProtected = affectedCodes.some((code) => PROTECTED_PERMISSIONS.includes(code))
      if (hasProtected) {
        const actorContext = await authorizationService.getAuthorizationContext(actorId)
        if (!actorContext.isDynamicAdmin) {
          throw new AppError(
            "Only administrators can assign protected permissions.",
            HttpStatusCode.FORBIDDEN,
            "RoleService",
            "FORBIDDEN",
          )
        }
      }
    }

    const oldPermissionIds = currentPermissions.map((p) => p.id)

    await this.repository.updatePermissions(roleId, permissionIds, actorId)
    await authorizationService.invalidateRoleCache(roleId)

    await auditService.log({
      actorId,
      targetRoleId: roleId,
      action: "PERMISSION_REPLACED",
      oldValue: { permissionIds: oldPermissionIds },
      newValue: { permissionIds },
    })
  }
}
