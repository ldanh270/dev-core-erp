import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { DAYS_OF_WEEK, MONTH_NAMES, formatDateToIso } from "./date-picker.utils"

export interface DatePickerCalendarProps {
  currentYear: number
  currentMonth: number
  selectedDate: Date | null
  minDate?: string
  maxDate?: string
  value?: string | null
  onPrevMonth: () => void
  onNextMonth: () => void
  onPrevYear: () => void
  onNextYear: () => void
  onSelectDay: (day: number) => void
  onClear: () => void
  onGoToday: () => void
}

export function DatePickerCalendar({
  currentYear,
  currentMonth,
  selectedDate,
  minDate,
  maxDate,
  value,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  onSelectDay,
  onClear,
  onGoToday,
}: DatePickerCalendarProps) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const firstDayOfWeek = firstDay === 0 ? 6 : firstDay - 1

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    )
  }

  const isToday = (day: number) => {
    const now = new Date()
    return (
      now.getFullYear() === currentYear &&
      now.getMonth() === currentMonth &&
      now.getDate() === day
    )
  }

  const isDisabledDay = (day: number) => {
    const dateStr = formatDateToIso(new Date(currentYear, currentMonth, day))
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  return (
    <div className="w-[280px] p-3 rounded-2xl bg-card border border-border shadow-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrevYear}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Năm trước"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrevMonth}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <span className="text-xs font-semibold text-foreground">
          {MONTH_NAMES[currentMonth % 12] ?? "Tháng"} {currentYear}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNextYear}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Năm sau"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <span key={d} className="text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const selected = isSelected(day)
          const today = isToday(day)
          const disabledDay = isDisabledDay(day)

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={disabledDay}
              onClick={() => onSelectDay(day)}
              className={cn(
                "h-7 w-7 text-xs rounded-full flex items-center justify-center transition-all cursor-pointer font-medium",
                selected && "bg-primary text-primary-foreground font-semibold shadow-xs",
                !selected && today && "border border-primary text-primary font-bold",
                !selected &&
                  !today &&
                  !disabledDay &&
                  "text-foreground hover:bg-muted hover:text-foreground",
                disabledDay &&
                  "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Today / Clear Shortcuts */}
      <div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={onGoToday}
          className="text-xs font-medium text-primary hover:underline cursor-pointer"
        >
          Hôm nay
        </button>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          >
            Xóa chọn
          </button>
        )}
      </div>
    </div>
  )
}
