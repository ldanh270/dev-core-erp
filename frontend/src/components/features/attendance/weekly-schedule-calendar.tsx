import { PageCard, SectionHeader } from "@/components/common"
import { CalendarGrid } from "@/components/features/attendance/calendar/calendar-grid"
import { CalendarLegend } from "@/components/features/attendance/calendar/calendar-legend"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ATTENDANCE_QUERY_KEYS } from "@/config/entities/attendance.config"
import { CALENDAR_WEEK_DAY_COUNT, type CalendarTab } from "@/config/rules/calendar.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { useProfile } from "@/hooks/use-profile"
import { holidaysApi, schedulesApi, shiftsApi } from "@/lib/api/attendance.api"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getDayLabel } from "@/utils/attendance/get-day-label"
import { getRecordDateKey } from "@/utils/attendance/get-record-date-key"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { mapPlannedWeekToScheduleDays } from "@/utils/attendance/map-planned-week-to-schedule-days.util"
import {
  doesHolidayApplyToEmployee,
  groupHolidaysByDate,
} from "@/utils/attendance/pick-holiday-for-employee.util"
import { resolveScheduleDay } from "@/utils/attendance/resolve-schedule-day"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"

interface WeeklyScheduleCalendarProps {
  className?: string
  showAllShifts?: boolean
  showTabs?: boolean
  title?: string
  view?: CalendarTab
}

/** Displays the authenticated employee's resolved week, including overrides and holidays. */
export function WeeklyScheduleCalendar({
  className,
  showAllShifts = false,
  showTabs = false,
  title = "Lịch làm việc",
  view = "planned",
}: WeeklyScheduleCalendarProps) {
  const [selectedTab, setSelectedTab] = useState<CalendarTab>(view)
  const activeTab = showTabs ? selectedTab : view
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekDays = getWeekDates(weekStart, getDayLabel)
  const todayDayOfWeek = new Date().getDay()
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDays[CALENDAR_WEEK_DAY_COUNT - 1].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDays)
  const { data: profile } = useProfile()

  const { data: plannedWeek, isLoading: isPlannedWeekLoading } = useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.MY_PLANNED_WEEK(weekStartIso),
    queryFn: () => schedulesApi.getMyPlannedWeek(weekStartIso),
  })

  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.MY_SCHEDULE(weekStartIso),
    queryFn: () => schedulesApi.getMy(weekStartIso),
  })

  const { data: shifts, isLoading: isShiftsLoading } = useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.SHIFTS,
    queryFn: shiftsApi.getAll,
    enabled: showAllShifts,
  })

  const { data: records, isLoading: isRecordsLoading } = useAttendanceRecords({
    startDate: weekStartIso,
    endDate: weekEndIso,
    personalOnly: true,
  })

  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.HOLIDAYS_RANGE(weekStartIso, weekEndIso),
    queryFn: () => holidaysApi.getAll({ startDate: weekStartIso, endDate: weekEndIso }),
  })

  const scheduleDaysByDay = mapPlannedWeekToScheduleDays(plannedWeek)
  // Older API responses may omit plannedWeek, so retain the weekly-template fallback.
  if (scheduleDaysByDay.size === 0) {
    for (const day of weekDays) {
      const scheduleDay = resolveScheduleDay(schedule, day.date)
      if (scheduleDay) {
        scheduleDaysByDay.set(day.dayOfWeek, scheduleDay)
      }
    }
  }
  const activeShifts =
    shifts?.filter((shift) => shift.isActive).toSorted((a, b) => a.startTime - b.startTime) ?? []
  const user = useAuthStore((state) => state.user)
  const recordsByDate = new Map(records?.map((record) => [getRecordDateKey(record), record]) ?? [])
  const holidayGroups = groupHolidaysByDate(holidays ?? [])
  const holidaysByDate = new Map(
    [...holidayGroups.entries()].flatMap(([dateKey, list]) => {
      const applicable = list.filter((h) =>
        doesHolidayApplyToEmployee(h, {
          id: user?.id ?? "",
          // Position scope is resolved from the authenticated employee profile.
          positionId: profile?.positionId,
        }),
      )
      return applicable[0] ? [[dateKey, applicable[0]] as const] : []
    }),
  )
  const isCalendarLoading =
    isPlannedWeekLoading ||
    isScheduleLoading ||
    isRecordsLoading ||
    isHolidaysLoading ||
    (showAllShifts && isShiftsLoading)
  const hasPlannedSchedule = showAllShifts ? activeShifts.length > 0 : scheduleDaysByDay.size > 0
  const hasActualRecords = Boolean(records?.length)
  const hasHoliday = holidaysByDate.size > 0
  const isCalendarEmpty =
    activeTab === "planned"
      ? !hasPlannedSchedule && !hasHoliday
      : !hasPlannedSchedule && !hasActualRecords && !hasHoliday

  return (
    <PageCard className={cn("space-y-4", className)}>
      <SectionHeader
        title={title}
        action={
          <WeekPickerActions
            weekStartIso={weekStartIso}
            weekRangeLabel={weekRangeLabel}
            onWeekStartChange={setWeekStart}
          />
        }
      />

      {showTabs ? (
        <Tabs
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value as CalendarTab)
          }}
        >
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="planned">Ca kế hoạch</TabsTrigger>
            <TabsTrigger value="actual">Thời gian thực</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <CalendarLegend activeTab={activeTab} showAllShifts={showAllShifts} />

      <CalendarGrid
        weekDays={weekDays}
        todayDayOfWeek={todayDayOfWeek}
        activeTab={activeTab}
        showAllShifts={showAllShifts}
        isLoading={isCalendarLoading}
        isEmpty={isCalendarEmpty}
        scheduleDaysByDay={scheduleDaysByDay}
        recordsByDate={recordsByDate}
        holidaysByDate={holidaysByDate}
        activeShifts={activeShifts}
      />
    </PageCard>
  )
}
