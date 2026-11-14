import type { ISchedule } from "@/types/attendance.types"

/** Builds a lookup map from employee ID to their weekly schedule. */
export function getScheduleByEmployeeId(
  schedules: (ISchedule | null | undefined)[],
): Map<string, ISchedule> {
  return new Map(
    schedules.flatMap((schedule) => (schedule ? [[schedule.employeeId, schedule]] : [])),
  )
}
