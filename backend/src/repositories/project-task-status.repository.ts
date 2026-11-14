import {
  CreateProjectTaskStatusDto,
  IProjectTaskStatusRepository,
  ProjectTaskStatus,
  UpdateProjectTaskStatusDto,
} from "@/types"

import { PrismaClient, ProjectTaskStatus as PrismaProjectTaskStatus } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository layer handling database query execution for project task custom statuses.
 * Implements IProjectTaskStatusRepository and interacts directly with PrismaClient.
 */
export class ProjectTaskStatusRepository
  extends BaseRepository
  implements IProjectTaskStatusRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps a Prisma database status record to a domain status model.
   */
  private mapToDomain(status: PrismaProjectTaskStatus): ProjectTaskStatus {
    return {
      id: status.id,
      projectId: status.projectId,
      name: status.name,
      color: status.color,
      order: status.order,
      isDefault: status.isDefault,
      isCompleted: status.isCompleted,
      createdAt: status.createdAt,
      updatedAt: status.updatedAt,
    }
  }

  /**
   * Finds a custom task status by its unique identifier.
   */
  async findById(id: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: { id },
    })
    return status ? this.mapToDomain(status) : null
  }

  /**
   * Finds a custom status inside a project using a compound key of projectId and name.
   */
  async findByProjectAndName(projectId: string, name: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
    })
    return status ? this.mapToDomain(status) : null
  }

  /**
   * Lists all custom statuses defined for a project ordered by sorting order ascending.
   */
  async listByProjectId(projectId: string): Promise<ProjectTaskStatus[]> {
    const list = await this.prisma.projectTaskStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    })
    return list.map((status) => this.mapToDomain(status))
  }

  /**
   * Inserts a new custom task status column into the database.
   */
  async create(data: CreateProjectTaskStatusDto): Promise<ProjectTaskStatus> {
    const status = await this.prisma.projectTaskStatus.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        color: data.color || "#A3A3A3",
        order: data.order ?? 0,
        isDefault: data.isDefault ?? false,
        isCompleted: data.isCompleted ?? false,
      },
    })
    return this.mapToDomain(status)
  }

  /**
   * Updates properties of an existing custom task status in the database.
   */
  async update(id: string, data: UpdateProjectTaskStatusDto): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        order: data.order,
        isDefault: data.isDefault,
        isCompleted: data.isCompleted,
      },
    })
    return this.mapToDomain(status)
  }

  /**
   * Deletes a custom task status from the database by ID.
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.projectTaskStatus.delete({
      where: { id },
    })
    return true
  }

  /**
   * Finds the custom status marked as default for a project.
   */
  async findDefaultStatus(projectId: string): Promise<ProjectTaskStatus | null> {
    const status = await this.prisma.projectTaskStatus.findFirst({
      where: { projectId, isDefault: true },
    })
    return status ? this.mapToDomain(status) : null
  }

  /**
   * Clears the default status flag from all status columns of a project.
   */
  async clearDefaultStatus(projectId: string): Promise<void> {
    await this.prisma.projectTaskStatus.updateMany({
      where: { projectId, isDefault: true },
      data: { isDefault: false },
    })
  }

  /**
   * Finds the maximum sorting order value across all custom statuses of a project.
   */
  async getMaxOrder(projectId: string): Promise<number> {
    const aggregate = await this.prisma.projectTaskStatus.aggregate({
      where: { projectId },
      _max: {
        order: true,
      },
    })
    return aggregate._max.order ?? -1
  }
}
