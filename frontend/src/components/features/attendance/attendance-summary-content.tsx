import { PageCard } from "@/components/common"
import { AttendanceMonthPicker } from "@/components/features/attendance/attendance-month-picker"
import { AttendanceSummaryStatCard } from "@/components/features/attendance/attendance-summary-stat-card"
import { ATTENDANCE_QUERY_KEYS } from "@/config/entities/attendance.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { useEmployee } from "@/hooks/employees/queries/useEmployeeQuery"
import { useProfile } from "@/hooks/use-profile"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { useAuthStore } from "@/store/auth-store"
import { countScheduledShiftsInMonth } from "@/utils/attendance/count-scheduled-shifts-in-month"
import { formatHours } from "@/utils/attendance/format-hours"
import { getMonthRange } from "@/utils/attendance/get-month-range"
import {
  doesHolidayApplyToEmployee,
  groupHolidaysByDate,
} from "@/utils/attendance/pick-holiday-for-employee.util"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import {
  AlarmClock,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarX2,
  Clock,
  Loader2,
  TimerReset,
} from "lucide-react"

interface AttendanceSummaryContentProps {
  employeeId?: string
  year?: number
  month?: number
}

export function AttendanceSummaryContent({
  employeeId,
  year: propYear,
  month: propMonth,
}: AttendanceSummaryContentProps) {
  const now = new Date()
  const [internalYear, setInternalYear] = useState(now.getFullYear())
  const [internalMonth, setInternalMonth] = useState(now.getMonth())

  const year = propYear ?? internalYear
  const month = propMonth ?? internalMonth
  const isExternalControl = propYear !== undefined && propMonth !== undefined

  const { startDate, endDate } = getMonthRange(year, month)
  const { data: profile } = useProfile()
  const { data: selectedEmployee } = useEmployee(employeeId ?? "")

  const { data: records, isLoading: isRecordsLoading } = useAttendanceRecords({
    startDate,
    endDate,
    ...(employeeId ? { employeeId } : { personalOnly: true }),
  })
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: employeeId
      ? ATTENDANCE_QUERY_KEYS.EMPLOYEE_SCHEDULE(employeeId, startDate)
      : ATTENDANCE_QUERY_KEYS.MY_SCHEDULE(startDate),
    queryFn: () =>
      employeeId
        ? schedulesApi.getByEmployee(employeeId, startDate)
        : schedulesApi.getMy(startDate),
    enabled: employeeId ? Boolean(employeeId) : true,
  })
  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ATTENDANCE_QUERY_KEYS.HOLIDAYS_RANGE(startDate, endDate),
    queryFn: () => holidaysApi.getAll({ startDate, endDate }),
  })

  const totalWorkMinutes = records?.reduce((sum, record) => sum + record.totalWorkMinutes, 0) ?? 0
  const lateCount = records?.filter((record) => record.status === "late").length ?? 0
  const absentCount = records?.filter((record) => record.status === "absent").length ?? 0
  const onTimeCount = records?.filter((record) => record.status === "on_time").length ?? 0
  const overtimeCount = records?.filter((record) => record.overtimeMinutes > 0).length ?? 0
  const earlyLeaveCount = records?.filter((record) => record.earlyLeaveMinutes > 0).length ?? 0
  const workedShiftCount =
    records?.filter((record) => record.checkInAt && record.checkOutAt).length ?? 0
  const user = useAuthStore((state) => state.user)
  const targetEmployeeId = employeeId ?? user?.id ?? ""
  const holidaysByDate = new Map(
    [...groupHolidaysByDate(holidays ?? []).entries()].flatMap(([dateKey, list]) => {
      const applicable = list.filter((h) =>
        doesHolidayApplyToEmployee(h, {
          id: targetEmployeeId,
          // Scoped holidays must use the viewed employee's position, not only their ID.
          positionId: employeeId ? selectedEmployee?.positionId : profile?.positionId,
        }),
      )
      return applicable[0] ? [[dateKey, applicable[0]] as const] : []
    }),
  )
  const scheduledShiftCount = countScheduledShiftsInMonth(schedule, year, month, holidaysByDate)
  const completionRate =
    scheduledShiftCount > 0 ? Math.round((workedShiftCount / scheduledShiftCount) * 100) : 0
  const averageWorkMinutes =
    workedShiftCount > 0 ? Math.round(totalWorkMinutes / workedShiftCount) : 0
  const isLoading = isRecordsLoading || isScheduleLoading || isHolidaysLoading

  const goToPrev = () => {
    if (internalMonth === 0) {
      setInternalYear((currentYear) => currentYear - 1)
      setInternalMonth(11)
      return
    }
    setInternalMonth((currentMonth) => currentMonth - 1)
  }

  const goToNext = () => {
    if (internalMonth === 11) {
      setInternalYear((currentYear) => currentYear + 1)
      setInternalMonth(0)
      return
    }
    setInternalMonth((currentMonth) => currentMonth + 1)
  }

  return (
    <div className="space-y-4">
      {!isExternalControl && (
        <div className="flex items-center justify-end">
          <AttendanceMonthPicker
            year={internalYear}
            month={internalMonth}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </div>
      )}

      {isLoading ? (
        <PageCard className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </PageCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AttendanceSummaryStatCard
            title="Tổng giờ làm"
            value={formatHours(totalWorkMinutes)}
            description="Tổng thời gian đã ghi nhận"
            icon={Clock}
          />
          <AttendanceSummaryStatCard
            title="Số ca được phân"
            value={scheduledShiftCount}
            description="Không tính ngày nghỉ lễ"
            icon={BriefcaseBusiness}
          />
          <AttendanceSummaryStatCard
            title="Số ca đã làm"
            value={workedShiftCount}
            description={`${completionRate}% so với ca được phân`}
            icon={CalendarCheck}
          />
          <AttendanceSummaryStatCard
            title="Trung bình mỗi ca"
            value={formatHours(averageWorkMinutes)}
            description="Tính trên ca có check-in/out"
            icon={TimerReset}
          />
          <AttendanceSummaryStatCard
            title="Đúng giờ"
            value={onTimeCount}
            description="Số lần chấm công đúng giờ"
            icon={CalendarCheck}
          />
          <AttendanceSummaryStatCard
            title="Đi muộn"
            value={lateCount}
            description="Số lần bị ghi nhận đi muộn"
            icon={AlarmClock}
          />
          <AttendanceSummaryStatCard
            title="Vắng mặt"
            value={absentCount}
            description="Số ngày không có mặt"
            icon={CalendarX2}
          />
          <AttendanceSummaryStatCard
            title="OT / Về sớm"
            value={`${overtimeCount} / ${earlyLeaveCount}`}
            description="Lượt tăng ca và về sớm"
            icon={TimerReset}
          />
        </div>
      )}
    </div>
  )
}
