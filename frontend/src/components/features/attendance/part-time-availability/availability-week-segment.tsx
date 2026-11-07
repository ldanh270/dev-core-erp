import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

import { AvailabilityDayColumn } from "./availability-day-column"

export interface AvailabilityWeekSegmentProps {
  segmentDays: WeekDay[]
  days: IPartTimeAvailabilityDayForm[]
  todayKey: string
  disabled?: boolean
  onDayChange: (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => void
}

/** Renders one horizontal week segment (header row + day columns). */
export function AvailabilityWeekSegment({
  segmentDays,
  days,
  todayKey,
  disabled,
  onDayChange,
}: AvailabilityWeekSegmentProps) {
  const columnCount = segmentDays.length

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="overflow-x-auto">
        <div
          className="grid divide-x divide-border/60 border-b border-border/60 bg-secondary/40 text-center text-xs font-semibold text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(140px, 1fr))` }}
        >
          {segmentDays.map((weekDay) => (
            <div
              key={weekDay.dayOfWeek}
              className={cn(
                "px-2 py-2.5",
                weekDay.dateKey === todayKey && "bg-primary/5 text-primary",
              )}
            >
              <div className="truncate uppercase tracking-wide opacity-80">{weekDay.label}</div>
              <div className="mt-0.5 text-[11px] font-medium text-foreground">{weekDay.shortDate}</div>
              {weekDay.dateKey === todayKey ? (
                <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                  Hôm nay
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div
          className="grid divide-x divide-border/60 bg-card"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(140px, 1fr))` }}
        >
          {segmentDays.map((weekDay) => {
            const day = days.find((entry) => entry.dayOfWeek === weekDay.dayOfWeek)
            if (!day) return null

            return (
              <AvailabilityDayColumn
                key={weekDay.dayOfWeek}
                embedded
                day={day}
                disabled={disabled}
                onChange={(next) => {
                  onDayChange(weekDay.dayOfWeek, next)
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
