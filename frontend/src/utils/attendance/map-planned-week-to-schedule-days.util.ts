import type { IPlannedWeek } from "@/types/attendance.types"
import type { IScheduleDay } from "@/types/attendance.types"

/** Maps planned-week API response into calendar schedule days (first shift per day). */
export function mapPlannedWeekToScheduleDays(
  plannedWeek?: IPlannedWeek | null,
): Map<number, IScheduleDay> {
  const scheduleDaysByDay = new Map<number, IScheduleDay>()
  if (!plannedWeek?.days.length) return scheduleDaysByDay

  for (const day of plannedWeek.days) {
    const primary = day.shifts[0]
    if (!primary) continue

    scheduleDaysByDay.set(day.dayOfWeek, {
      dayOfWeek: day.dayOfWeek,
      shiftId: primary.shiftId,
      shift: {
        name: primary.shift.name,
        startTime: primary.shift.startTime,
        endTime: primary.shift.endTime,
        gracePeriodMinutes: primary.shift.gracePeriodMinutes,
        gpsLat: primary.shift.gpsLat ?? undefined,
        gpsLng: primary.shift.gpsLng ?? undefined,
        gpsRadiusMeters: primary.shift.gpsRadiusMeters ?? undefined,
      },
    })
  }

  return scheduleDaysByDay
}
