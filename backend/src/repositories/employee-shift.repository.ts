import {
  IEmployeeShiftOverrideRecord,
  IEmployeeShiftRepository,
  IEmployeeShiftWithShift,
  IOverrideEmployeeShiftDTO,
} from "@/types/shift.types.ts"
import { isWithinShiftSelectionWindow } from "@/utils/attendance/attendance-shift.util.ts"

import { PrismaClient, ShiftStatus } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

function toUtcMidnight(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

/**
 * Repository implementation for employee shift assignments using Prisma.
 */
export class PrismaEmployeeShiftRepository
  extends BaseRepository
  implements IEmployeeShiftRepository
{
  /**
   * Creates a new PrismaEmployeeShiftRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Append-only override row — supports multiple shifts per day for part-time assign. */
  async createOverrideShift(
    data: IOverrideEmployeeShiftDTO,
  ): Promise<IEmployeeShiftOverrideRecord> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = toUtcMidnight(assignedDate)
    // Audit trail: admin assign passes createdById; self-service paths fall back to employee.
    const actorId = createdById ?? employeeId

    return this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: date,
        shiftId,
        isOverride: true,
        status: ShiftStatus.scheduled,
        createdById: actorId,
      },
    })
  }

  /** Remove prior admin-assigned overrides for the week without touching template/schedule shifts. */
  async deleteOverridesForEmployeeDates(employeeId: string, dates: Date[]): Promise<void> {
    if (dates.length === 0) return

    const normalizedDates = dates.map(toUtcMidnight)

    await this.prisma.employeeShift.deleteMany({
      where: {
        employeeId,
        assignedDate: { in: normalizedDates },
        isOverride: true,
      },
    })
  }

  /** True when admin has already assigned PT override shifts for any date in the week. */
  async hasOverridesForEmployeeDates(employeeId: string, dates: Date[]): Promise<boolean> {
    if (dates.length === 0) return false

    const normalizedDates = dates.map(toUtcMidnight)

    const count = await this.prisma.employeeShift.count({
      where: {
        employeeId,
        assignedDate: { in: normalizedDates },
        isOverride: true,
      },
    })

    return count > 0
  }

  /**
   * Atomically replaces admin PT overrides for a week — delete then create in one transaction.
   * Prevents partial week state if a create fails mid-loop.
   */
  async replacePartTimeOverrides(
    employeeId: string,
    dates: Date[],
    overrides: IOverrideEmployeeShiftDTO[],
  ): Promise<void> {
    const normalizedDates = dates.map(toUtcMidnight)

    await this.prisma.$transaction(async (tx) => {
      await tx.employeeShift.deleteMany({
        where: {
          employeeId,
          assignedDate: { in: normalizedDates },
          isOverride: true,
        },
      })

      if (overrides.length === 0) return

      await tx.employeeShift.createMany({
        data: overrides.map((override) => {
          const assignedDate = toUtcMidnight(override.assignedDate)

          return {
            employeeId: override.employeeId,
            assignedDate,
            shiftId: override.shiftId,
            isOverride: true,
            status: ShiftStatus.scheduled,
            createdById: override.createdById ?? override.employeeId,
          }
        }),
      })
    })
  }

  /**
   * Overrides an employee's shift for a specific date.
   * @param data - The override data.
   * @returns The updated or created employee shift.
   */
  async overrideShift(data: IOverrideEmployeeShiftDTO): Promise<IEmployeeShiftOverrideRecord> {
    const { employeeId, assignedDate, shiftId, createdById } = data
    const date = toUtcMidnight(assignedDate)
    // Audit trail: admin assign passes createdById; self-service paths fall back to employee.
    const actorId = createdById ?? employeeId

    // Promote existing schedule row or create override — safe under @@unique([employeeId, assignedDate, shiftId]).
    return this.prisma.employeeShift.upsert({
      where: {
        employeeId_assignedDate_shiftId: {
          employeeId,
          assignedDate: date,
          shiftId,
        },
      },
      update: {
        isOverride: true,
        status: ShiftStatus.scheduled,
      },
      create: {
        employeeId,
        assignedDate: date,
        shiftId,
        isOverride: true,
        status: ShiftStatus.scheduled,
        createdById: actorId,
      },
    })
  }

  /**
   * Gets a shift assignment for an employee on a specific date.
   * When atMinutes is provided, prefers the shift whose check-in window contains that time.
   */
  async getShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    options?: { atMinutes?: number },
  ): Promise<IEmployeeShiftWithShift | null> {
    const targetDate = toUtcMidnight(date)

    const rows = await this.prisma.employeeShift.findMany({
      where: {
        employeeId,
        assignedDate: targetDate,
      },
      include: { shift: true },
      orderBy: [{ isOverride: "desc" }, { createdAt: "asc" }],
    })

    if (rows.length === 0) return null

    if (options?.atMinutes === undefined) {
      return rows[0]
    }

    const matching = rows.filter((row) =>
      isWithinShiftSelectionWindow(options.atMinutes!, row.shift),
    )

    return matching[0] ?? rows[0]
  }

  async listByEmployeesAndDateRange(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<IEmployeeShiftWithShift[]> {
    const start = toUtcMidnight(startDate)
    const end = toUtcMidnight(endDate)

    return this.prisma.employeeShift.findMany({
      where: {
        employeeId: { in: employeeIds },
        assignedDate: { gte: start, lte: end },
      },
      include: { shift: true },
    })
  }

  async ensureShiftForEmployeeDate(
    employeeId: string,
    date: string | Date,
    shiftId: string,
    createdById: string,
  ): Promise<IEmployeeShiftWithShift> {
    const targetDate = toUtcMidnight(date)

    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
        // Template auto-fill must not touch admin PT overrides from availability assign.
        isOverride: false,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existing) {
      return this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          isOverride: false,
          status: ShiftStatus.scheduled,
        },
        include: { shift: true },
      })
    }

    return this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: targetDate,
        shiftId,
        isOverride: false,
        status: ShiftStatus.scheduled,
        createdById,
      },
      include: { shift: true },
    })
  }

  async generateShiftForDate(
    employeeId: string,
    date: Date,
    shiftId: string,
    scheduleId: string | null,
    createdById: string,
  ): Promise<"created" | "updated" | "skipped"> {
    const targetDate = toUtcMidnight(date)

    const existing = await this.prisma.employeeShift.findFirst({
      where: {
        employeeId,
        assignedDate: targetDate,
        // Template auto-fill must not touch admin PT overrides from availability assign.
        isOverride: false,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existing?.isOverride) return "skipped"
    if (existing && existing.shiftId === shiftId) return "skipped"

    if (existing) {
      await this.prisma.employeeShift.update({
        where: { id: existing.id },
        data: {
          shiftId,
          scheduleId,
          isOverride: false,
          status: ShiftStatus.scheduled,
        },
      })
      return "updated"
    }

    await this.prisma.employeeShift.create({
      data: {
        employeeId,
        assignedDate: targetDate,
        shiftId,
        scheduleId,
        isOverride: false,
        status: ShiftStatus.scheduled,
        createdById,
      },
    })
    return "created"
  }
}
