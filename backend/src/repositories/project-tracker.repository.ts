import {
  CreateProjectTrackerDto,
  IProjectTrackerRepository,
  ProjectTracker,
  UpdateProjectTrackerDto,
} from "@/types"

import { PrismaClient, ProjectTracker as PrismaProjectTracker } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository handling Prisma operations for Project-scoped Task Trackers.
 */
export class ProjectTrackerRepository extends BaseRepository implements IProjectTrackerRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Helper to map Prisma entity to domain type.
   * @param tracker - Prisma project tracker record.
   * @returns Domain project tracker.
   */
  private mapToDomain(tracker: PrismaProjectTracker): ProjectTracker {
    return {
      id: tracker.id,
      projectId: tracker.projectId,
      name: tracker.name,
      code: tracker.code,
      isActive: tracker.isActive,
      createdAt: tracker.createdAt,
      updatedAt: tracker.updatedAt,
    }
  }

  /**
   * Lists all task trackers configured in a project.
   * @param projectId - Project ID.
   * @returns Array of task trackers.
   */
  async list(projectId: string): Promise<ProjectTracker[]> {
    const list = await this.prisma.projectTracker.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    })
    return list.map((t) => this.mapToDomain(t))
  }

  /**
   * Finds a task tracker by its unique identifier.
   * @param id - Tracker ID.
   * @returns The tracker or null.
   */
  async findById(id: string): Promise<ProjectTracker | null> {
    const tracker = await this.prisma.projectTracker.findUnique({
      where: { id },
    })
    return tracker ? this.mapToDomain(tracker) : null
  }

  /**
   * Creates a new project task tracker record.
   * @param projectId - Project ID.
   * @param data - Tracker details.
   * @returns The created project tracker.
   */
  async create(
    projectId: string,
    data: CreateProjectTrackerDto & { code: string },
  ): Promise<ProjectTracker> {
    const tracker = await this.prisma.projectTracker.create({
      data: {
        projectId,
        name: data.name,
        code: data.code,
        isActive: data.isActive ?? true,
      },
    })
    return this.mapToDomain(tracker)
  }

  /**
   * Updates an existing project task tracker record.
   * @param id - Tracker ID.
   * @param data - Updated tracker details.
   * @returns The updated project tracker or null.
   */
  async update(
    id: string,
    data: UpdateProjectTrackerDto & { code?: string },
  ): Promise<ProjectTracker | null> {
    const tracker = await this.prisma.projectTracker.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        isActive: data.isActive,
      },
    })
    return this.mapToDomain(tracker)
  }

  /**
   * Deletes a project task tracker.
   * @param id - Tracker ID.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.projectTracker.delete({
      where: { id },
    })
  }

  /**
   * Seed/batch creates default task trackers for a project.
   * @param projectId - Project ID.
   * @param trackers - Array of tracker details.
   */
  async createMany(
    projectId: string,
    trackers: Array<{ name: string; code: string; isActive: boolean }>,
  ): Promise<void> {
    await this.prisma.projectTracker.createMany({
      data: trackers.map((t) => ({
        projectId,
        name: t.name,
        code: t.code,
        isActive: t.isActive,
      })),
    })
  }
}
