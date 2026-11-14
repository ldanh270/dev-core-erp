import { parseUtcDateOnly } from "@/utils/date.util.ts"

/** Converts minutes since midnight to HH:mm. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/** Earliest week an employee may submit availability (Monday after the current week). */
export function getEarliestRequestableWeekStart(referenceDate = new Date()): Date {
  const currentWeekStart = normalizeWeekStart(referenceDate)
  const nextWeekStart = new Date(currentWeekStart)
  nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7)
  return nextWeekStart
}

/** True when weekStart is the current week or any earlier week. */
export function isPastOrCurrentAvailabilityWeek(
  weekStart: string | Date,
  referenceDate = new Date(),
): boolean {
  const normalized = normalizeWeekStart(weekStart)
  const earliest = getEarliestRequestableWeekStart(referenceDate)
  return normalized.getTime() < earliest.getTime()
}

/** Returns Monday 00:00 of the week containing the given date. */
export function normalizeWeekStart(date: string | Date): Date {
  const normalized = date instanceof Date ? new Date(date) : parseUtcDateOnly(date)
  normalized.setUTCHours(0, 0, 0, 0)
  const day = normalized.getUTCDay()
  // getUTCDay(): 0 = Sunday — roll back 6 days so ISO week starts on Monday, not Sunday.
  const diff = day === 0 ? -6 : 1 - day

  normalized.setUTCDate(normalized.getUTCDate() + diff)
  return normalized
}

/** Maps dayOfWeek within a week starting Monday to a calendar date. */
export function getDateForWeekDay(weekStart: Date, dayOfWeek: number): Date {
  const start = normalizeWeekStart(weekStart)
  // Prisma dayOfWeek: 0 = Sunday at end of Mon–Sun display order (+6 from Monday).
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const date = new Date(start)
  date.setUTCDate(start.getUTCDate() + offset)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

/** Converts HH:mm to minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function isOvernightShift(shift: { startTime: number; endTime: number }): boolean {
  // end < start means cross-midnight — not representable in a single-day availability slot.
  return shift.endTime < shift.startTime
}

/** True when shift fits entirely inside at least one same-day availability slot. */
export function shiftFitsAvailabilityDay(
  shift: { startTime: number; endTime: number },
  day: { isBusyAllDay: boolean; slots: Array<{ startTime: number; endTime: number }> } | undefined,
): boolean {
  if (!day || day.isBusyAllDay || day.slots.length === 0) return false
  // Overnight shifts span midnight — not representable by a single same-day slot.
  if (isOvernightShift(shift)) return false

  return day.slots.some(
    (slot) => shift.startTime >= slot.startTime && shift.endTime <= slot.endTime,
  )
}
