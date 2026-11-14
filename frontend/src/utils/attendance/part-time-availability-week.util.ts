import {
  type IPartTimeAvailabilityStatus,
  PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES,
  PART_TIME_AVAILABILITY_EDITABLE_STATUSES,
} from "@/config/entities/part-time-availability.config"
import { getWeekStart } from "@/utils/attendance/get-week-start"

/**
 * Returns the Monday of the earliest week employees may declare availability (always next week onward).
 */
export function getEarliestRequestableWeekStart(referenceDate = new Date()): Date {
  const currentWeekStart = getWeekStart(referenceDate)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  return nextWeekStart
}

/**
 * Clamps week navigation so employees cannot select the current or past week for new declarations.
 */
export function clampToEarliestRequestableWeek(weekStart: Date, referenceDate = new Date()): Date {
  const normalized = getWeekStart(weekStart)
  const earliest = getEarliestRequestableWeekStart(referenceDate)
  return normalized.getTime() < earliest.getTime() ? earliest : normalized
}

/**
 * Gates whether the employee availability form may be edited for draft/submitted/rejected rows.
 */
export function isPartTimeAvailabilityEditable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  if (!status) return true
  return PART_TIME_AVAILABILITY_EDITABLE_STATUSES.includes(status)
}

/**
 * Gates whether admin may assign shifts from a saved availability row based on workflow status.
 */
export function isPartTimeAvailabilityAssignable(
  status: IPartTimeAvailabilityStatus | null | undefined,
): boolean {
  if (!status) return false
  return PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(status)
}
