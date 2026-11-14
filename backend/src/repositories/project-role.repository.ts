import {
  CreateProjectRoleDto,
  IProjectRoleRepository,
  ProjectRole,
  UpdateProjectRoleDto,
} from "@/types"

import { PrismaClient, ProjectRole as PrismaProjectRole } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository handling Prisma operations for Project Member Roles.
 */
export class ProjectRoleRepository extends BaseRepository implements IProjectRoleRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Helper to map Prisma entity to domain type.
   * @param role - Prisma project role record.
   * @returns Domain project role.
   */
  private mapToDomain(role: PrismaProjectRole): ProjectRole {
    return {
      id: role.id,
      projectId: role.projectId,
      name: role.name,
      code: role.code,
      allowedTaskTrackers: role.allowedTaskTrackers,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }
  }

  /**
   * Lists all roles configured in a project.
   * @param projectId - Project ID.
   * @returns Array of roles.
   */
  async list(projectId: string): Promise<ProjectRole[]> {
    const list = await this.prisma.projectRole.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    })
    return list.map((r) => this.mapToDomain(r))
  }

  /**
   * Finds a project role by its unique identifier.
   * @param id - Role ID.
   * @returns The role or null.
   */
  async findById(id: string): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.findUnique({
      where: { id },
    })
    return role ? this.mapToDomain(role) : null
  }

  /**
   * Finds a project role by its unique code in a project.
   * @param projectId - Project ID.
   * @param code - Role code string.
   * @returns The role or null.
   */
  async findByCode(projectId: string, code: string): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.findUnique({
      where: {
        projectId_code: {
          projectId,
          code,
        },
      },
    })
    return role ? this.mapToDomain(role) : null
  }

  /**
   * Creates a new project role record.
   * @param projectId - Project ID.
   * @param data - Role details.
   * @returns The created project role.
   */
  async create(
    projectId: string,
    data: CreateProjectRoleDto & { code: string },
  ): Promise<ProjectRole> {
    const role = await this.prisma.projectRole.create({
      data: {
        projectId,
        name: data.name,
        code: data.code,
        allowedTaskTrackers: data.allowedTaskTrackers || [],
      },
    })
    return this.mapToDomain(role)
  }

  /**
   * Updates an existing project role record.
   * @param id - Role ID.
   * @param data - Updated role details.
   * @returns The updated project role or null.
   */
  async update(
    id: string,
    data: UpdateProjectRoleDto & { code?: string },
  ): Promise<ProjectRole | null> {
    const role = await this.prisma.projectRole.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        allowedTaskTrackers: data.allowedTaskTrackers,
      },
    })
    return this.mapToDomain(role)
  }

  /**
   * Deletes a project role.
   * @param id - Role ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.projectRole.delete({
      where: { id },
    })
  }

  /**
   * Seed/batch creates default roles for a project.
   * @param projectId - Project ID.
   * @param roles - Array of role details.
   */
  async createMany(
    projectId: string,
    roles: Array<{ name: string; code: string; allowedTaskTrackers: string[] }>,
  ): Promise<void> {
    await this.prisma.projectRole.createMany({
      data: roles.map((r) => ({
        projectId,
        name: r.name,
        code: r.code,
        allowedTaskTrackers: r.allowedTaskTrackers,
      })),
    })
  }
}
