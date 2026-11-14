import { WEEKLY_SCHEDULE_MESSAGES } from "@/configs/messages/weekly-schedule.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import { IEmployeeShiftRepository, IShiftScheduleRepository } from "@/types/shift.types.ts"
import {
  IApplyWeeklyScheduleTemplateDTO,
  ICreateWeeklyScheduleTemplateDTO,
  IUpdateWeeklyScheduleTemplateDTO,
  IWeeklyScheduleTemplateRepository,
  IWeeklyScheduleTemplateService,
  IWeeklyScheduleTemplateWithWeeks,
} from "@/types/weekly-schedule-template.types.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { getCycleWeekIndex, normalizeScheduleDate } from "@/utils/schedule.util.ts"

/**
 * Service for reusable rotating weekly schedule templates and applying them to employees.
 */
export class WeeklyScheduleTemplateService implements IWeeklyScheduleTemplateService {
  constructor(
    private templateRepo: IWeeklyScheduleTemplateRepository,
    private scheduleRepo: IShiftScheduleRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    /** Used in applyTemplate to block PART_TIME employees (project Spent Time model). */
    private employeeRepo: IEmployeeRepository,
  ) {}

  /** Creates a reusable weekly shift template (full-time employees only at apply time). */
  createTemplate(
    data: ICreateWeeklyScheduleTemplateDTO,
  ): Promise<IWeeklyScheduleTemplateWithWeeks> {
    return this.templateRepo.create(data)
  }

  updateTemplate(
    id: string,
    data: IUpdateWeeklyScheduleTemplateDTO,
  ): Promise<IWeeklyScheduleTemplateWithWeeks> {
    return this.templateRepo.update(id, data)
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await this.templateRepo.findById(id)
    if (!existing) {
      throw new AppError(
        "Không tìm thấy template lịch hàng tuần",
        HttpStatusCode.NOT_FOUND,
        "service",
      )
    }
    await this.templateRepo.delete(id)
  }

  async getTemplate(id: string): Promise<IWeeklyScheduleTemplateWithWeeks> {
    const template = await this.templateRepo.findById(id)
    if (!template) {
      throw new AppError(
        "Không tìm thấy template lịch hàng tuần",
        HttpStatusCode.NOT_FOUND,
        "service",
      )
    }
    return template
  }

  listTemplates(): Promise<IWeeklyScheduleTemplateWithWeeks[]> {
    return this.templateRepo.listAll()
  }

  async applyTemplate(data: IApplyWeeklyScheduleTemplateDTO) {
    const template = await this.templateRepo.findById(data.templateId)
    if (!template) {
      throw new AppError(
        "Không tìm thấy template lịch hàng tuần",
        HttpStatusCode.NOT_FOUND,
        "service",
      )
    }
    if (!template.isActive) {
      throw new AppError(
        "Template đang tắt, không thể áp dụng",
        HttpStatusCode.BAD_REQUEST,
        "service",
      )
    }

    const validFrom = normalizeScheduleDate(new Date(data.validFrom))
    const validTo = data.validTo ? normalizeScheduleDate(new Date(data.validTo)) : null
    if (validTo && validTo < validFrom) {
      throw new AppError("validTo phải sau validFrom", HttpStatusCode.BAD_REQUEST, "service")
    }

    const scheduleDays = template.weeks.flatMap((week) =>
      week.days
        .filter((day) => day.shiftId)
        .map((day) => ({
          weekIndex: week.weekIndex,
          dayOfWeek: day.dayOfWeek,
          shiftId: day.shiftId as string,
        })),
    )

    if (scheduleDays.length === 0) {
      throw new AppError(
        "Template không có ca làm việc nào để áp dụng",
        HttpStatusCode.BAD_REQUEST,
        "service",
      )
    }

    for (const employeeId of data.employeeIds) {
      const employee = await this.employeeRepo.findById(employeeId)
      // PT uses per-project Spent Time, not company weekly shift templates.
      if (employee && isPartTimeWorkSchedule(employee)) {
        throw new AppError(
          WEEKLY_SCHEDULE_MESSAGES.PART_TIME_NOT_APPLICABLE,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          "service",
        )
      }
    }

    const results = await Promise.all(
      data.employeeIds.map((employeeId) =>
        this.scheduleRepo.assignSchedule({
          employeeId,
          validFrom,
          validTo,
          createdById: data.createdById,
          templateId: template.id,
          cycleWeeks: template.cycleWeeks,
          days: scheduleDays,
        }),
      ),
    )

    if (data.generateShifts !== false) {
      await Promise.all(
        data.employeeIds.map((employeeId) =>
          this.generateEmployeeShifts(
            employeeId,
            validFrom,
            validTo,
            template.cycleWeeks,
            scheduleDays,
            data.createdById,
          ),
        ),
      )
    }

    return results
  }

  private async generateEmployeeShifts(
    employeeId: string,
    validFrom: Date,
    validTo: Date | null,
    cycleWeeks: number,
    scheduleDays: { weekIndex: number; dayOfWeek: number; shiftId: string }[],
    createdById: string,
  ): Promise<void> {
    const endDate = validTo ?? this.addDays(validFrom, cycleWeeks * 7 - 1)
    const cursor = new Date(validFrom)

    while (cursor <= endDate) {
      const weekIndex = getCycleWeekIndex(cursor, validFrom, cycleWeeks)
      const dayOfWeek = cursor.getDay()
      const match = scheduleDays.find(
        (day) => day.weekIndex === weekIndex && day.dayOfWeek === dayOfWeek,
      )

      if (match) {
        await this.employeeShiftRepo.ensureShiftForEmployeeDate(
          employeeId,
          cursor,
          match.shiftId,
          createdById,
        )
      }

      cursor.setDate(cursor.getDate() + 1)
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
}
