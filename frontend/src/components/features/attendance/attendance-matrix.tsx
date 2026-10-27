/** Interactive admin workforce matrix for weekly and monthly attendance review. */
import { DatePicker, PageCard } from "@/components/common"
import { AttendanceMatrixCell } from "@/components/features/attendance/attendance-matrix-cell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ATTENDANCE_MATRIX_VIEW,
  ATTENDANCE_MATRIX_VIEW_VALUES,
  type IAttendanceMatrixView,
} from "@/config/entities/attendance.config"
import { ATTENDANCE_MATRIX_UI } from "@/config/rules/attendance.config"
import { useAttendanceMatrix } from "@/hooks/attendance/use-attendance"
import { getMatrixDates } from "@/utils/attendance/attendance-matrix.util"

import { useMemo, useState } from "react"

import dayjs from "dayjs"
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react"

/** Admin workforce attendance matrix with synchronized week/month navigation. */
export function AttendanceMatrix() {
  const [view, setView] = useState<IAttendanceMatrixView>(ATTENDANCE_MATRIX_VIEW.WEEK)
  const [anchor, setAnchor] = useState(() => dayjs().format("YYYY-MM-DD"))
  const [search, setSearch] = useState("")
  const query = useMemo(
    () => ({ view, anchor, search: search || undefined }),
    [view, anchor, search],
  )
  const { data, isLoading, isError } = useAttendanceMatrix(query)
  const dates = data ? getMatrixDates(data.rangeStart, data.rangeEnd) : []
  const periodLabel = data
    ? view === ATTENDANCE_MATRIX_VIEW.MONTH
      ? `Tháng ${dayjs(data.rangeStart).format("MM/YYYY")}`
      : `${dayjs(data.rangeStart).format("DD/MM/YYYY")} – ${dayjs(data.rangeEnd).format("DD/MM/YYYY")}`
    : "Đang tải"

  const movePeriod = (direction: number) => {
    const unit =
      view === ATTENDANCE_MATRIX_VIEW.MONTH
        ? ATTENDANCE_MATRIX_VIEW.MONTH
        : ATTENDANCE_MATRIX_VIEW.WEEK
    setAnchor(dayjs(anchor).add(direction, unit).format("YYYY-MM-DD"))
  }

  const handlePeriodChange = (value: string) => {
    if (!value) return
    setAnchor(view === ATTENDANCE_MATRIX_VIEW.MONTH ? `${value}-01` : value)
  }


  return (
    <PageCard className="flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold">Bảng chấm công</h2>
          <p className="text-sm text-muted-foreground">Check-in, checkout và độ lệch theo ca.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Tìm nhân viên"
              className="pl-10"
              placeholder="Tìm họ tên hoặc email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Kỳ trước"
            onClick={() => {
              movePeriod(-1)
            }}
          >
            <ChevronLeft />
          </Button>
          <div className="w-40">
            <DatePicker
              value={anchor}
              size="sm"
              clearable={false}
              onChange={(val) => {
                if (val) handlePeriodChange(val)
              }}
            />
          </div>
          <span className="min-w-44 text-center text-sm font-medium">{periodLabel}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Kỳ sau"
            onClick={() => {
              movePeriod(1)
            }}
          >
            <ChevronRight />
          </Button>
          <div className="flex rounded-full border p-1">
            {ATTENDANCE_MATRIX_VIEW_VALUES.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={view === item ? "default" : "ghost"}
                onClick={() => {
                  setView(item)
                }}
              >
                {item === ATTENDANCE_MATRIX_VIEW.WEEK ? "Theo tuần" : "Theo tháng"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg"
        data-testid="attendance-matrix"
      >
        {isLoading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" /> Đang tải bảng công
          </div>
        ) : isError ? (
          <div className="flex h-48 items-center justify-center text-destructive">
            Không tải được bảng công.
          </div>
        ) : (
          <table className="min-w-max border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20 bg-background">
              <tr>
                <th className="sticky left-0 z-30 w-28 min-w-28 border-b bg-background p-3 text-left">
                  Mã nhân sự
                </th>
                <th className="sticky left-28 z-30 w-48 min-w-48 border-b bg-background p-3 text-left">
                  Họ và tên
                </th>
                <th className="sticky left-[19rem] z-30 w-40 min-w-40 border-b bg-background p-3 text-left">
                  Vị trí
                </th>
                {dates.map((date) => (
                  <th key={date} className="min-w-40 border-b bg-muted/40 p-3 text-center">
                    <span className="block text-xs text-muted-foreground">
                      {ATTENDANCE_MATRIX_UI.WEEKDAY_LABELS[dayjs(date).day()]}
                    </span>
                    <span>
                      {dayjs(date).format(view === ATTENDANCE_MATRIX_VIEW.MONTH ? "DD" : "DD/MM")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.employees.map((employee) => (
                <tr key={employee.employeeId} className="hover:bg-muted/20">
                  <td className="sticky left-0 z-10 w-28 max-w-28 border-b bg-background p-3 font-mono text-xs text-primary">
                    <span className="block truncate" title={employee.employeeCode}>
                      {employee.employeeCode}
                    </span>
                  </td>
                  <th className="sticky left-28 z-10 w-48 max-w-48 border-b bg-background p-3 text-left">
                    <p className="truncate font-medium" title={employee.fullName}>
                      {employee.fullName}
                    </p>
                    <p
                      className="truncate text-xs font-normal text-muted-foreground"
                      title={employee.email}
                    >
                      {employee.email}
                    </p>
                  </th>
                  <td className="sticky left-[19rem] z-10 w-40 max-w-40 border-b bg-background p-3 text-muted-foreground">
                    <span className="block truncate" title={employee.position}>
                      {employee.position ?? "—"}
                    </span>
                  </td>
                  {dates.map((date) => (
                    <td key={date} className="border-b p-2 align-top">
                      <AttendanceMatrixCell
                        collapseMultiple={view === ATTENDANCE_MATRIX_VIEW.MONTH}
                        shifts={employee.days.find((day) => day.date === date)?.shifts ?? []}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageCard>
  )
}
