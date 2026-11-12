import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { PERMISSION_ERROR_CODES } from "@/constants/permission.constants.ts"
import {
  CreatePermissionDto,
  IPermissionRepository,
  PaginatedPermissionsDto,
  Permission,
  PermissionListQuery,
  UpdatePermissionDto,
} from "@/types"

import { Prisma, PrismaClient, Permission as PrismaPermission } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for managing Permission data in PostgreSQL using Prisma.
 * Implements the IPermissionRepository contract and extends BaseRepository.
 */
export class PrismaPermissionRepository extends BaseRepository implements IPermissionRepository {
  /**
   * Initializes the repository with the PrismaClient.
   * @param prisma The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps a database Prisma permission record to the application domain Permission type.
   * @param permission The PrismaPermission record from database.
   * @returns The mapped Permission domain object.
   * @protected
   */
  protected mapToDomain(permission: PrismaPermission): Permission {
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
   * Retrieves a paginated and filtered list of permissions.
   * Excludes soft-deleted permissions.
   * @param query Filtering and pagination parameters.
   * @returns A paginated result containing permission data list and metadata.
   */
  async listPermissionsPaginated(query: PermissionListQuery): Promise<PaginatedPermissionsDto> {
    const {
      page = 1,
      limit = 50,
      search,
      module: moduleFilter,
      sortBy = "createdAt",
      sortOrder = SORT_ORDER.DESC,
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.PermissionWhereInput = { deletedAt: null }

    // Apply text search on name or code (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }

    // Apply optional module filter
    if (moduleFilter) {
      where.module = { equals: moduleFilter, mode: "insensitive" }
    }

    // Define ordering criteria dynamically
    const orderBy: Prisma.PermissionOrderByWithRelationInput = {
      [sortBy]: sortOrder === SORT_ORDER.ASC ? SORT_ORDER.ASC : SORT_ORDER.DESC,
    }

    // Fetch data and count concurrently
    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        orderBy,
        skip: Number(skip),
        take: Number(limit),
      }),
      this.prisma.permission.count({ where }),
    ])

    return {
      data: data.map((permission) => this.mapToDomain(permission)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Finds an active permission by its unique ID.
   * Excludes soft-deleted records.
   * @param id The permission ID.
   * @returns The Permission domain object if found, otherwise null.
   */
  async findById(id: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
    })
    if (!permission) return null
    return this.mapToDomain(permission)
  }

  /**
   * Finds a permission by its unique code.
   * @param code The permission code.
   * @param includeSoftDeleted Flag to indicate if soft-deleted records should be included.
   * @returns The Permission domain object if found, otherwise null.
   */
  async findByCode(code: string, includeSoftDeleted = false): Promise<Permission | null> {
    const where: Prisma.PermissionWhereInput = { code }
    if (!includeSoftDeleted) {
      where.deletedAt = null
    }

    const permission = await this.prisma.permission.findFirst({ where })
    if (!permission) return null
    return this.mapToDomain(permission)
  }

  /**
   * Persists a new permission record in the database.
   * @param data DTO containing the permission details.
   * @returns The newly created Permission domain object.
   */
  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    const permission = await this.prisma.permission.create({
      data: {
        name: data.name,
        code: data.code,
        module: data.module,
        description: data.description || null,
        createdBy: data.createdBy || null,
      },
    })
    return this.mapToDomain(permission)
  }

  /**
   * Updates an existing permission's details.
   * @param id The ID of the permission to update.
   * @param data DTO containing partial updates.
   * @returns The updated Permission domain object, or null if update fails.
   */
  async updatePermission(id: string, data: UpdatePermissionDto): Promise<Permission | null> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        module: data.module,
        description: data.description,
        isActive: data.isActive,
        updatedBy: data.updatedBy,
      },
    })
    return this.mapToDomain(permission)
  }

  /**
   * Performs a soft delete on a permission record.
   * Sets deletedAt, renames the unique code, and updates auditor fields.
   * @param id The ID of the permission to delete.
   * @param actorId The ID of the employee performing the delete.
   * @returns A boolean representing whether the soft delete succeeded.
   */
  async deletePermission(id: string, actorId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.permission.findFirst({
        where: { id, deletedAt: null },
      })
      if (!record) return false

      const assignmentsCount = await tx.rolePermission.count({
        where: { permissionId: id },
      })
      if (assignmentsCount > 0) {
        throw new Error(PERMISSION_ERROR_CODES.ASSIGNED)
      }

      await tx.permission.update({
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
   * Counts the number of role-permission assignments for a permission.
   * Used for delete constraint checks.
   * @param id The permission ID.
   * @returns The count of assignments.
   */
  async countRoleAssignments(id: string): Promise<number> {
    return this.prisma.rolePermission.count({
      where: {
        permissionId: id,
      },
    })
  }
}
