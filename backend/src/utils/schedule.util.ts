/** Normalizes a date to midnight local time. */
export function normalizeScheduleDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/** ISO date key (YYYY-MM-DD) in local time. */
export function formatScheduleDateKey(date: Date): string {
  const normalized = normalizeScheduleDate(date)
  const year = normalized.getFullYear()
  const month = String(normalized.getMonth() + 1).padStart(2, "0")
  const day = String(normalized.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

export interface ISchedulePatternDay {
  dayOfWeek: number
  weekIndex?: number
  shiftId?: string | null
  shift?: {
    id?: string
    name?: string
    startTime: number
    endTime: number
  } | null
}

export interface ISchedulePattern {
  id?: string
  validFrom?: Date | string
  cycleWeeks?: number | null
  days?: ISchedulePatternDay[]
}

/** Resolves the planned shift for a date from a recurring schedule pattern. */
export function resolveShiftFromSchedule(
  schedule: ISchedulePattern | null | undefined,
  date: Date,
): ISchedulePatternDay | null {
  if (!schedule?.days?.length) return null

  const cycleWeeks = schedule.cycleWeeks ?? 1
  const weekIndex =
    cycleWeeks > 1 && schedule.validFrom
      ? getCycleWeekIndex(date, new Date(schedule.validFrom), cycleWeeks)
      : 0
  const dayOfWeek = date.getDay()

  return (
    schedule.days.find(
      (item) => item.dayOfWeek === dayOfWeek && (item.weekIndex ?? 0) === weekIndex,
    ) ?? null
  )
}

/** Iterates each calendar day from start through end (inclusive). */
export function* eachScheduleDate(start: Date, end: Date): Generator<Date> {
  const cursor = normalizeScheduleDate(start)
  const last = normalizeScheduleDate(end)

  while (cursor <= last) {
    yield new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }
}
