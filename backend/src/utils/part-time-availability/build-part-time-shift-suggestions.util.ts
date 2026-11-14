import { PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES } from "@/configs/entities/part-time-availability.config.ts"
import type {
  IPartTimeCoverageRequirement,
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeEmployeeSuggestion,
  ISuggestPartTimeShiftsResult,
} from "@/types/part-time-availability.types.ts"
import { minutesToTime, shiftFitsAvailabilityDay } from "@/utils/part-time-availability.util.ts"

import type { IPartTimeReliabilityScore } from "./score-part-time-reliability.util.ts"

/** Mutable working state per candidate — assignedMinutes grows as slots are filled each iteration. */
interface ICandidate {
  availability: IPartTimeWeeklyAvailability
  score: IPartTimeReliabilityScore
  /** Running total of assigned minutes this week — used as tie-break when scores are equal. */
  assignedMinutes: number
}

/**
 * Deterministic greedy optimizer: fill each required slot with the best eligible PT employee.
 *
 * Sort order per slot: score desc → assignedMinutes asc (load balance) → employeeId asc (stable).
 * Does not persist — caller must forward selected assignments to assignShifts().
 */
export function buildPartTimeShiftSuggestions(options: {
  weekStart: string
  availabilities: IPartTimeWeeklyAvailability[]
  scoresByEmployeeId: Map<string, IPartTimeReliabilityScore>
  coverageRequirements: IPartTimeCoverageRequirement[]
  assignedMinutesByEmployeeId: Map<string, number>
}): ISuggestPartTimeShiftsResult {
  // Only submitted (or legacy approved) availabilities enter the pool.
  const candidates: ICandidate[] = options.availabilities
    .filter((item) => PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(item.status))
    .map((availability) => ({
      availability,
      score: options.scoresByEmployeeId.get(availability.employeeId) ?? {
        score: 50,
        reasons: ["Chưa có lịch sử chấm công — điểm trung lập"],
      },
      assignedMinutes: options.assignedMinutesByEmployeeId.get(availability.employeeId) ?? 0,
    }))

  // Accumulates suggestions keyed by availabilityId so multi-day assignments merge into one entry.
  const assignmentsByAvailabilityId = new Map<string, ISuggestPartTimeEmployeeSuggestion>()
  // Tracks occupied time windows per (employeeId, dayOfWeek) to prevent double-booking.
  const occupiedByEmployeeDay = new Map<string, Array<{ startTime: number; endTime: number }>>()
  const coverage = []
  const unassignedGaps = []

  for (const requirement of options.coverageRequirements) {
    const eligible = candidates
      .filter(({ availability }) => {
        const day = availability.days.find((entry) => entry.dayOfWeek === requirement.dayOfWeek)
        // Slot must fit within the employee's declared free window and not overlap existing assignments.
        if (!shiftFitsAvailabilityDay(requirement, day)) return false
        const occupied =
          occupiedByEmployeeDay.get(`${availability.employeeId}:${requirement.dayOfWeek}`) ?? []
        return !occupied.some(
          (slot) => requirement.startTime < slot.endTime && requirement.endTime > slot.startTime,
        )
      })
      .toSorted(
        (a, b) =>
          b.score.score - a.score.score ||
          a.assignedMinutes - b.assignedMinutes ||
          a.availability.employeeId.localeCompare(b.availability.employeeId),
      )

    // Take up to requiredCount best candidates for this slot.
    const selected = eligible.slice(0, requirement.requiredCount)
    for (const candidate of selected) {
      const { availability } = candidate
      // Upsert suggestion entry — multiple slots per employee accumulate under one suggestion.
      const suggestion = assignmentsByAvailabilityId.get(availability.id) ?? {
        availabilityId: availability.id,
        employeeId: availability.employeeId,
        employeeName: availability.employee?.fullName ?? availability.employeeId,
        score: candidate.score.score,
        reasons: candidate.score.reasons,
        assignments: [],
      }
      suggestion.assignments.push({
        shiftId: requirement.shiftId,
        shiftName: requirement.shiftName,
        dayOfWeek: requirement.dayOfWeek,
        startTime: minutesToTime(requirement.startTime),
        endTime: minutesToTime(requirement.endTime),
      })
      assignmentsByAvailabilityId.set(availability.id, suggestion)
      // Mark window as occupied so subsequent requirements cannot double-book the same employee.
      const key = `${availability.employeeId}:${requirement.dayOfWeek}`
      const occupied = occupiedByEmployeeDay.get(key) ?? []
      occupied.push({ startTime: requirement.startTime, endTime: requirement.endTime })
      occupiedByEmployeeDay.set(key, occupied)
      // Update running total so load-balance tie-break stays accurate across iterations.
      candidate.assignedMinutes += requirement.endTime - requirement.startTime
    }

    const assignedCount = selected.length
    coverage.push({
      shiftId: requirement.shiftId,
      shiftName: requirement.shiftName,
      dayOfWeek: requirement.dayOfWeek,
      startTime: minutesToTime(requirement.startTime),
      endTime: minutesToTime(requirement.endTime),
      requiredCount: requirement.requiredCount,
      assignedCount,
      coverageScore: Math.round((assignedCount / requirement.requiredCount) * 100),
    })
    if (assignedCount < requirement.requiredCount) {
      unassignedGaps.push({
        shiftId: requirement.shiftId,
        shiftName: requirement.shiftName,
        dayOfWeek: requirement.dayOfWeek,
        missingCount: requirement.requiredCount - assignedCount,
        reason: "Không đủ nhân viên rảnh phù hợp",
      })
    }
  }

  return {
    weekStart: options.weekStart,
    suggestions: [...assignmentsByAvailabilityId.values()],
    coverage,
    unassignedGaps,
  }
}
