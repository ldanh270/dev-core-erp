import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getControlSizeClass, type ControlSize } from "@/config/ui-density.config"
import { cn } from "@/lib/utils"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Clock, X } from "lucide-react"

export interface TimePickerProps {
  id?: string
  value?: string | null // "HH:mm" e.g. "08:30"
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: ControlSize
  clearable?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

/**
 * Standard ERP TimePicker component.
 * Replaces native browser input[type="time"] with a themed, rounded-xl Popover picker.
 */
export function TimePicker({
  id,
  value,
  onChange,
  placeholder = "--:--",
  disabled = false,
  className,
  size = "default",
  clearable = true,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)

  // Parse current value
  const parsedHour = value && value.includes(":") ? value.split(":")[0] : ""
  const parsedMinute = value && value.includes(":") ? value.split(":")[1] : ""

  const hoursContainerRef = useRef<HTMLDivElement>(null)
  const minutesContainerRef = useRef<HTMLDivElement>(null)
  const selectedHourRef = useRef<HTMLButtonElement>(null)
  const selectedMinuteRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll active items into view when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (hoursContainerRef.current && selectedHourRef.current) {
          hoursContainerRef.current.scrollTop = selectedHourRef.current.offsetTop - 60
        }
        if (minutesContainerRef.current && selectedMinuteRef.current) {
          minutesContainerRef.current.scrollTop = selectedMinuteRef.current.offsetTop - 60
        }
      }, 50)
    }
  }, [open, parsedHour, parsedMinute])

  const handleSelectHour = (h: string) => {
    const nextMinute = parsedMinute || "00"
    onChange?.(`${h}:${nextMinute}`)
  }

  const handleSelectMinute = (m: string) => {
    const nextHour = parsedHour || "08"
    onChange?.(`${nextHour}:${m}`)
  }

  const handleSetNow = () => {
    const now = new Date()
    const h = String(now.getHours()).padStart(2, "0")
    const m = String(now.getMinutes()).padStart(2, "0")
    onChange?.(`${h}:${m}`)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "w-full border border-input bg-background font-normal text-foreground transition-all duration-200 outline-none flex items-center justify-between gap-2 shadow-2xs hover:border-primary/50 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
            getControlSizeClass(size),
            className
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground font-mono")}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Xóa giờ"
              >
                <X className="size-3" />
              </span>
            )}
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-2 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-[9999]"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-2 px-1">
          <span className="text-xs font-bold text-foreground">
            {value ? (
              <span className="font-mono text-primary font-extrabold">{value}</span>
            ) : (
              "Chọn thời gian"
            )}
          </span>
          <button
            type="button"
            onClick={handleSetNow}
            className="text-[11px] font-semibold text-primary hover:underline px-1.5 py-0.5 rounded-full hover:bg-primary/10 transition-colors"
          >
            Bây giờ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Hours column */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center pb-1 border-b border-border/40">
              Giờ
            </span>
            <div
              ref={hoursContainerRef}
              className="h-44 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20"
            >
              {HOURS.map((h) => {
                const isSelected = parsedHour === h
                return (
                  <button
                    key={h}
                    ref={isSelected ? selectedHourRef : undefined}
                    type="button"
                    onClick={() => {
                      handleSelectHour(h)
                    }}
                    className={cn(
                      "w-full h-7 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Minutes column */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center pb-1 border-b border-border/40">
              Phút
            </span>
            <div
              ref={minutesContainerRef}
              className="h-44 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20"
            >
              {MINUTES.map((m) => {
                const isSelected = parsedMinute === m
                return (
                  <button
                    key={m}
                    ref={isSelected ? selectedMinuteRef : undefined}
                    type="button"
                    onClick={() => {
                      handleSelectMinute(m)
                    }}
                    className={cn(
                      "w-full h-7 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
