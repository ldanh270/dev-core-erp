import { SORT_ORDER } from "@/configs/system/db.config.ts"

import { Prisma } from "@prisma/client"

import { Permission } from "./permission.types.ts"

/**
 * Domain interface representing an AppRole.
 */
export interface AppRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  isAdministrative: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
  updatedBy: string | null
  deletedAt: Date | null
  permissionsCount?: number
  employeesCount?: number
}

/**
 * DTO for creating a new Role.
 */
export interface CreateRoleDto {
  name: string
  description?: string | null
  createdBy?: string
  isAdministrative?: boolean
  isDefault?: boolean
}

/**
 * DTO for updating an existing Role.
 */
export interface UpdateRoleDto {
  name?: string
  description?: string | null
  isActive?: boolean
  updatedBy?: string
  isAdministrative?: boolean
  isDefault?: boolean
}

/**
 * Query parameters structure for listing roles.
 */
export interface RoleListQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: "name" | "isActive" | "createdAt" | "updatedAt"
  sortOrder?: (typeof SORT_ORDER)[keyof typeof SORT_ORDER]
}

/**
 * DTO for a paginated list of roles.
 */
export interface PaginatedRolesDto {
  data: AppRole[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Interface boundary for Role repository database queries.
 */
export interface IRoleRepository {
  listRolesPaginated(query: RoleListQuery): Promise<PaginatedRolesDto>
  findById(id: string): Promise<AppRole | null>
  findActiveByIds(ids: string[]): Promise<AppRole[]>
  findByName(name: string, includeSoftDeleted?: boolean): Promise<AppRole | null>
  createRole(data: CreateRoleDto): Promise<AppRole>
  updateRole(id: string, data: UpdateRoleDto): Promise<AppRole | null>
  deleteRole(id: string, actorId: string): Promise<boolean>
  countEmployeeAssignments(id: string): Promise<number>
  countPermissionAssignments(id: string): Promise<number>
  countRemainingAdminUsers(roleId: string, tx?: Prisma.TransactionClient): Promise<number>
  /** Find permissions assigned to a role */
  findPermissionsByRoleId(roleId: string): Promise<Permission[]>
  /** Assign a permission to a role (Idempotent) */
  assignPermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }>
  /** Revoke a permission from a role (Idempotent) */
  revokePermission(roleId: string, permissionId: string): Promise<boolean>
  /** Bulk replace role permissions inside a transaction */
  updatePermissions(roleId: string, permissionIds: string[], actorId?: string): Promise<void>
}

/**
 * Interface boundary for Role service business logic.
 */
export interface IRoleService {
  listRoles(query: RoleListQuery): Promise<PaginatedRolesDto>
  getRole(id: string): Promise<AppRole | null>
  createRole(data: CreateRoleDto & { actorId: string }): Promise<AppRole>
  updateRole(id: string, data: UpdateRoleDto & { actorId: string }): Promise<AppRole | null>
  deleteRole(id: string, actorId: string): Promise<boolean>
  /** Find permissions assigned to a role */
  getRolePermissions(roleId: string): Promise<Permission[]>
  /** Assign a permission to a role */
  assignPermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }>
  /** Revoke a permission from a role */
  revokePermission(roleId: string, permissionId: string, actorId?: string): Promise<boolean>
  /** Bulk replace role permissions */
  updatePermissions(roleId: string, permissionIds: string[], actorId?: string): Promise<void>
}
