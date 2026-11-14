import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DAY_OF_WEEK_LABELS,
  WEEKLY_SCHEDULE_OFF_SHIFT_VALUE,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import type { IWeeklyScheduleTemplateWeek, IWorkingShift } from "@/types/attendance.types"

interface TemplateWeekGridProps {
  week: IWeeklyScheduleTemplateWeek
  shifts: IWorkingShift[]
  onDayChange: (dayOfWeek: number, shiftId: string | null) => void
}

export function TemplateWeekGrid({ week, shifts, onDayChange }: TemplateWeekGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
        const day = week.days.find((item) => item.dayOfWeek === dayOfWeek)
        const value = day?.shiftId ?? WEEKLY_SCHEDULE_OFF_SHIFT_VALUE
        const selectedShift = shifts.find((shift) => shift.id === day?.shiftId)
        const displayLabel =
          value === WEEKLY_SCHEDULE_OFF_SHIFT_VALUE ? "Nghỉ" : (selectedShift?.name ?? "Chọn ca")

        return (
          <div key={dayOfWeek} className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {DAY_OF_WEEK_LABELS.get(dayOfWeek)}
            </p>
            <Select
              value={value}
              onValueChange={(next) => {
                onDayChange(dayOfWeek, next === WEEKLY_SCHEDULE_OFF_SHIFT_VALUE ? null : next)
              }}
            >
              <SelectTrigger
                className="h-9 w-full min-w-0 rounded-full px-2.5 text-xs"
                title={displayLabel}
              >
                <SelectValue placeholder="Chọn ca">
                  <span className="block truncate">{displayLabel}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WEEKLY_SCHEDULE_OFF_SHIFT_VALUE}>Nghỉ</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}
