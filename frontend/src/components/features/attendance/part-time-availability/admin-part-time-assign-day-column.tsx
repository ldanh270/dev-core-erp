import { Button } from "@/components/ui/button"
import {
  PART_TIME_AVAILABILITY_ASSIGN_LABELS,
  PART_TIME_AVAILABILITY_RULES,
} from "@/config/entities/part-time-availability.config"
import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"
import type { IPartTimeAssignmentDayForm } from "@/utils/attendance/part-time-availability.util"
import { formatAvailabilityRangesForAssign } from "@/utils/attendance/part-time-availability.util"

import { CalendarOff, Plus } from "lucide-react"

import { PartTimeAssignDayHeader } from "./part-time-assign-day-header"
import { PartTimeAssignmentSlotItem } from "./part-time-assignment-slot-item"
import { usePartTimeDayAssignment } from "./use-part-time-day-assignment"

interface AdminPartTimeAssignDayColumnProps {
  dayLabel: string
  shortDate?: string
  availabilityDay?: IPartTimeAvailabilityDay
  assignment: IPartTimeAssignmentDayForm
  disabled?: boolean
  onChange: (assignment: IPartTimeAssignmentDayForm) => void
}

/** Admin assign grid column — shows free ranges, add/remove slots, validates against availability. */
export function AdminPartTimeAssignDayColumn({
  dayLabel,
  shortDate,
  availabilityDay,
  assignment,
  disabled,
  onChange,
}: AdminPartTimeAssignDayColumnProps) {
  const {
    isBusyDay,
    canAddSlot,
    notifySlotValidation,
    setScheduled,
    updateSlot,
    addSlot,
    removeSlot,
  } = usePartTimeDayAssignment({
    dayLabel,
    availabilityDay,
    assignment,
    onChange,
  })

  const freeRangesLabel = formatAvailabilityRangesForAssign(availabilityDay)

  return (
    <div
      className={cn(
        "flex min-h-[14rem] flex-col space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:shadow-sm",
        isBusyDay && "bg-muted/10 border-dashed opacity-85",
        !isBusyDay && !assignment.isScheduled && "border-dashed",
        disabled && "opacity-60",
      )}
    >
      <PartTimeAssignDayHeader
        dayLabel={dayLabel}
        shortDate={shortDate}
        availabilityDay={availabilityDay}
        isBusyDay={isBusyDay}
        isScheduled={assignment.isScheduled}
        disabled={disabled}
        onWorkDayClick={() => setScheduled(true)}
        onOffDayClick={() => setScheduled(false)}
      />

      {!isBusyDay && !assignment.isScheduled && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 py-8 text-center">
          <CalendarOff className="h-5 w-5 text-muted-foreground/60" />
          <p className="text-[10px] font-medium text-muted-foreground/80">
            {PART_TIME_AVAILABILITY_ASSIGN_LABELS.OFF_DAY_HINT}
          </p>
        </div>
      )}

      {!isBusyDay && assignment.isScheduled && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {freeRangesLabel ? (
            <p className="text-[9px] text-muted-foreground leading-tight">
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.FREE_RANGE_HINT}: {freeRangesLabel}
            </p>
          ) : null}

          <div className="space-y-2.5">
            {assignment.slots.map((slot, index) => (
              <PartTimeAssignmentSlotItem
                key={`${assignment.dayOfWeek}-${index}`}
                slot={slot}
                index={index}
                disabled={disabled}
                availabilityDay={availabilityDay}
                onUpdateSlot={updateSlot}
                onNotifyValidation={notifySlotValidation}
                onRemoveSlot={removeSlot}
                onSwitchToOff={() => setScheduled(false)}
              />
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {canAddSlot ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 rounded-full border-dashed border-primary/30 hover:border-primary/50 text-primary hover:bg-primary/5 text-[10px] font-medium gap-1"
                disabled={disabled}
                onClick={addSlot}
              >
                <Plus className="h-3 w-3" /> Thêm khung giờ
              </Button>
            ) : null}

            <div className="text-center text-[9px] text-muted-foreground/60">
              Đã thêm: {assignment.slots.length}/{PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY}{" "}
              khung giờ
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
