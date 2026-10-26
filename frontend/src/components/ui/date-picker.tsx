import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import * as React from "react"

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"

export interface DatePickerProps {
  value?: string | Date | null
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  id?: string
  name?: string
  clearable?: boolean
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày...",
  disabled = false,
  className,
  minDate,
  maxDate,
  id,
  name,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsedDate = React.useMemo(() => {
    if (!value) return null
    if (value instanceof Date) return isValid(value) ? value : null
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : null
  }, [value])

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => parsedDate || new Date(),
  )

  React.useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate)
    }
  }, [parsedDate])

  const daysInGrid = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const handleSelect = (day: Date) => {
    if (minDate && isBefore(day, minDate)) return
    if (maxDate && isAfter(day, maxDate)) return
    onChange?.(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
  }

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            name={name}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-11 justify-start text-left font-normal rounded-full px-4 border-border bg-background hover:bg-muted/40 transition-colors shadow-xs",
              !parsedDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate flex-1">
              {parsedDate ? format(parsedDate, "dd/MM/yyyy") : placeholder}
            </span>
            {clearable && parsedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="ml-1 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-3.5 rounded-2xl bg-card border border-border shadow-xl z-50"
        >
          {/* Header Tháng / Năm */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-border">
            <span className="font-semibold text-sm text-foreground capitalize">
              Tháng {format(currentMonth, "M / yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-muted"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-muted"
                onClick={() => setCurrentMonth(new Date())}
                title="Hôm nay"
              >
                <span className="text-xs font-bold">●</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-muted"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hàng Thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS.map((wd) => (
              <span
                key={wd}
                className="text-xs font-semibold text-muted-foreground w-8 h-7 flex items-center justify-center"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Lưới Ngày trong tháng */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysInGrid.map((day) => {
              const isSelected = parsedDate ? isSameDay(day, parsedDate) : false
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isToday = isSameDay(day, new Date())
              const isDisabled =
                (minDate && isBefore(day, minDate)) ||
                (maxDate && isAfter(day, maxDate))

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 w-8 text-xs font-medium rounded-full flex items-center justify-center transition-colors cursor-pointer",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isSelected && "text-foreground hover:bg-muted",
                    isToday && !isSelected && "border border-primary text-primary font-bold",
                    isSelected && "bg-primary text-primary-foreground font-semibold shadow-xs",
                    isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
