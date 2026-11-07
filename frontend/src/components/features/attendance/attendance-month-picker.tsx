import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getMonthName } from "@/utils/attendance/get-month-name"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

interface AttendanceMonthPickerProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  className?: string
}

export function AttendanceMonthPicker({
  year,
  month,
  onPrev,
  onNext,
  className,
}: AttendanceMonthPickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full size-9 shrink-0"
        aria-label="Tháng trước"
        onClick={onPrev}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex h-9 items-center justify-center min-w-36 px-4 rounded-full border border-border bg-muted/30 text-sm font-semibold text-foreground shadow-xs">
        <CalendarDays className="size-4 text-muted-foreground mr-2 shrink-0" />
        <span>
          {getMonthName(month)} {year}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full size-9 shrink-0"
        aria-label="Tháng sau"
        onClick={onNext}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
