import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getControlSizeClass, type ControlSize } from "@/config/ui-density.config"
import { cn } from "@/lib/utils"

import * as React from "react"

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react"

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

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
]

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    return new Date(y, m, d)
  }
  return null
}

function formatDateToIso(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

  const daysInMonth = React.useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate()
  }, [currentYear, currentMonth])

  // Get weekday of 1st day of the month (Monday = 0, Sunday = 6)
  const firstDayOfWeek = React.useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay()
    return day === 0 ? 6 : day - 1
  }, [currentYear, currentMonth])

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

        <PopoverContent
          align="start"
          className="w-[280px] p-3 rounded-2xl bg-card border border-border shadow-lg"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={prevYear}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                title="Năm trước"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={prevMonth}
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
                onClick={nextMonth}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={nextYear}
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
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-7 w-7 text-xs rounded-full flex items-center justify-center transition-all cursor-pointer font-medium",
                    selected && "bg-primary text-primary-foreground font-semibold shadow-xs",
                    !selected && today && "border border-primary text-primary font-bold",
                    !selected &&
                      !today &&
                      !disabledDay &&
                      "text-foreground hover:bg-muted hover:text-foreground",
                    disabledDay && "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                setCurrentYear(now.getFullYear())
                setCurrentMonth(now.getMonth())
                handleSelectDay(now.getDate())
              }}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange?.(null)
                  setOpen(false)
                }}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                Xóa chọn
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export interface DateRangePickerProps {
  id?: string
  startDate?: string | null
  endDate?: string | null
  onChange?: (range: { startDate: string | null; endDate: string | null }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  size?: ControlSize
  clearable?: boolean
}

/**
 * Reusable DateRangePicker for filter toolbars and reporting intervals.
 */
export function DateRangePicker({
  id,
  startDate,
  endDate,
  onChange,
  placeholder = "Chọn khoảng ngày...",
  disabled = false,
  className,
  triggerClassName,
  size = "default",
  clearable = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [tempStart, setTempStart] = React.useState<string | null>(startDate || null)
  const [tempEnd, setTempEnd] = React.useState<string | null>(endDate || null)

  React.useEffect(() => {
    setTempStart(startDate || null)
    setTempEnd(endDate || null)
  }, [startDate, endDate])

  const displayText = React.useMemo(() => {
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    }
    if (startDate) {
      return `Từ ${formatDisplayDate(startDate)}`
    }
    if (endDate) {
      return `Đến ${formatDisplayDate(endDate)}`
    }
    return placeholder
  }, [startDate, endDate, placeholder])

  const handleApply = () => {
    onChange?.({ startDate: tempStart, endDate: tempEnd })
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTempStart(null)
    setTempEnd(null)
    onChange?.({ startDate: null, endDate: null })
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
              !startDate && !endDate && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{displayText}</span>
            {clearable && (startDate || endDate) && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Xóa khoảng ngày"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[300px] p-4 rounded-2xl bg-card border border-border shadow-lg space-y-4"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground">Chọn khoảng thời gian</h4>
            <p className="text-[11px] text-muted-foreground">
              Lọc dữ liệu theo ngày bắt đầu và kết thúc
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Từ ngày</label>
              <DatePicker
                value={tempStart}
                onChange={(d) => setTempStart(d)}
                size="sm"
                placeholder="Ngày bắt đầu"
                maxDate={tempEnd || undefined}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Đến ngày</label>
              <DatePicker
                value={tempEnd}
                onChange={(d) => setTempEnd(d)}
                size="sm"
                placeholder="Ngày kết thúc"
                minDate={tempStart || undefined}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => handleClear()}
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              Đặt lại
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setOpen(false)}
                className="rounded-full"
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={handleApply}
                className="rounded-full"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
