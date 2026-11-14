/**
 * Application service for generating explainable part-time shift suggestions.
 * It prepares repository data, while the pure utility owns scoring and greedy allocation.
 */
import { PART_TIME_SHIFT_SUGGEST } from "@/configs/entities/part-time-availability.config.ts"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"
import type {
  IPartTimeAvailabilityService,
  IPtShiftSuggestionService,
  ISuggestPartTimeShiftsResult,
} from "@/types/part-time-availability.types.ts"
import type { IEmployeeShiftRepository, IWorkingShiftRepository } from "@/types/shift.types.ts"
import { normalizeWeekStart } from "@/utils/part-time-availability.util.ts"
import { buildPartTimeShiftSuggestions } from "@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts"
import {
  type IPartTimeReliabilityScore,
  scorePartTimeReliability,
} from "@/utils/part-time-availability/score-part-time-reliability.util.ts"
import { formatScheduleDateKey } from "@/utils/schedule.util.ts"

const NEUTRAL_RELIABILITY: IPartTimeReliabilityScore = {
  score: PART_TIME_SHIFT_SUGGEST.NEUTRAL_SCORE,
  reasons: ["Chưa có lịch sử chấm công — điểm trung lập"],
}

/** Suggests PT shift assignments from free slots + attendance reliability — does not persist. */
export class PtShiftSuggestionService implements IPtShiftSuggestionService {
  constructor(
    private availabilityService: IPartTimeAvailabilityService,
    private attendanceRepo: IAttendanceRepository,
    private workingShiftRepo: IWorkingShiftRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
  ) {}

  /**
   * Runs the greedy optimizer and returns suggestions without persisting anything.
   *
   * Steps:
   * 1. Load all submitted availabilities for the week.
   * 2. Batch-fetch attendance records (90-day lookback) and score each employee.
   * 3. Build or fall back to coverage requirements (1 person/shift/day default).
   * 4. Delegate to buildPartTimeShiftSuggestions for deterministic greedy assignment.
   *
   * @param input.weekStart - ISO date string for the Monday of the target week.
   * @param input.coverageRequirements - Optional explicit slot requirements; defaults to 1/shift/day.
   */
  async suggest(
    input: Parameters<IPtShiftSuggestionService["suggest"]>[0],
  ): Promise<ISuggestPartTimeShiftsResult> {
    const weekStartDate = normalizeWeekStart(input.weekStart)
    const weekStartKey = formatScheduleDateKey(weekStartDate)
    const availabilities = await this.availabilityService.listForWeek(weekStartKey)

    const employeeIds = [...new Set(availabilities.map((item) => item.employeeId))]
    const scoresByEmployeeId = new Map<string, IPartTimeReliabilityScore>(
      employeeIds.map((employeeId) => [employeeId, NEUTRAL_RELIABILITY]),
    )

    const [workingShifts, existingShifts] = await Promise.all([
      this.workingShiftRepo.listAll(),
      employeeIds.length > 0
        ? this.employeeShiftRepo.listByEmployeesAndDateRange(
            employeeIds,
            weekStartDate,
            new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
          )
        : Promise.resolve([]),
    ])

    if (employeeIds.length > 0) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - PART_TIME_SHIFT_SUGGEST.LOOKBACK_DAYS)

      const records = await this.attendanceRepo.queryRecords({
        employeeIds,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const recordsByEmployee = new Map<string, typeof records>()
      for (const record of records) {
        const list = recordsByEmployee.get(record.employeeId) ?? []
        list.push(record)
        recordsByEmployee.set(record.employeeId, list)
      }

      for (const employeeId of employeeIds) {
        scoresByEmployeeId.set(
          employeeId,
          scorePartTimeReliability(recordsByEmployee.get(employeeId) ?? []),
        )
      }
    }

    const shiftById = new Map(workingShifts.map((shift) => [shift.id, shift]))
    const coverageRequirements =
      input.coverageRequirements?.map((requirement) => ({
        ...requirement,
        shiftName: shiftById.get(requirement.shiftId)?.name ?? requirement.shiftId,
      })) ??
      workingShifts
        .filter((shift) => shift.isActive)
        .flatMap((shift) =>
          [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({
            shiftId: shift.id,
            shiftName: shift.name,
            dayOfWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            requiredCount: 1,
          })),
        )

    const assignedMinutesByEmployeeId = new Map<string, number>()
    for (const employeeShift of existingShifts) {
      const duration = Math.max(0, employeeShift.shift.endTime - employeeShift.shift.startTime)
      assignedMinutesByEmployeeId.set(
        employeeShift.employeeId,
        (assignedMinutesByEmployeeId.get(employeeShift.employeeId) ?? 0) + duration,
      )
    }

    return buildPartTimeShiftSuggestions({
      weekStart: weekStartKey,
      availabilities,
      scoresByEmployeeId,
      coverageRequirements,
      assignedMinutesByEmployeeId,
    })
  }
}
