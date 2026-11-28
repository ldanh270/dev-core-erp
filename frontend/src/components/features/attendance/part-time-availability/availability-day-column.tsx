import { Button } from "@/components/ui/button"
import { PART_TIME_AVAILABILITY_RULES } from "@/config/entities/part-time-availability.config"
import { cn } from "@/lib/utils"
import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"

import { CalendarOff, Minus, Plus } from "lucide-react"

interface AvailabilityModeToggleProps {
  isBusyAllDay: boolean
  disabled?: boolean
  onChange: (isBusy: boolean) => void
}

function AvailabilityModeToggle({ isBusyAllDay, disabled, onChange }: AvailabilityModeToggleProps) {
  return (
    <div className="mb-2.5 grid grid-cols-2 gap-0.5 rounded-full bg-muted p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onChange(false)
        }}
        className={cn(
          "rounded-full py-1 text-[10px] font-semibold transition-colors",
          !isBusyAllDay ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        Rảnh
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onChange(true)
        }}
        className={cn(
          "rounded-full py-1 text-[10px] font-semibold transition-colors",
          isBusyAllDay ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        Bận
      </button>
    </div>
  )
}

interface AvailabilitySlotRowProps {
  index: number
  startTime: string
  endTime: string
  canRemove: boolean
  disabled?: boolean
  onUpdate: (patch: Partial<{ startTime: string; endTime: string }>) => void
  onRemove: () => void
}

function AvailabilitySlotRow({
  index,
  startTime,
  endTime,
  canRemove,
  disabled,
  onUpdate,
  onRemove,
}: AvailabilitySlotRowProps) {
  return (
    <div className="relative rounded-lg border border-border/70 p-2.5 space-y-2 bg-muted/5 transition-all hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
          Khung {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={disabled}
            onClick={onRemove}
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
            value={startTime}
            disabled={disabled}
            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
            onChange={(event) => {
              onUpdate({ startTime: event.target.value })
            }}
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="w-6 text-[10px] font-medium text-muted-foreground">Đến:</span>
          <input
            type="time"
            value={endTime}
            disabled={disabled}
            className="availability-time-input flex h-8 w-full rounded-full border border-input/60 bg-background px-3 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
            onChange={(event) => {
              onUpdate({ endTime: event.target.value })
            }}
          />
        </label>
      </div>
    </div>
  )
}

export interface AvailabilityDayColumnProps {
  label?: string
  shortDate?: string
  isToday?: boolean
  embedded?: boolean
  day: IPartTimeAvailabilityDayForm
  disabled?: boolean
  onChange: (day: IPartTimeAvailabilityDayForm) => void
}

/** Single weekday column — busy/available toggle and up to four free-time slots. */
export function AvailabilityDayColumn({
  label,
  shortDate,
  isToday = false,
  embedded = false,
  day,
  disabled,
  onChange,
}: AvailabilityDayColumnProps) {
  const updateSlot = (index: number, patch: Partial<{ startTime: string; endTime: string }>) => {
    const slots = day.slots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, ...patch } : slot,
    )
    onChange({ ...day, slots })
  }

  const addSlot = () => {
    if (day.slots.length >= PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY) return

    onChange({
      ...day,
      slots: [
        ...day.slots,
        {
          startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
          endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
        },
      ],
    })
  }

  const removeSlot = (index: number) => {
    if (day.slots.length <= 1) return
    onChange({
      ...day,
      slots: day.slots.filter((_, slotIndex) => slotIndex !== index),
    })
  }

  const setAvailabilityMode = (isBusyAllDay: boolean) => {
    onChange({
      ...day,
      isBusyAllDay,
      slots: isBusyAllDay
        ? []
        : day.slots.length > 0
          ? day.slots
          : [
              {
                startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
                endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
              },
            ],
    })
  }

  const canAddSlot = day.slots.length < PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY

  const content = (
    <>
      <AvailabilityModeToggle
        isBusyAllDay={day.isBusyAllDay}
        disabled={disabled}
        onChange={setAvailabilityMode}
      />

      {!day.isBusyAllDay ? (
        <div className="space-y-2.5">
          {day.slots.map((slot, index) => (
            <AvailabilitySlotRow
              key={`${day.dayOfWeek}-${index}`}
              index={index}
              startTime={slot.startTime}
              endTime={slot.endTime}
              canRemove={day.slots.length > 1}
              disabled={disabled}
              onUpdate={(patch) => {
                updateSlot(index, patch)
              }}
              onRemove={() => {
                removeSlot(index)
              }}
            />
          ))}

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
              Đã thêm: {day.slots.length}/{PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY} khung giờ
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 py-8 text-center">
          <CalendarOff className="h-5 w-5 text-muted-foreground/60" />
          <p className="text-[10px] font-medium text-muted-foreground/80">Bận cả ngày</p>
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <div
        className={cn(
          "flex min-h-[11rem] flex-col p-2.5",
          day.isBusyAllDay && "bg-muted/10",
          disabled && "opacity-60",
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border bg-card p-3.5",
        day.isBusyAllDay ? "border-dashed border-border bg-muted/15" : "border-border",
        isToday && "border-primary/40 ring-1 ring-primary/15",
        disabled && "opacity-60",
      )}
    >
      {label ? (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            {shortDate ? <p className="text-[11px] text-muted-foreground">{shortDate}</p> : null}
          </div>
          {isToday ? (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Hôm nay
            </span>
          ) : null}
        </div>
      ) : null}
      {content}
    </div>
  )
}
