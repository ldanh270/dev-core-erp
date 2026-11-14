import { CUSTOM_QUERY_TYPE } from "@/configs/entities/project.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import {
  CreateCustomQueryDto,
  CustomQuery,
  CustomQueryType,
  ICustomQueryRepository,
} from "@/types/custom-query.types.ts"

import { Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaCustomQueryRepository extends BaseRepository implements ICustomQueryRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findByEmployee(
    employeeId: string,
    projectId?: string | null,
    type?: CustomQueryType,
  ): Promise<CustomQuery[]> {
    const whereClause: Prisma.CustomQueryWhereInput = {
      employeeId,
      type: type === undefined ? undefined : type,
    }

    if (projectId !== undefined) {
      if (projectId === null) {
        whereClause.projectId = null
      } else {
        whereClause.OR = [{ projectId: projectId }, { projectId: null }]
      }
    }

    return this.prisma.customQuery.findMany({
      where: whereClause,
      orderBy: {
        createdAt: SORT_ORDER.DESC,
      },
    })
  }

  async findById(id: string): Promise<CustomQuery | null> {
    return this.prisma.customQuery.findUnique({
      where: { id },
    })
  }

  async create(data: CreateCustomQueryDto & { employeeId: string }): Promise<CustomQuery> {
    return this.prisma.customQuery.create({
      data: {
        name: data.name,
        type: data.type || CUSTOM_QUERY_TYPE.GANTT,
        projectId: data.projectId || null,
        employeeId: data.employeeId,
        queryData: data.queryData,
      },
    })
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.prisma.customQuery.delete({
      where: { id },
    })
    return !!deleted
  }
}
