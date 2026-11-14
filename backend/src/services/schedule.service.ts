import { WEEKLY_SCHEDULE_PLANNING } from "@/configs/entities/attendance.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type {
  IShiftScheduleWithDays,
  IShiftScheduleWithTemplate,
} from "@/types/shift-schedule.types.ts"
import {
  IAssignShiftScheduleDTO,
  IEmployeeShiftRepository,
  IEmployeeShiftWithShift,
  IGenerateShiftsDTO,
  IGenerateShiftsResult,
  IGeneratedShiftPreview,
  IOverrideEmployeeShiftDTO,
  IPlannedWeek,
  IScheduleService,
  IShiftScheduleRepository,
  ShiftGenerateItemStatus,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  eachScheduleDate,
  formatScheduleDateKey,
  normalizeScheduleDate,
  resolveShiftFromSchedule,
} from "@/utils/schedule.util.ts"
import { buildPlannedWeek } from "@/utils/schedule/build-planned-week.util.ts"

/**
 * Service for managing employee shift schedules and overrides.
 */
export class ScheduleService implements IScheduleService {
  constructor(
    private scheduleRepo: IShiftScheduleRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
  ) {}

  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<IShiftScheduleWithTemplate> {
    return this.scheduleRepo.assignSchedule(data)
  }

  async getScheduleForEmployee(
    employeeId: string,
    date: string | Date,
  ): Promise<IShiftScheduleWithDays | null> {
    return this.scheduleRepo.getScheduleByEmployee(employeeId, date)
  }

  async listSchedulesForEmployee(employeeId: string): Promise<IShiftScheduleWithDays[]> {
    return this.scheduleRepo.listSchedulesByEmployee(employeeId)
  }

  async getEmployeeShifts(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<IEmployeeShiftWithShift[]> {
    return this.employeeShiftRepo.listByEmployeesAndDateRange([employeeId], startDate, endDate)
  }

  /** Combines explicit employee shifts with the reusable template fallback for one calendar week. */
  async getPlannedWeekForEmployee(
    employeeId: string,
    weekStart: string | Date,
  ): Promise<IPlannedWeek> {
    const start = normalizeScheduleDate(new Date(weekStart))
    const end = new Date(start)
    end.setDate(end.getDate() + WEEKLY_SCHEDULE_PLANNING.WEEK_END_OFFSET_DAYS)

    const employeeShifts = await this.employeeShiftRepo.listByEmployeesAndDateRange(
      [employeeId],
      start,
      end,
    )

    return buildPlannedWeek({
      weekStart: start,
      employeeShifts,
      getScheduleForDate: (date) => this.scheduleRepo.getScheduleByEmployee(employeeId, date),
    })
  }

  async overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<unknown> {
    return this.employeeShiftRepo.overrideShift(data)
  }

  async previewGeneratedShifts(data: IGenerateShiftsDTO): Promise<IGeneratedShiftPreview[]> {
    const { start, end } = this.parseDateRange(data.startDate, data.endDate)
    const existingShifts = await this.employeeShiftRepo.listByEmployeesAndDateRange(
      data.employeeIds,
      start,
      end,
    )
    const existingByKey = new Map(
      existingShifts.map((shift) => [
        `${shift.employeeId}:${formatScheduleDateKey(new Date(shift.assignedDate))}`,
        shift,
      ]),
    )

    return Promise.all(
      data.employeeIds.map(async (employeeId) => ({
        employeeId,
        items: await this.buildPreviewItems(employeeId, start, end, existingByKey),
      })),
    )
  }

  async generateShifts(data: IGenerateShiftsDTO): Promise<IGenerateShiftsResult> {
    if (!data.createdById) {
      throw new AppError("Thiếu thông tin người thực hiện", HttpStatusCode.BAD_REQUEST, "service")
    }

    const { start, end } = this.parseDateRange(data.startDate, data.endDate)
    const result: IGenerateShiftsResult = { created: 0, updated: 0, skipped: 0 }

    for (const employeeId of data.employeeIds) {
      for (const date of eachScheduleDate(start, end)) {
        const schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, date)
        const planned = resolveShiftFromSchedule(schedule, date)
        if (!planned?.shiftId) {
          result.skipped++
          continue
        }

        const action = await this.employeeShiftRepo.generateShiftForDate(
          employeeId,
          date,
          planned.shiftId,
          schedule?.id ?? null,
          data.createdById,
        )
        if (action === "created") {
          result.created++
        } else if (action === "updated") {
          result.updated++
        } else {
          result.skipped++
        }
      }
    }

    return result
  }

  private parseDateRange(startDate: string | Date, endDate: string | Date) {
    const start = normalizeScheduleDate(new Date(startDate))
    const end = normalizeScheduleDate(new Date(endDate))
    if (end < start) {
      throw new AppError(
        "Ngày kết thúc phải sau ngày bắt đầu",
        HttpStatusCode.BAD_REQUEST,
        "service",
      )
    }
    return { start, end }
  }

  private async buildPreviewItems(
    employeeId: string,
    start: Date,
    end: Date,
    existingByKey: Map<string, IEmployeeShiftWithShift>,
  ) {
    const items = []

    for (const date of eachScheduleDate(start, end)) {
      const dateKey = formatScheduleDateKey(date)
      const schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, date)
      const planned = resolveShiftFromSchedule(schedule, date)
      const existing = existingByKey.get(`${employeeId}:${dateKey}`)
      const status = this.resolvePreviewStatus(planned?.shiftId, existing)

      items.push({
        date: dateKey,
        shiftId: planned?.shiftId ?? null,
        shift: planned?.shift ?? null,
        status,
      })
    }

    return items
  }

  private resolvePreviewStatus(
    plannedShiftId: string | null | undefined,
    existing: IEmployeeShiftWithShift | undefined,
  ): ShiftGenerateItemStatus {
    if (!plannedShiftId) return "no_schedule"
    if (existing?.isOverride) return "override"
    if (existing) return "existing"
    return "pending"
  }
}
