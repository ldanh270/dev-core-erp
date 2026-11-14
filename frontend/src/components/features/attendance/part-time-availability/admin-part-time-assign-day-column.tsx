import { Button } from "@/components/ui/button"
import {
  PART_TIME_AVAILABILITY_ASSIGN_LABELS,
  PART_TIME_AVAILABILITY_ASSIGN_VALIDATION,
  PART_TIME_AVAILABILITY_RULES,
} from "@/config/entities/part-time-availability.config"
import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"
import type { IPartTimeAssignmentDayForm } from "@/utils/attendance/part-time-availability.util"
import {
  buildOutsideFreeRangeAlert,
  buildScheduledSlotsFromAvailabilityDay,
  formatAvailabilityDaySummary,
  formatAvailabilityRangesForAssign,
  validatePartTimeAssignmentSlot,
} from "@/utils/attendance/part-time-availability.util"

import { CalendarOff, Minus, Plus } from "lucide-react"
import { toast } from "sonner"

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
  const isBusyDay = Boolean(availabilityDay?.isBusyAllDay)
  const canAddSlot = assignment.slots.length < PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY
  const freeRangesLabel = formatAvailabilityRangesForAssign(availabilityDay)

  const notifySlotValidation = (slot: { startTime: string | null; endTime: string | null }) => {
    if (!slot.startTime && !slot.endTime) return

    const error = validatePartTimeAssignmentSlot(slot.startTime, slot.endTime, availabilityDay)
    if (!error) return

    // Immediate feedback when admin enters a shift outside the employee's declared free window.
    if (error === PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE) {
      toast.error(buildOutsideFreeRangeAlert(dayLabel, availabilityDay))
      return
    }

    if (slot.startTime && slot.endTime) {
      toast.error(`${dayLabel}: ${error}`)
    }
  }

  const setScheduled = (isScheduled: boolean) => {
    onChange({
      ...assignment,
      isScheduled,
      // "Work" re-seeds from availability; "Off" clears slots (day excluded from assign payload).
      slots: isScheduled
        ? buildScheduledSlotsFromAvailabilityDay(availabilityDay)
        : [{ startTime: null, endTime: null }],
    })
  }

  const updateSlot = (
    index: number,
    patch: Partial<{ startTime: string | null; endTime: string | null }>,
  ) => {
    onChange({
      ...assignment,
      slots: assignment.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    })
  }

  const addSlot = () => {
    if (!canAddSlot) return
    onChange({
      ...assignment,
      slots: [
        ...assignment.slots,
        {
          startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
          endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
        },
      ],
    })
  }

  const removeSlot = (index: number) => {
    // Extra slots (Khung 2+) can be removed; Khung 1 uses minus to switch day to "Off".
    if (assignment.slots.length <= 1) return
    onChange({
      ...assignment,
      slots: assignment.slots.filter((_, slotIndex) => slotIndex !== index),
    })
  }

  const handleWorkDayClick = () => {
    setScheduled(true)
  }

  const handleOffDayClick = () => {
    setScheduled(false)
  }

  return (
    <div
      className={cn(
        "flex min-h-[14rem] flex-col space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:shadow-sm",
        isBusyDay && "bg-muted/10 border-dashed opacity-85",
        !isBusyDay && !assignment.isScheduled && "border-dashed",
        disabled && "opacity-60",
      )}
    >
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

      {isBusyDay ? (
        // Employee marked busy all day — admin cannot assign; column is display-only.
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 py-8 text-center">
          <CalendarOff className="h-5 w-5 text-muted-foreground/60" />
          <p className="text-[10px] font-medium text-muted-foreground/80">Bận cả ngày</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-0.5 rounded-full bg-muted p-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={handleWorkDayClick}
              className={cn(
                "rounded-full py-1 text-[10px] font-semibold transition-colors",
                assignment.isScheduled
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.WORK_DAY}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleOffDayClick}
              className={cn(
                "rounded-full py-1 text-[10px] font-semibold transition-colors",
                !assignment.isScheduled
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.OFF_DAY}
            </button>
          </div>

          {!assignment.isScheduled ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 py-8 text-center">
              <CalendarOff className="h-5 w-5 text-muted-foreground/60" />
              <p className="text-[10px] font-medium text-muted-foreground/80">
                {PART_TIME_AVAILABILITY_ASSIGN_LABELS.OFF_DAY_HINT}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              {freeRangesLabel ? (
                <p className="text-[9px] text-muted-foreground leading-tight">
                  {PART_TIME_AVAILABILITY_ASSIGN_LABELS.FREE_RANGE_HINT}: {freeRangesLabel}
                </p>
              ) : null}

              <div className="space-y-2.5">
                {assignment.slots.map((slot, index) => {
                  const error = validatePartTimeAssignmentSlot(
                    slot.startTime,
                    slot.endTime,
                    availabilityDay,
                  )

                  return (
                    <div
                      key={`${assignment.dayOfWeek}-${index}`}
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
                            // First slot minus switches day to "Off" instead of removing the only row.
                            onClick={handleOffDayClick}
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
                            onClick={function handleRemoveSlotClick() {
                              removeSlot(index)
                            }}
                            aria-label="Xóa khung giờ"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5">
                          <span className="w-6 text-[10px] font-medium text-muted-foreground">
                            Từ:
                          </span>
                          <input
                            type="time"
                            value={slot.startTime ?? ""}
                            disabled={disabled}
                            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
                            onChange={function handleStartTimeChange(event) {
                              updateSlot(index, { startTime: event.target.value || null })
                            }}
                            onBlur={function handleStartTimeBlur() {
                              // Validate captured slot — not assignment.slots[index] (stale after rapid edits).
                              notifySlotValidation(slot)
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-1.5">
                          <span className="w-6 text-[10px] font-medium text-muted-foreground">
                            Đến:
                          </span>
                          <input
                            type="time"
                            value={slot.endTime ?? ""}
                            disabled={disabled}
                            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
                            onChange={function handleEndTimeChange(event) {
                              updateSlot(index, { endTime: event.target.value || null })
                            }}
                            onBlur={function handleEndTimeBlur() {
                              // Validate captured slot — not assignment.slots[index] (stale after rapid edits).
                              notifySlotValidation(slot)
                            }}
                          />
                        </label>
                      </div>

                      {error ? (
                        <p className="text-[9px] font-medium text-destructive leading-tight">
                          {error}
                        </p>
                      ) : (
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">
                          Chỉnh giờ trong khung rảnh
                        </p>
                      )}
                    </div>
                  )
                })}
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
                  Đã thêm: {assignment.slots.length}/
                  {PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY} khung giờ
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
