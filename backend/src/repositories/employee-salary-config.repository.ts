import {
  EmployeeSalaryConfigWithTemplate,
  ICreateSalaryConfigDTO,
  IEmployeeSalaryConfigRepository,
} from "@/types/payroll.types.ts"

import { EmployeeSalaryConfig, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

const SALARY_CONFIG_ACTIVE_INCLUDE = {
  template: {
    include: {
      createdBy: {
        select: { fullName: true },
      },
      components: {
        include: {
          component: true,
        },
      },
    },
  },
} as const

export class PrismaEmployeeSalaryConfigRepository
  extends BaseRepository
  implements IEmployeeSalaryConfigRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findActiveByEmployee(
    employeeId: string,
    atDate: Date,
  ): Promise<EmployeeSalaryConfigWithTemplate | null> {
    return this.prisma.employeeSalaryConfig.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: atDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: atDate } }],
      },
      include: SALARY_CONFIG_ACTIVE_INCLUDE,
      orderBy: { effectiveFrom: "desc" },
    })
  }

  /** Batch-loads latest active salary config per employee in a single query. */
  async findActiveByEmployees(
    employeeIds: string[],
    atDate: Date,
  ): Promise<Map<string, EmployeeSalaryConfigWithTemplate>> {
    const result = new Map<string, EmployeeSalaryConfigWithTemplate>()
    if (employeeIds.length === 0) return result

    const configs = await this.prisma.employeeSalaryConfig.findMany({
      where: {
        employeeId: { in: employeeIds },
        effectiveFrom: { lte: atDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: atDate } }],
      },
      include: SALARY_CONFIG_ACTIVE_INCLUDE,
      orderBy: { effectiveFrom: "desc" },
    })

    for (const config of configs) {
      if (!result.has(config.employeeId)) {
        result.set(config.employeeId, config)
      }
    }
    return result
  }

  async findAllByEmployee(employeeId: string): Promise<EmployeeSalaryConfig[]> {
    return this.prisma.employeeSalaryConfig.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: "desc" },
      include: {
        template: true,
      },
    })
  }

  async create(
    data: ICreateSalaryConfigDTO & { employeeId: string; createdById: string },
  ): Promise<EmployeeSalaryConfig> {
    return this.prisma.employeeSalaryConfig.create({
      data: {
        employeeId: data.employeeId,
        templateId: data.templateId,
        baseSalary: data.baseSalary,
        effectiveFrom: data.effectiveFrom,
        note: data.note,

        createdById: data.createdById,
      },
    })
  }

  async closeCurrentConfig(employeeId: string, effectiveTo: Date): Promise<void> {
    await this.prisma.employeeSalaryConfig.updateMany({
      where: {
        employeeId,
        effectiveTo: null,
      },
      data: { effectiveTo },
    })
  }
}
