import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import {
  type IShiftScheduleWithDays,
  type IShiftScheduleWithTemplate,
  shiftScheduleWithDaysInclude,
  shiftScheduleWithTemplateInclude,
} from "@/types/shift-schedule.types.ts"
import { IAssignShiftScheduleDTO, IShiftScheduleRepository } from "@/types/shift.types.ts"
import { normalizeScheduleDate } from "@/utils/schedule.util.ts"

import { Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for recurring shift schedules using Prisma.
 */
export class PrismaShiftScheduleRepository
  extends BaseRepository
  implements IShiftScheduleRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<IShiftScheduleWithTemplate> {
    const { employeeId, validFrom, validTo, days, createdById, templateId, cycleWeeks } = data

    const scheduleData: Prisma.ShiftScheduleUncheckedCreateInput = {
      employeeId,
      validFrom: new Date(validFrom),
      validTo: validTo ? new Date(validTo) : undefined,
      createdById,
      ...(templateId != null ? { templateId } : {}),
      ...(cycleWeeks != null ? { cycleWeeks } : {}),
      days: days
        ? {
            create: days.map((day) => ({
              dayOfWeek: day.dayOfWeek,
              weekIndex: day.weekIndex ?? 0,
              shiftId: day.shiftId,
            })),
          }
        : undefined,
    }

    return this.prisma.shiftSchedule.create({
      data: scheduleData,
      include: shiftScheduleWithTemplateInclude,
    })
  }

  async getScheduleByEmployee(
    employeeId: string,
    date: string | Date,
  ): Promise<IShiftScheduleWithDays | null> {
    const targetDate = new Date(date)
    return this.prisma.shiftSchedule.findFirst({
      where: {
        employeeId,
        validFrom: { lte: targetDate },
        OR: [{ validTo: null }, { validTo: { gte: targetDate } }],
      },
      include: shiftScheduleWithDaysInclude,
      orderBy: { validFrom: "desc" },
    })
  }

  async listSchedulesByEmployee(employeeId: string): Promise<IShiftScheduleWithDays[]> {
    return this.prisma.shiftSchedule.findMany({
      where: { employeeId },
      include: shiftScheduleWithDaysInclude,
      orderBy: { validFrom: "desc" },
    })
  }

  async findEmployeeIdsWithActiveTemplateSchedule(date: Date): Promise<string[]> {
    const targetDate = normalizeScheduleDate(date)
    const rows = await this.prisma.shiftSchedule.findMany({
      where: {
        templateId: { not: null },
        validFrom: { lte: targetDate },
        OR: [{ validTo: null }, { validTo: { gte: targetDate } }],
        employee: { status: EMPLOYEE_STATUS.ACTIVE, deletedAt: null },
      },
      select: { employeeId: true },
      distinct: ["employeeId"],
    })
    return rows.map((row) => row.employeeId)
  }
}
