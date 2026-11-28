import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type ControlSize, getControlSizeClass } from "@/config/ui-density.config"
import { cn } from "@/lib/utils"

import * as React from "react"

import { Calendar as CalendarIcon, X } from "lucide-react"

import { DatePicker } from "./date-picker"
import { formatDisplayDate } from "./date-picker.utils"

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
                onChange={(d) => {
                  setTempStart(d)
                }}
                size="sm"
                placeholder="Ngày bắt đầu"
                maxDate={tempEnd || undefined}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Đến ngày</label>
              <DatePicker
                value={tempEnd}
                onChange={(d) => {
                  setTempEnd(d)
                }}
                size="sm"
                placeholder="Ngày kết thúc"
                minDate={tempStart || undefined}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                handleClear()
              }}
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              Đặt lại
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setOpen(false)
                }}
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
