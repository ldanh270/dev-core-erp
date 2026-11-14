import { IApplicationType } from "@/types/attendance.types.ts"
import {
  CreatePositionDto,
  IPositionRepository,
  Position,
  ProjectPositionRule,
  UpdatePositionDto,
} from "@/types/position.types.ts"
import { TaskTracker } from "@/types/task.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository handling Prisma operations for Positions.
 */
export class PrismaPositionRepository extends BaseRepository implements IPositionRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Retrieves all non-deleted positions from the database.
   * @returns Array of positions.
   */
  async findAll(): Promise<Position[]> {
    const records = await this.prisma.position.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    })
    return records as unknown as Position[]
  }

  /**
   * Finds a single position by its unique identifier.
   * @param id - Position ID.
   * @returns The position record or null.
   */
  async findById(id: string): Promise<Position | null> {
    const record = await this.prisma.position.findFirst({
      where: { id, deletedAt: null },
    })
    return record as unknown as Position | null
  }

  /**
   * Finds a single position by its unique system code.
   * @param code - Position code string.
   * @returns The position record or null.
   */
  async findByCode(code: string): Promise<Position | null> {
    const record = await this.prisma.position.findFirst({
      where: { code, deletedAt: null },
    })
    return record as unknown as Position | null
  }

  /**
   * Creates a new position record.
   * @param data - Position details.
   * @returns The created position.
   */
  async create(data: CreatePositionDto): Promise<Position> {
    const record = await this.prisma.position.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        allowedTaskTrackers: data.allowedTaskTrackers || [],
        allowedApplicationTypes: data.allowedApplicationTypes || [],
      },
    })
    return record as unknown as Position
  }

  /**
   * Updates an existing position record.
   * @param id - Position ID.
   * @param data - Updated position details.
   * @returns The updated position.
   */
  async update(id: string, data: UpdatePositionDto): Promise<Position> {
    const record = await this.prisma.position.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        allowedTaskTrackers: data.allowedTaskTrackers,
        allowedApplicationTypes: data.allowedApplicationTypes,
      },
    })
    return record as unknown as Position
  }

  /**
   * Soft deletes a position record by setting its deletedAt timestamp.
   * @param id - Position ID.
   * @returns The soft-deleted position.
   */
  async delete(id: string): Promise<Position> {
    const record = await this.prisma.position.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    return record as unknown as Position
  }

  /**
   * Retrieves active project memberships for an employee.
   * @param employeeId - Employee ID.
   * @returns Array of active memberships with project metadata.
   */
  async findActiveProjectMemberships(
    employeeId: string,
  ): Promise<{ projectId: string; projectName: string }[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        employeeId,
        removedAt: null,
      },
      select: {
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    })
    return memberships.map((m) => ({
      projectId: m.projectId,
      projectName: m.project.name,
    }))
  }
}
