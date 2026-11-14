import {
  DAY_OF_WEEK_FULL_LABELS,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

import { AvailabilityWeekSegment } from "./availability-week-segment"

interface AvailabilityWeekGridProps {
  weekStart: Date
  days: IPartTimeAvailabilityDayForm[]
  disabled?: boolean
  onDayChange: (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => void
}

/** Responsive week grid — full row on desktop, split segments on mobile. */
export function AvailabilityWeekGrid({
  weekStart,
  days,
  disabled,
  onDayChange,
}: AvailabilityWeekGridProps) {
  const weekDates = getWeekDates(
    weekStart,
    (dayOfWeek) => DAY_OF_WEEK_FULL_LABELS.get(dayOfWeek) ?? "",
  )
  const todayKey = formatDateParam(new Date())

  const orderedWeekDays = WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) =>
    weekDates.find((entry) => entry.dayOfWeek === dayOfWeek),
  ).filter((entry): entry is WeekDay => Boolean(entry))

  const segmentProps = { days, todayKey, disabled, onDayChange }
  const compactSegments = [orderedWeekDays.slice(0, 4), orderedWeekDays.slice(4)]

  return (
    <div className="space-y-4">
      <div className="hidden xl:block">
        <AvailabilityWeekSegment segmentDays={orderedWeekDays} {...segmentProps} />
      </div>

      <div className="space-y-4 xl:hidden">
        {compactSegments.map((segmentDays, index) => (
          <AvailabilityWeekSegment key={index} segmentDays={segmentDays} {...segmentProps} />
        ))}
      </div>
    </div>
  )
}
