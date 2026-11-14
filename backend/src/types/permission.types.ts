import { SORT_ORDER } from "@/configs/system/db.config.ts"

/**
 * Domain interface representing a Permission.
 */
export interface Permission {
  id: string
  name: string
  code: string
  module: string
  description: string | null
  isActive: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
  updatedBy: string | null
  deletedAt: Date | null
}

/**
 * DTO for creating a new Permission.
 */
export interface CreatePermissionDto {
  name: string
  code: string
  module: string
  description?: string | null
  createdBy?: string
}

/**
 * DTO for updating an existing Permission.
 */
export interface UpdatePermissionDto {
  name?: string
  code?: string
  module?: string
  description?: string | null
  isActive?: boolean
  updatedBy?: string
}

/**
 * Query parameters structure for listing permissions.
 */
export interface PermissionListQuery {
  page?: number
  limit?: number
  search?: string
  module?: string
  sortBy?: "name" | "code" | "module" | "createdAt"
  sortOrder?: (typeof SORT_ORDER)[keyof typeof SORT_ORDER]
}

/**
 * DTO for a paginated list of permissions.
 */
export interface PaginatedPermissionsDto {
  data: Permission[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Interface boundary for Permission repository database queries.
 */
export interface IPermissionRepository {
  listPermissionsPaginated(query: PermissionListQuery): Promise<PaginatedPermissionsDto>
  findById(id: string): Promise<Permission | null>
  findByCode(code: string, includeSoftDeleted?: boolean): Promise<Permission | null>
  createPermission(data: CreatePermissionDto): Promise<Permission>
  updatePermission(id: string, data: UpdatePermissionDto): Promise<Permission | null>
  deletePermission(id: string, actorId: string): Promise<boolean>
  countRoleAssignments(id: string): Promise<number>
}

/**
 * Interface boundary for Permission service business logic.
 */
export interface IPermissionService {
  listPermissions(query: PermissionListQuery): Promise<PaginatedPermissionsDto>
  getPermission(id: string): Promise<Permission | null>
  createPermission(data: CreatePermissionDto & { actorId: string }): Promise<Permission>
  updatePermission(
    id: string,
    data: UpdatePermissionDto & { actorId: string },
  ): Promise<Permission | null>
  deletePermission(id: string, actorId: string): Promise<boolean>
}
