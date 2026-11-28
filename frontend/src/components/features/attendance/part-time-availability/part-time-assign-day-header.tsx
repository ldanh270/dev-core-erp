import { PART_TIME_AVAILABILITY_ASSIGN_LABELS } from "@/config/entities/part-time-availability.config"
import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"
import { formatAvailabilityDaySummary } from "@/utils/attendance/part-time-availability.util"

import { CalendarOff } from "lucide-react"

interface PartTimeAssignDayHeaderProps {
  dayLabel: string
  shortDate?: string
  availabilityDay?: IPartTimeAvailabilityDay
  isBusyDay: boolean
  isScheduled: boolean
  disabled?: boolean
  onWorkDayClick: () => void
  onOffDayClick: () => void
}

export function PartTimeAssignDayHeader({
  dayLabel,
  shortDate,
  availabilityDay,
  isBusyDay,
  isScheduled,
  disabled,
  onWorkDayClick,
  onOffDayClick,
}: PartTimeAssignDayHeaderProps) {
  return (
    <>
      <div className="space-y-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{dayLabel}</span>
          {shortDate ? (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-full">
              {shortDate}
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          {isBusyDay ? (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[9px] font-medium text-destructive">
              Bận cả ngày
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-medium text-success max-w-full truncate"
              title={`Rảnh: ${formatAvailabilityDaySummary(availabilityDay)}`}
            >
              Rảnh: {formatAvailabilityDaySummary(availabilityDay)}
            </span>
          )}
        </div>
      </div>

      {!isBusyDay && (
        <div className="grid grid-cols-2 gap-0.5 rounded-full bg-muted p-0.5">
          <button
            type="button"
            disabled={disabled}
            onClick={onWorkDayClick}
            className={cn(
              "rounded-full py-1 text-[10px] font-semibold transition-colors",
              isScheduled ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {PART_TIME_AVAILABILITY_ASSIGN_LABELS.WORK_DAY}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onOffDayClick}
            className={cn(
              "rounded-full py-1 text-[10px] font-semibold transition-colors",
              !isScheduled ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {PART_TIME_AVAILABILITY_ASSIGN_LABELS.OFF_DAY}
          </button>
        </div>
      )}

      {isBusyDay && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 py-8 text-center">
          <CalendarOff className="h-5 w-5 text-muted-foreground/60" />
          <p className="text-[10px] font-medium text-muted-foreground/80">Bận cả ngày</p>
        </div>
      )}
    </>
  )
}
