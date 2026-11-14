import { cn, minutesToTime } from "@/lib/utils"
import type { IAttendanceRecord, IScheduleDay } from "@/types/attendance.types"
import { getCalendarRangeStyle } from "@/utils/attendance/get-calendar-range-style"
import { getMinutesFromDateTime } from "@/utils/attendance/get-minutes-from-date-time"
import { isActualShiftMatched } from "@/utils/attendance/is-actual-shift-matched"

interface ActualWorkBlockProps {
  record: IAttendanceRecord
  scheduleDay?: IScheduleDay
  labelPlacement?: "default" | "top" | "bottom"
}

export function ActualWorkBlock({
  record,
  scheduleDay,
  labelPlacement = "default",
}: ActualWorkBlockProps) {
  const actualStart = getMinutesFromDateTime(record.checkInAt)
  const actualEnd = getMinutesFromDateTime(record.checkOutAt)

  if (actualStart === undefined || actualEnd === undefined) return null

  const isMatched = record.realShift?.isMatched ?? isActualShiftMatched(record, scheduleDay)
  const actualStyle = getCalendarRangeStyle(actualStart, actualEnd)
  const overlaysPlanned = labelPlacement === "bottom"

  if (!actualStyle) return null

  return (
    <div
      className={cn(
        "absolute z-20 flex flex-col rounded-lg border-l-4 px-2.5 py-2 shadow-sm",
        overlaysPlanned ? "inset-x-1" : "inset-x-3",
        labelPlacement === "bottom" && "justify-end",
        isMatched
          ? "border-success bg-success/15 text-success"
          : "border-warning bg-warning/15 text-warning",
      )}
      style={actualStyle}
    >
      <p className="truncate text-xs font-bold leading-tight">
        {isMatched ? "Đúng ca" : "Thời gian thực"}
      </p>
      <p className="mt-0.5 text-xs font-semibold opacity-80">
        {minutesToTime(actualStart)}–{minutesToTime(actualEnd)}
      </p>
    </div>
  )
}
