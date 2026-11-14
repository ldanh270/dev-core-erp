import { getVietnamHolidayByDate } from "@/config/entities/vietnam-holidays.config"

/**
 * Calculates the number of working days between two dates.
 * Working days exclude weekends (Saturday, Sunday) and national holidays.
 *
 * @param startDate The start date of the period
 * @param endDate The end date of the period
 * @returns The number of working days
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  if (startDate > endDate) return 0

  // Normalize dates to start of day in UTC to avoid timezone shifts during calculation
  const start = new Date(
    Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
  )
  const end = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()))

  let workingDays = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday

    if (!isWeekend) {
      // Check for holidays
      // Format to YYYY-MM-DD
      const dateString = current.toISOString().split("T")[0]
      const holiday = getVietnamHolidayByDate(dateString)

      if (!holiday) {
        workingDays++
      }
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return workingDays
}
