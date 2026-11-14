import { Skeleton } from "@/components/ui/skeleton"
import { useMyPartTimeAvailability } from "@/hooks/attendance/use-part-time-availability"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import {
  clampToEarliestRequestableWeek,
  getEarliestRequestableWeekStart,
} from "@/utils/attendance/part-time-availability.util"

import { useMemo, useState } from "react"

import { EmployeePartTimeAvailabilityForm } from "./employee-part-time-availability-form"

/** Employee page shell — week navigation + loading gate around the form. */
export function EmployeePartTimeAvailabilityView() {
  const earliestWeekStart = useMemo(() => getEarliestRequestableWeekStart(), [])
  const earliestWeekStartKey = formatDateParam(earliestWeekStart)

  const [weekStart, setWeekStart] = useState(() => getEarliestRequestableWeekStart())
  const weekStartKey = formatDateParam(weekStart)
  const weekDays = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(weekDays), [weekDays])

  const { data: availability, isLoading } = useMyPartTimeAvailability(weekStartKey)

  const canGoToPreviousWeek = weekStart.getTime() > earliestWeekStart.getTime()

  const handleWeekStartChange = (nextWeekStart: Date) => {
    setWeekStart(clampToEarliestRequestableWeek(nextWeekStart))
  }

  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * 7)
    handleWeekStartChange(next)
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  return (
    <EmployeePartTimeAvailabilityForm
      key={`${weekStartKey}-${availability?.id ?? "new"}`}
      availability={availability}
      weekStart={weekStart}
      weekStartKey={weekStartKey}
      weekRangeLabel={weekRangeLabel}
      earliestWeekStart={earliestWeekStart}
      earliestWeekStartKey={earliestWeekStartKey}
      canGoToPreviousWeek={canGoToPreviousWeek}
      onWeekStartChange={handleWeekStartChange}
      onShiftWeek={shiftWeek}
    />
  )
}
