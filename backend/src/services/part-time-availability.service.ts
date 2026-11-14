import { DAY_OF_WEEK_VALUES } from "@/configs/entities/attendance.config.ts"
import {
  PART_TIME_AVAILABILITY_STATUS,
  PART_TIME_SUGGESTION_DECISION,
} from "@/configs/entities/part-time-availability.config.ts"
import { PART_TIME_AVAILABILITY_MESSAGES } from "@/configs/messages/part-time-availability.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import {
  IAssignPartTimeShiftsDTO,
  IPartTimeAvailabilityDay,
  IPartTimeAvailabilityRepository,
  IPartTimeAvailabilityService,
  IPartTimeWeeklyAvailability,
  IReviewPartTimeAvailabilityDTO,
  IUpsertPartTimeAvailabilityDTO,
} from "@/types/part-time-availability.types.ts"
import { IEmployeeShiftRepository, IWorkingShiftRepository } from "@/types/shift.types.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"
import { parseUtcDateOnly } from "@/utils/date.util.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  getDateForWeekDay,
  isPastOrCurrentAvailabilityWeek,
  minutesToTime,
  normalizeWeekStart,
  parseTimeToMinutes,
  shiftFitsAvailabilityDay,
} from "@/utils/part-time-availability.util.ts"
import { buildAssignedDaySummaries } from "@/utils/part-time-availability/build-assigned-day-summaries.util.ts"
import {
  PART_TIME_AVAILABILITY_LAYERS,
  assertSubmittedForAssign,
  assertSubmittedForReview,
  normalizeAvailabilityDays,
  validateAvailabilityDays,
} from "@/utils/part-time-availability/validate-availability-days.util.ts"

import { auditService } from "./audit.service.ts"
import type { CapacityCopilotService } from "./capacity-copilot.service.ts"

/** Part-time weekly availability: employee free-time submission and admin shift assignment. */
export class PartTimeAvailabilityService implements IPartTimeAvailabilityService {
  constructor(
    private availabilityRepo: IPartTimeAvailabilityRepository,
    private employeeRepo: IEmployeeRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    private workingShiftRepo: IWorkingShiftRepository,
    private capacityCopilotService?: CapacityCopilotService,
  ) {}

  /** Employee reads own weekly availability for the selected Monday weekStart. */
  async getMine(
    employeeId: string,
    weekStart: string,
  ): Promise<IPartTimeWeeklyAvailability | null> {
    return this.availabilityRepo.findByEmployeeAndWeek(employeeId, normalizeWeekStart(weekStart))
  }

  /** PT employee submits or updates free-time slots; only future weeks, always persisted as submitted. */
  async upsertMine(
    accountId: string,
    data: IUpsertPartTimeAvailabilityDTO,
  ): Promise<IPartTimeWeeklyAvailability> {
    const employeeId = await resolvePersonalEmployeeId(accountId)
    await this.assertPartTimeEmployee(employeeId)

    if (isPastOrCurrentAvailabilityWeek(data.weekStart)) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.PAST_OR_CURRENT_WEEK_NOT_ALLOWED,
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    const weekStart = normalizeWeekStart(data.weekStart)
    const weekDates = DAY_OF_WEEK_VALUES.map((dayOfWeek) => getDateForWeekDay(weekStart, dayOfWeek))

    // Admin-assigned overrides lock the week — employee edits would drift from scheduled shifts.
    const hasAssignedShifts = await this.employeeShiftRepo.hasOverridesForEmployeeDates(
      employeeId,
      weekDates,
    )
    if (hasAssignedShifts) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.WEEK_ALREADY_ASSIGNED,
        HttpStatusCode.CONFLICT,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    const days = normalizeAvailabilityDays(data.days)
    validateAvailabilityDays(days)

    // Every employee save enters the assign queue immediately; client status is ignored.
    const availability = await this.availabilityRepo.upsert({
      employeeId,
      weekStart,
      note: data.note,
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days,
    })

    this.capacityCopilotService?.runAvailabilityUpdatedJob(employeeId, weekStart)

    return availability
  }

  /** Admin roster: all availability submissions for a given week, with assigned shift summaries. */
  async listForWeek(weekStart: string): Promise<IPartTimeWeeklyAvailability[]> {
    const normalized = normalizeWeekStart(weekStart)
    const items = await this.availabilityRepo.listByWeek(normalized)
    if (items.length === 0) return items

    const weekDates = DAY_OF_WEEK_VALUES.map((dayOfWeek) =>
      getDateForWeekDay(normalized, dayOfWeek),
    )
    const shifts =
      (await this.employeeShiftRepo.listByEmployeesAndDateRange(
        items.map((item) => item.employeeId),
        weekDates[0],
        weekDates[weekDates.length - 1],
      )) ?? []

    const shiftsByEmployee = new Map<string, typeof shifts>()
    for (const row of shifts) {
      const bucket = shiftsByEmployee.get(row.employeeId) ?? []
      bucket.push(row)
      shiftsByEmployee.set(row.employeeId, bucket)
    }

    return items.map((item) => {
      const employeeShifts = shiftsByEmployee.get(item.employeeId) ?? []
      const { summaries, slots, hasAssigned } = buildAssignedDaySummaries(
        normalized,
        employeeShifts,
      )
      return {
        ...item,
        assignedDaySummaries: summaries,
        assignedDaySlots: slots,
        hasAssignedShifts: hasAssigned,
      }
    })
  }

  /** Admin drill-down: one employee's availability for a week. */
  getByEmployee(
    employeeId: string,
    weekStart: string,
  ): Promise<IPartTimeWeeklyAvailability | null> {
    return this.availabilityRepo.findByEmployeeAndWeek(employeeId, normalizeWeekStart(weekStart))
  }

  /** Legacy review path — optional; primary workflow assigns directly from submitted status. */
  async approve(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForReview(availability.status)
    return this.availabilityRepo.updateStatus(
      availability.id,
      PART_TIME_AVAILABILITY_STATUS.APPROVED,
      data.reviewedById,
    )
  }

  /** Legacy review path — rejects with reason so employee can fix and resubmit. */
  async reject(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForReview(availability.status)
    if (!data.rejectReason?.trim()) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.REJECT_REASON_REQUIRED,
        HttpStatusCode.BAD_REQUEST,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
    return this.availabilityRepo.updateStatus(
      availability.id,
      PART_TIME_AVAILABILITY_STATUS.REJECTED,
      data.reviewedById,
      data.rejectReason.trim(),
    )
  }

  /**
   * Admin assigns shifts from submitted availability.
   * Validates all slots first, then atomically replaces admin overrides for the week.
   */
  async assignShifts(
    data: IAssignPartTimeShiftsDTO,
  ): Promise<{ assigned: number; skipped: number }> {
    const availability = await this.requireAvailability(data.availabilityId)
    assertSubmittedForAssign(availability.status)
    await this.assertPartTimeEmployee(availability.employeeId)

    const weekStart = normalizeWeekStart(availability.weekStart)
    const weekDates = DAY_OF_WEEK_VALUES.map((dayOfWeek) => getDateForWeekDay(weekStart, dayOfWeek))

    let assigned = 0
    let skipped = 0
    const pendingOverrides: Array<{
      employeeId: string
      assignedDate: Date
      shiftId: string
      createdById: string
    }> = []

    for (const item of data.assignments) {
      // Null start/end means admin marked day off — skip without error.
      if (!item.startTime || !item.endTime) {
        skipped++
        continue
      }

      const startTime = parseTimeToMinutes(item.startTime)
      const endTime = parseTimeToMinutes(item.endTime)

      if (startTime >= endTime) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.ASSIGN_INVALID_RANGE,
          HttpStatusCode.BAD_REQUEST,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      const day = availability.days.find((entry) => entry.dayOfWeek === item.dayOfWeek)

      if (!day || day.isBusyAllDay) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      if (!shiftFitsAvailabilityDay({ startTime, endTime }, day)) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      const shiftId = await this.resolveWorkingShiftId(startTime, endTime, data.createdById)
      pendingOverrides.push({
        employeeId: availability.employeeId,
        assignedDate: item.assignedDate
          ? parseUtcDateOnly(item.assignedDate)
          : getDateForWeekDay(weekStart, item.dayOfWeek),
        shiftId,
        createdById: data.createdById,
      })
      assigned++
    }

    // Empty payload clears the week — still transactional so delete is never left half-applied.
    await this.employeeShiftRepo.replacePartTimeOverrides(
      availability.employeeId,
      weekDates,
      pendingOverrides,
    )

    await auditService.log({
      actorId: data.createdById,
      targetEmployeeId: availability.employeeId,
      action: "PART_TIME_SHIFTS_ASSIGNED",
      newValue: {
        availabilityId: availability.id,
        weekStart: availability.weekStart,
        assigned,
        skipped,
        suggestionDecision: data.suggestionDecision ?? PART_TIME_SUGGESTION_DECISION.MANUAL,
      },
    })

    return { assigned, skipped }
  }

  /** Load availability or throw 404 — shared guard for admin mutation endpoints. */
  private async requireAvailability(id: string): Promise<IPartTimeWeeklyAvailability> {
    const availability = await this.availabilityRepo.findById(id)
    if (!availability) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
    return availability
  }

  /** Find or create a WorkingShift template matching assigned minutes — needed for check-in window + GPS. */
  private async resolveWorkingShiftId(
    startTime: number,
    endTime: number,
    createdById: string,
  ): Promise<string> {
    // Reuse matching WorkingShift template, or create one for check-in windows and GPS.
    const shifts = await this.workingShiftRepo.listAll()
    const existing = shifts.find(
      (shift) => shift.startTime === startTime && shift.endTime === endTime,
    )

    if (existing) return existing.id

    const created = await this.workingShiftRepo.create({
      name: `PT ${minutesToTime(startTime)}–${minutesToTime(endTime)}`,
      startTime: minutesToTime(startTime),
      endTime: minutesToTime(endTime),
      isActive: true,
      createdById,
    })

    return created.id
  }

  /** Gate all PT availability endpoints to employees with part-time work schedule only. */
  private async assertPartTimeEmployee(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findById(employeeId)
    if (!employee || !isPartTimeWorkSchedule(employee)) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.NOT_PART_TIME,
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }
  }

  /** Controller helper — converts HH:mm API payload to minute-based domain DTO before service call. */
  static mapPayloadDays(
    days: Array<{
      dayOfWeek: number
      isBusyAllDay: boolean
      slots: Array<{ startTime: string; endTime: string }>
    }>,
  ): IUpsertPartTimeAvailabilityDTO["days"] {
    return days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isBusyAllDay: day.isBusyAllDay,
      slots: day.slots.map((slot) => ({
        startTime: parseTimeToMinutes(slot.startTime),
        endTime: parseTimeToMinutes(slot.endTime),
      })),
    }))
  }
}
