/** Normalizes a date to midnight local time. */
export function normalizeScheduleDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/** Computes the rotating week index within a multi-week cycle. */
export function getCycleWeekIndex(targetDate: Date, validFrom: Date, cycleWeeks: number): number {
  if (cycleWeeks <= 1) return 0

  const start = normalizeScheduleDate(validFrom)
  const target = normalizeScheduleDate(targetDate)
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86_400_000)
  const weekNumber = Math.floor(diffDays / 7)
  return ((weekNumber % cycleWeeks) + cycleWeeks) % cycleWeeks
}
