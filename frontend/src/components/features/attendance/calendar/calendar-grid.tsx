import { EmptyState } from "@/components/common"
import { CalendarDayColumn } from "@/components/features/attendance/calendar/calendar-day-column"
import { CALENDAR_HOURS, type CalendarTab } from "@/config/rules/calendar.config"
import { cn } from "@/lib/utils"
import type {
  IAttendanceRecord,
  IHoliday,
  IScheduleDay,
  IWorkingShift,
} from "@/types/attendance.types"
import type { WeekDay } from "@/utils/attendance/get-week-dates"

import { Loader2 } from "lucide-react"

interface CalendarGridSegmentProps {
  weekDays: WeekDay[]
  todayDayOfWeek: number
  activeTab: CalendarTab
  showAllShifts: boolean
  scheduleDaysByDay: Map<number, IScheduleDay>
  recordsByDate: Map<string, IAttendanceRecord>
  holidaysByDate: Map<string, IHoliday>
  activeShifts: IWorkingShift[]
}

function CalendarGridSegment({
  weekDays,
  todayDayOfWeek,
  activeTab,
  showAllShifts,
  scheduleDaysByDay,
  recordsByDate,
  holidaysByDate,
  activeShifts,
}: CalendarGridSegmentProps) {
  const dayColumnCount = weekDays.length
  const gridTemplate = `7rem repeat(${dayColumnCount}, minmax(6.5rem, 1fr))`

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <div className="w-full min-w-0" style={{ minWidth: `${7 + dayColumnCount * 6.5}rem` }}>
        <div
          className="grid border-b border-border/60 bg-secondary/40 text-center text-xs font-bold text-muted-foreground"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="px-3 py-2 text-left">Giờ</div>
          {weekDays.map((day) => (
            <div
              key={day.shortDate}
              className={cn("px-3 py-2", day.dayOfWeek === todayDayOfWeek && "text-primary")}
            >
              <div className="uppercase opacity-75">{day.label}</div>
              <div className="mt-0.5">{day.shortDate}</div>
            </div>
          ))}
        </div>

        <div
          className="relative grid min-h-[33rem] bg-card"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="divide-y divide-border/40 border-r border-border/60">
            {CALENDAR_HOURS.map((hour) => (
              <div
                key={hour}
                className="flex h-12 items-start px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {weekDays.map((day) => (
            <CalendarDayColumn
              key={day.shortDate}
              day={day}
              todayDayOfWeek={todayDayOfWeek}
              activeTab={activeTab}
              showAllShifts={showAllShifts}
              scheduleDay={scheduleDaysByDay.get(day.dayOfWeek)}
              record={recordsByDate.get(day.dateKey)}
              holiday={holidaysByDate.get(day.dateKey)}
              activeShifts={activeShifts}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CalendarGridProps {
  weekDays: WeekDay[]
  todayDayOfWeek: number
  activeTab: CalendarTab
  showAllShifts: boolean
  isLoading: boolean
  isEmpty: boolean
  scheduleDaysByDay: Map<number, IScheduleDay>
  recordsByDate: Map<string, IAttendanceRecord>
  holidaysByDate: Map<string, IHoliday>
  activeShifts: IWorkingShift[]
}

export function CalendarGrid({
  weekDays,
  todayDayOfWeek,
  activeTab,
  showAllShifts,
  isLoading,
  isEmpty,
  scheduleDaysByDay,
  recordsByDate,
  holidaysByDate,
  activeShifts,
}: CalendarGridProps) {
  const segmentProps = {
    todayDayOfWeek,
    activeTab,
    showAllShifts,
    scheduleDaysByDay,
    recordsByDate,
    holidaysByDate,
    activeShifts,
  }
  const compactSegments = [weekDays.slice(0, 4), weekDays.slice(4)]

  return (
    <div className="relative space-y-3">
      {isLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-xs">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}

      {isEmpty && !isLoading ? (
        <EmptyState
          className="py-4"
          message={
            activeTab === "planned"
              ? "Bạn chưa được phân ca làm việc trong tuần này"
              : "Chưa có dữ liệu thời gian thực trong tuần này"
          }
        />
      ) : null}

      <div className={cn("hidden xl:block", isEmpty && !isLoading && "opacity-60")}>
        <CalendarGridSegment weekDays={weekDays} {...segmentProps} />
      </div>

      <div className={cn("space-y-4 xl:hidden", isEmpty && !isLoading && "opacity-60")}>
        {compactSegments.map((segmentDays, index) => (
          <CalendarGridSegment key={index} weekDays={segmentDays} {...segmentProps} />
        ))}
      </div>
    </div>
  )
}
