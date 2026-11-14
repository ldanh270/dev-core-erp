/** Displays company schedules for a selected week and employee search scope using DataTablePage. */
import { type DataTableColumn, DataTablePage, DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { CALENDAR_WEEK_DAY_COUNT } from "@/config/rules/calendar.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { holidaysApi, schedulesApi } from "@/lib/api/attendance.api"
import { minutesToTime } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"
import { addDays } from "@/utils/attendance/add-days"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import {
  groupHolidaysByDate,
  pickHolidayForEmployee,
} from "@/utils/attendance/pick-holiday-for-employee.util"

import { useCallback, useMemo, useState } from "react"

import { useQueries, useQuery } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

export function CompanyWorkSchedulesView() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const weekStart = getWeekStart(selectedDate)
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekStartIso = formatDateParam(weekStart)
  const weekEndIso = weekDates[CALENDAR_WEEK_DAY_COUNT - 1].dateKey
  const weekRangeLabel = getWeekRangeLabel(weekDates)

  const handleSearch = useCallback((val: string) => {
    setEmployeeSearch(val)
    setCurrentPage(1)
  }, [])

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page: currentPage,
    limit: pageSize,
    search: employeeSearch.trim() || undefined,
  })
  const employees = useMemo(() => employeeData?.data ?? [], [employeeData])

  const scheduleQueries = useQueries({
    queries: employees.map((employee) => ({
      queryKey: ["employee-planned-week", employee.id, weekStartIso],
      queryFn: () => schedulesApi.getEmployeePlannedWeek(employee.id, weekStartIso),
      enabled: employees.length > 0,
    })),
  })

  const { data: holidays, isLoading: isHolidaysLoading } = useQuery({
    queryKey: ["holidays", weekStartIso, weekEndIso],
    queryFn: () => holidaysApi.getAll({ startDate: weekStartIso, endDate: weekEndIso }),
  })

  const isSchedulesLoading = scheduleQueries.some((query) => query.isLoading)
  const isOverallLoading = isEmployeesLoading || isSchedulesLoading || isHolidaysLoading

  const holidaysByDate = useMemo(() => groupHolidaysByDate(holidays ?? []), [holidays])

  const schedulesMap = useMemo(() => {
    const map = new Map<string, unknown[]>()
    employees.forEach((employee, index) => {
      const scheduleData = scheduleQueries.at(index)?.data
      if (scheduleData && Array.isArray(scheduleData)) {
        map.set(employee.id, scheduleData)
      }
    })
    return map
  }, [employees, scheduleQueries])

  const handleDateChange = (dateString: string) => {
    setSelectedDate(new Date(dateString))
  }

  const columns: DataTableColumn<Employee>[] = useMemo(() => {
    const employeeColumn: DataTableColumn<Employee> = {
      id: "employee",
      header: "Nhân viên",
      width: getTableColWidthPx("EMPLOYEE"),
      minWidth: "220px",
      sticky: true,
      cell: (employee) => (
        <div className="flex flex-col min-w-0 pr-2">
          <span className={TYPOGRAPHY.CELL_PRIMARY} title={employee.fullName}>
            {employee.fullName}
          </span>
          <span className={TYPOGRAPHY.CELL_SECONDARY} title={employee.email}>
            {employee.email}
          </span>
        </div>
      ),
    }

    const dayColumns: DataTableColumn<Employee>[] = weekDates.map((weekDay) => ({
      id: weekDay.dateKey,
      header: (
        <div className="flex flex-col items-center justify-center text-center">
          <span className={TYPOGRAPHY.TABLE_HEADER}>{weekDay.label}</span>
          <span className="text-[11px] font-semibold text-primary">{weekDay.shortDate}</span>
        </div>
      ),
      width: getTableColWidthPx("TYPE"),
      minWidth: "140px",
      align: "center",
      cell: (employee) => {
        const employeeScheduleList = (schedulesMap.get(employee.id) ?? []) as Array<{
          date: string
          shift?: { name: string; startTime: number; endTime: number } | null
        }>
        const daySchedule = employeeScheduleList.find((s) => s.date === weekDay.dateKey)
        const dateHolidays = holidaysByDate.get(weekDay.dateKey)
        const employeeHoliday = pickHolidayForEmployee(dateHolidays, employee)

        if (employeeHoliday) {
          return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-center">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 truncate max-w-full">
                {employeeHoliday.name}
              </span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Nghỉ lễ</span>
            </div>
          )
        }

        if (daySchedule?.shift) {
          return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-2 py-1.5 text-center">
              <span className="text-xs font-semibold text-primary truncate max-w-full">
                {daySchedule.shift.name} ({minutesToTime(daySchedule.shift.startTime)} -{" "}
                {minutesToTime(daySchedule.shift.endTime)})
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {minutesToTime(daySchedule.shift.startTime)} -{" "}
                {minutesToTime(daySchedule.shift.endTime)}
              </span>
            </div>
          )
        }

        return <span className="text-sm text-muted-foreground/40 font-mono">—</span>
      },
    }))

    return [employeeColumn, ...dayColumns]
  }, [weekDates, schedulesMap, holidaysByDate])

  return (
    <DataTablePage<Employee>
      title="Lịch làm việc"
      description="Xem lịch làm việc theo tuần của toàn bộ nhân viên."
      variant="viewport"
      search={{
        placeholder: "Tìm tên, email hoặc mã nhân viên...",
        value: employeeSearch,
        onSearch: handleSearch,
        onClear: () => {
          handleSearch("")
        },
      }}
      toolbarActions={
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-muted/30 px-3.5 text-sm font-semibold text-foreground shadow-xs">
            <CalendarDays className="size-4 text-primary shrink-0" />
            <span>{weekRangeLabel}</span>
          </div>
          <div className="w-44">
            <DatePicker
              value={formatDateParam(selectedDate)}
              size="default"
              clearable={false}
              onChange={(val) => {
                if (val) handleDateChange(val)
              }}
            />
          </div>
          <Button
            aria-label="Tuần trước"
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            onClick={() => {
              setSelectedDate((currentDate) => addDays(currentDate, -1 * CALENDAR_WEEK_DAY_COUNT))
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            aria-label="Tuần sau"
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            onClick={() => {
              setSelectedDate((currentDate) => addDays(currentDate, 1 * CALENDAR_WEEK_DAY_COUNT))
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      }
      columns={columns}
      data={employees}
      keyExtractor={(employee) => employee.id}
      isLoading={isOverallLoading}
      emptyState={{
        title: employeeSearch ? "Không tìm thấy nhân viên" : "Không có dữ liệu",
        description: employeeSearch
          ? `Không có nhân viên nào khớp với từ khóa "${employeeSearch}".`
          : "Chưa có nhân viên nào trong danh sách lịch làm việc.",
      }}
      pagination={{
        currentPage,
        totalPages: employeeData?.meta.totalPages ?? 1,
        totalItems: employeeData?.meta.total ?? 0,
        itemsPerPage: pageSize,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: (limit) => {
          setPageSize(limit)
          setCurrentPage(1)
        },
      }}
    />
  )
}
