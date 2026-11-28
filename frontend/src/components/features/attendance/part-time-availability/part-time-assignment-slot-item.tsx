import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"
import { validatePartTimeAssignmentSlot } from "@/utils/attendance/part-time-availability.util"

import { Minus } from "lucide-react"

interface PartTimeAssignmentSlotItemProps {
  slot: { startTime: string | null; endTime: string | null }
  index: number
  disabled?: boolean
  availabilityDay?: IPartTimeAvailabilityDay
  onUpdateSlot: (
    index: number,
    patch: Partial<{ startTime: string | null; endTime: string | null }>,
  ) => void
  onNotifyValidation: (slot: { startTime: string | null; endTime: string | null }) => void
  onRemoveSlot: (index: number) => void
  onSwitchToOff: () => void
}

export function PartTimeAssignmentSlotItem({
  slot,
  index,
  disabled,
  availabilityDay,
  onUpdateSlot,
  onNotifyValidation,
  onRemoveSlot,
  onSwitchToOff,
}: PartTimeAssignmentSlotItemProps) {
  const error = validatePartTimeAssignmentSlot(slot.startTime, slot.endTime, availabilityDay)

  return (
    <div
      className={cn(
        "relative rounded-lg border p-2.5 space-y-2 bg-muted/5 transition-all",
        error
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/70 hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
          Khung {index + 1}
        </span>
        {index === 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={disabled}
            onClick={onSwitchToOff}
            aria-label="Không làm ngày này"
          >
            <Minus className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={disabled}
            onClick={() => onRemoveSlot(index)}
            aria-label="Xóa khung giờ"
          >
            <Minus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5">
          <span className="w-6 text-[10px] font-medium text-muted-foreground">Từ:</span>
          <input
            type="time"
            value={slot.startTime ?? ""}
            disabled={disabled}
            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
            onChange={(event) => onUpdateSlot(index, { startTime: event.target.value || null })}
            onBlur={() => onNotifyValidation(slot)}
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="w-6 text-[10px] font-medium text-muted-foreground">Đến:</span>
          <input
            type="time"
            value={slot.endTime ?? ""}
            disabled={disabled}
            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
            onChange={(event) => onUpdateSlot(index, { endTime: event.target.value || null })}
            onBlur={() => onNotifyValidation(slot)}
          />
        </label>
      </div>

      {error ? (
        <p className="text-[9px] font-medium text-destructive leading-tight">{error}</p>
      ) : (
        <p className="text-[9px] text-muted-foreground/60 leading-tight">
          Chỉnh giờ trong khung rảnh
        </p>
      )}
    </div>
  )
}
