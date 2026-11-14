import { ActualWorkBlock } from "@/components/features/attendance/calendar/actual-work-block"
import { HolidayBlock } from "@/components/features/attendance/calendar/holiday-block"
import { PlannedShiftBlock } from "@/components/features/attendance/calendar/planned-shift-block"
import { ShiftOptionBlock } from "@/components/features/attendance/calendar/shift-option-block"
import { CALENDAR_HOURS, type CalendarTab } from "@/config/rules/calendar.config"
import { cn } from "@/lib/utils"
import type {
  IAttendanceRecord,
  IHoliday,
  IScheduleDay,
  IWorkingShift,
} from "@/types/attendance.types"
import { getMinutesFromDateTime } from "@/utils/attendance/get-minutes-from-date-time"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

interface CalendarDayColumnProps {
  day: WeekDay
  todayDayOfWeek: number
  activeTab: CalendarTab
  showAllShifts: boolean
  scheduleDay?: IScheduleDay
  record?: IAttendanceRecord
  holiday?: IHoliday
  activeShifts: IWorkingShift[]
}

export function CalendarDayColumn({
  day,
  todayDayOfWeek,
  activeTab,
  showAllShifts,
  scheduleDay,
  record,
  holiday,
  activeShifts,
}: CalendarDayColumnProps) {
  const hasCompleteActual =
    activeTab === "actual" &&
    Boolean(record?.checkInAt && record?.checkOutAt) &&
    getMinutesFromDateTime(record?.checkInAt) !== undefined &&
    getMinutesFromDateTime(record?.checkOutAt) !== undefined

  const overlaysPlannedAndActual =
    activeTab === "actual" && hasCompleteActual && Boolean(scheduleDay)

  const showPlannedShift =
    !holiday &&
    Boolean(scheduleDay) &&
    ((activeTab === "planned" && !showAllShifts) || activeTab === "actual")

  return (
    <div
      className={cn(
        "relative divide-y divide-border/40 border-r border-border/60 last:border-r-0",
        day.dayOfWeek === todayDayOfWeek && "bg-primary/5",
      )}
    >
      {CALENDAR_HOURS.map((hour) => (
        <div key={hour} className="h-12" />
      ))}
      {holiday ? <HolidayBlock holiday={holiday} /> : null}
      {!holiday && showAllShifts && activeTab === "planned"
        ? activeShifts.map((shift) => (
            <ShiftOptionBlock
              key={shift.id}
              shift={shift}
              isAssigned={shift.id === scheduleDay?.shiftId}
            />
          ))
        : null}
      {showPlannedShift && scheduleDay ? (
        <PlannedShiftBlock
          scheduleDay={scheduleDay}
          isMuted={activeTab === "actual"}
          labelPlacement={overlaysPlannedAndActual ? "top" : "default"}
        />
      ) : null}
      {!holiday && activeTab === "actual" && record && hasCompleteActual ? (
        <ActualWorkBlock
          record={record}
          scheduleDay={scheduleDay}
          labelPlacement={overlaysPlannedAndActual ? "bottom" : "default"}
        />
      ) : null}
    </div>
  )
}
