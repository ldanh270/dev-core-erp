/**
 * Converts a previously planned attendance week into an editable part-time assignment form.
 * Only slots still allowed by the employee's submitted availability are retained.
 */
import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import { minutesToTime } from "@/lib/utils"
import type { IPlannedWeek } from "@/types/attendance.types"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"
import { buildScheduledSlotsFromAvailabilityDay } from "@/utils/attendance/part-time-availability/build-scheduled-slots-from-availability-day.util"
import type {
  IPartTimeAssignmentDayForm,
  IPartTimeAssignmentSlotForm,
} from "@/utils/attendance/part-time-availability/part-time-assignment-form.types"

function parseAssignedSummary(summary: string | undefined): IPartTimeAssignmentSlotForm[] {
  if (!summary) return []

  return summary
    .split(",")
    .map((item) => item.trim().split(/\s*[–-]\s*/))
    .filter(([startTime, endTime]) => Boolean(startTime && endTime))
    .map(([startTime, endTime]) => ({ startTime, endTime }))
}

function getAssignedSlotsFromAvailability(
  availability: IPartTimeWeeklyAvailability,
  dayOfWeek: number,
): IPartTimeAssignmentSlotForm[] {
  const structuredSlots = new Map(Object.entries(availability.assignedDaySlots ?? {})).get(
    String(dayOfWeek),
  )
  if (structuredSlots?.length) return structuredSlots

  const summary = new Map(Object.entries(availability.assignedDaySummaries ?? {})).get(
    String(dayOfWeek),
  )
  return parseAssignedSummary(summary)
}

/**
 * Pre-fills the admin assign form for one PT employee.
 *
 * Priority order per day:
 * 1. Busy all day → unscheduled (no slots, isScheduled=false).
 * 2. Assigned roster slots from the admin list response — prevents drawer/detail drift.
 * 3. Existing planned-week override shifts for that day — legacy fallback.
 * 4. If this week was already assigned, missing override shifts mean admin marked that day off.
 * 5. Scheduled slots derived from the employee's availability declaration.
 */
export function buildPartTimeAssignmentsFromPlannedWeek(
  availability: IPartTimeWeeklyAvailability,
  plannedWeek?: IPlannedWeek | null,
): IPartTimeAssignmentDayForm[] {
  const dayMap = new Map(availability.days.map((day) => [day.dayOfWeek, day]))
  const plannedByDay = new Map(plannedWeek?.days.map((day) => [day.dayOfWeek, day]) ?? [])
  const hasPlannedOverrides = plannedWeek?.days.some((day) =>
    day.shifts.some((shift) => shift.isOverride),
  )
  const hasExistingAssignments = Boolean(availability.hasAssignedShifts || hasPlannedOverrides)

  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const availabilityDay = dayMap.get(dayOfWeek)
    const isBusyDay = Boolean(availabilityDay?.isBusyAllDay)
    const plannedDay = plannedByDay.get(dayOfWeek)
    const overrideShifts = plannedDay?.shifts.filter((shift) => shift.isOverride) ?? []
    const assignedSlots = getAssignedSlotsFromAvailability(availability, dayOfWeek)

    if (isBusyDay) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    if (assignedSlots.length > 0) {
      return {
        dayOfWeek,
        isScheduled: true,
        slots: assignedSlots,
      }
    }

    if (overrideShifts.length > 0) {
      return {
        dayOfWeek,
        isScheduled: true,
        slots: overrideShifts.map((entry) => ({
          startTime: minutesToTime(entry.shift.startTime),
          endTime: minutesToTime(entry.shift.endTime),
        })),
      }
    }

    if (hasExistingAssignments) {
      return { dayOfWeek, isScheduled: false, slots: [] }
    }

    return {
      dayOfWeek,
      isScheduled: true,
      slots: buildScheduledSlotsFromAvailabilityDay(availabilityDay),
    }
  })
}
