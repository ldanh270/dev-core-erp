import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type ControlSize, getControlSizeClass } from "@/config/ui-density.config"
import { cn } from "@/lib/utils"

import * as React from "react"

import { Calendar as CalendarIcon, X } from "lucide-react"

import { DatePickerCalendar } from "./date-picker-calendar"
import { formatDateToIso, formatDisplayDate, parseDate } from "./date-picker.utils"

export interface DatePickerProps {
  id?: string
  value?: string | null // ISO string YYYY-MM-DD or null
  onChange?: (date: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  size?: ControlSize
  clearable?: boolean
  minDate?: string
  maxDate?: string
}

/**
 * Reusable DatePicker adhering to DevCore ERP Design Spec (The Pill Rule + Semantic Tokens).
 * Bọc Radix Popover với giao diện lịch tương tác, chuẩn format DD/MM/YYYY.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Chọn ngày...",
  disabled = false,
  className,
  triggerClassName,
  size = "default",
  clearable = true,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => parseDate(value), [value])

  const [currentYear, setCurrentYear] = React.useState<number>(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear(),
  )
  const [currentMonth, setCurrentMonth] = React.useState<number>(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth(),
  )

  // Sync viewed month/year when value changes
  React.useEffect(() => {
    if (selectedDate) {
      setCurrentYear(selectedDate.getFullYear())
      setCurrentMonth(selectedDate.getMonth())
    }
  }, [selectedDate])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const prevYear = () => {
    setCurrentYear((y) => y - 1)
  }

  const nextYear = () => {
    setCurrentYear((y) => y + 1)
  }

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day)
    const isoString = formatDateToIso(selected)
    onChange?.(isoString)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
  }

  const handleGoToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    handleSelectDay(now.getDate())
  }

  const handleReset = () => {
    onChange?.(null)
    setOpen(false)
  }

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal border-border bg-background hover:bg-muted/40 transition-colors shadow-xs",
              getControlSizeClass(size),
              !value && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">
              {value ? formatDisplayDate(value) : placeholder}
            </span>
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Xóa ngày"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0 border-0 bg-transparent shadow-none">
          <DatePickerCalendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            value={value}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onPrevYear={prevYear}
            onNextYear={nextYear}
            onSelectDay={handleSelectDay}
            onClear={handleReset}
            onGoToday={handleGoToday}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
