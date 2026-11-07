import { cn } from "@/lib/utils"
/** Interactive admin workforce matrix for weekly and monthly attendance review. */
import { DatePicker, EmptyState, PageCard } from "@/components/common"
import { SearchInput } from "@/components/common/search-input"
import { AttendanceMatrixCell } from "@/components/features/attendance/attendance-matrix-cell"
import { Button } from "@/components/ui/button"
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
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react"

/** Admin workforce attendance matrix with synchronized week/month navigation. */
export function AttendanceMatrix() {
  const [view, setView] = useState<IAttendanceMatrixView>(ATTENDANCE_MATRIX_VIEW.WEEK)
  const [anchor, setAnchor] = useState(() => dayjs().format("YYYY-MM-DD"))
  const [search, setSearch] = useState("")
  const query = useMemo(
    () => ({ view, anchor, search: search.trim() || undefined }),
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
    <PageCard padding="none" className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-xs border border-border">
      {/* Synchronized Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between shrink-0 bg-card">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Tìm họ tên hoặc email..."
            value={search}
            onSearch={setSearch}
            onClear={() => {
              setSearch("")
            }}
            className="w-full sm:max-w-xs"
          />
          <div className="flex h-10 items-center rounded-full border border-border/80 p-1 bg-secondary/40">
            {ATTENDANCE_MATRIX_VIEW_VALUES.map((item) => (
              <Button
                key={item}
                size="sm"
                className="rounded-full text-xs font-semibold px-3.5 h-8"
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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            aria-label="Kỳ trước"
            onClick={() => {
              movePeriod(-1)
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="w-44">
            <DatePicker
              value={anchor}
              size="default"
              clearable={false}
              onChange={(val) => {
                if (val) handlePeriodChange(val)
              }}
            />
          </div>
          <div className="flex h-10 items-center justify-center min-w-44 px-4 rounded-full border border-border bg-muted/30 text-sm font-semibold text-foreground shadow-xs">
            {periodLabel}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            aria-label="Kỳ sau"
            onClick={() => {
              movePeriod(1)
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Matrix Table Viewport */}
      <div
        className="min-h-0 flex-1 overflow-auto overscroll-contain app-scrollbar"
        data-testid="attendance-matrix"
      >
        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin size-5 text-primary" /> Đang tải bảng công...
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-destructive">
            Không tải được bảng công.
          </div>
        ) : (
          <table className={cn(
            "w-full border-separate border-spacing-0 text-sm",
            view === ATTENDANCE_MATRIX_VIEW.WEEK ? "min-w-full" : "min-w-max",
            data?.employees.length === 0 && "min-h-full"
          )}>
            <thead className="sticky top-0 z-20 bg-card">
              <tr>
                <th className="sticky left-0 z-30 w-28 min-w-28 border-b border-border bg-card p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mã nhân sự
                </th>
                <th className="sticky left-28 z-30 w-48 min-w-48 border-b border-border bg-card p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Họ và tên
                </th>
                <th className="sticky left-[19rem] z-30 w-40 min-w-40 border-b border-r border-border shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.5)] bg-card p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vị trí
                </th>
                {dates.map((date) => (
                  <th
                    key={date}
                    className={cn(
                      "border-b border-border bg-muted/30 p-3 text-center",
                      view === ATTENDANCE_MATRIX_VIEW.WEEK ? "w-[14.28%] min-w-36" : "min-w-40"
                    )}
                  >
                    <span className="block text-xs font-semibold uppercase text-muted-foreground">
                      {ATTENDANCE_MATRIX_UI.WEEKDAY_LABELS[dayjs(date).day()]}
                    </span>
                    <span className="font-semibold text-foreground">
                      {dayjs(date).format(view === ATTENDANCE_MATRIX_VIEW.MONTH ? "DD" : "DD/MM")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.employees.length === 0 ? (
                <tr className="h-full">
                  <td colSpan={3 + dates.length} className="h-full p-4">
                    <div className="flex h-full min-h-[320px] items-center justify-center">
                      <EmptyState
                        icon={Inbox}
                        title={search ? "Không tìm thấy nhân viên" : "Không có dữ liệu"}
                        description={
                          search
                            ? `Không có nhân viên nào khớp với từ khóa "${search}".`
                            : "Chưa có bản ghi chấm công nào trong kỳ này."
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                data?.employees.map((employee) => (
                  <tr key={employee.employeeId} className="group hover:bg-muted/50">
                    <td className="sticky left-0 z-10 w-28 max-w-28 border-b border-border bg-card p-3 font-mono text-xs text-primary group-hover:bg-muted">
                      <span className="block truncate" title={employee.employeeCode}>
                        {employee.employeeCode}
                      </span>
                    </td>
                    <td className="sticky left-28 z-10 w-48 max-w-48 border-b border-border bg-card p-3 text-left group-hover:bg-muted">
                      <p className="truncate font-medium text-foreground" title={employee.fullName}>
                        {employee.fullName}
                      </p>
                      <p
                        className="truncate text-xs font-normal text-muted-foreground"
                        title={employee.email}
                      >
                        {employee.email}
                      </p>
                    </td>
                    <td className="sticky left-[19rem] z-10 w-40 max-w-40 border-b border-r border-border shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.5)] bg-card p-3 text-muted-foreground group-hover:bg-muted">
                      <span className="block truncate" title={employee.position}>
                        {employee.position ?? "—"}
                      </span>
                    </td>
                    {dates.map((date) => (
                      <td
                        key={date}
                        className={cn(
                          "border-b border-border p-2 align-top group-hover:bg-muted/50",
                          view === ATTENDANCE_MATRIX_VIEW.WEEK && "w-[14.28%]"
                        )}
                      >
                        <AttendanceMatrixCell
                          collapseMultiple={view === ATTENDANCE_MATRIX_VIEW.MONTH}
                          shifts={employee.days.find((day) => day.date === date)?.shifts ?? []}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </PageCard>
  )
}
