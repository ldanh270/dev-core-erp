import { DatePicker, DataTablePage, type DataTableColumn } from "@/components/common"
import { AttendanceMatrixCell } from "@/components/features/attendance/attendance-matrix-cell"
import { Button } from "@/components/ui/button"
import {
  ATTENDANCE_MATRIX_VIEW,
  ATTENDANCE_MATRIX_VIEW_VALUES,
  type IAttendanceMatrixView,
} from "@/config/entities/attendance.config"
import { ATTENDANCE_MATRIX_UI } from "@/config/rules/attendance.config"
import { useAttendanceMatrix } from "@/hooks/attendance/use-attendance"
import type { IAttendanceMatrixEmployee } from "@/types/attendance.types"
import { getMatrixDates } from "@/utils/attendance/attendance-matrix.util"

import { useMemo, useState } from "react"

import dayjs from "dayjs"
import { ChevronLeft, ChevronRight } from "lucide-react"

/** Admin workforce attendance matrix powered by enterprise master primitive DataTablePage. */
export function AttendanceMatrix() {
  const [view, setView] = useState<IAttendanceMatrixView>(ATTENDANCE_MATRIX_VIEW.WEEK)
  const [anchor, setAnchor] = useState(() => dayjs().format("YYYY-MM-DD"))
  const [search, setSearch] = useState("")

  const query = useMemo(
    () => ({ view, anchor, search: search.trim() || undefined }),
    [view, anchor, search],
  )
  const { data, isLoading } = useAttendanceMatrix(query)
  const dates = useMemo(() => (data ? getMatrixDates(data.rangeStart, data.rangeEnd) : []), [data])

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

  const columns = useMemo<DataTableColumn<IAttendanceMatrixEmployee>[]>(() => {
    const fixedCols: DataTableColumn<IAttendanceMatrixEmployee>[] = [
      {
        id: "employeeCode",
        header: "Mã nhân sự",
        width: "112px",
        sticky: true,
        cell: (emp) => (
          <span className="font-mono text-xs text-primary truncate block" title={emp.employeeCode}>
            {emp.employeeCode}
          </span>
        ),
      },
      {
        id: "fullName",
        header: "Họ và tên",
        width: "192px",
        sticky: true,
        cell: (emp) => (
          <div>
            <p className="truncate font-medium text-foreground" title={emp.fullName}>
              {emp.fullName}
            </p>
            <p className="truncate text-xs font-normal text-muted-foreground" title={emp.email}>
              {emp.email}
            </p>
          </div>
        ),
      },
      {
        id: "position",
        header: "Vị trí",
        width: "160px",
        sticky: true,
        cell: (emp) => (
          <span className="truncate block text-muted-foreground" title={emp.position}>
            {emp.position ?? "—"}
          </span>
        ),
      },
    ]

    const dateCols: DataTableColumn<IAttendanceMatrixEmployee>[] = dates.map((date) => ({
      id: date,
      header: (
        <div className="text-center">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">
            {ATTENDANCE_MATRIX_UI.WEEKDAY_LABELS[dayjs(date).day()]}
          </span>
          <span className="font-semibold text-foreground">
            {dayjs(date).format(view === ATTENDANCE_MATRIX_VIEW.MONTH ? "DD" : "DD/MM")}
          </span>
        </div>
      ),
      width: view === ATTENDANCE_MATRIX_VIEW.WEEK ? "144px" : "160px",
      align: "center",
      className: "align-top p-2",
      cell: (emp) => (
        <AttendanceMatrixCell
          collapseMultiple={view === ATTENDANCE_MATRIX_VIEW.MONTH}
          shifts={emp.days.find((day) => day.date === date)?.shifts ?? []}
        />
      ),
    }))

    return [...fixedCols, ...dateCols]
  }, [dates, view])

  return (
    <DataTablePage<IAttendanceMatrixEmployee>
      title="Bảng chấm công"
      description="Check-in, checkout và độ lệch theo ca."
      variant="viewport"
      search={{
        placeholder: "Tìm họ tên hoặc email...",
        value: search,
        onSearch: setSearch,
        onClear: () => {
          setSearch("")
        },
      }}
      filters={
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
      }
      toolbarActions={
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
      }
      columns={columns}
      data={data?.employees ?? []}
      keyExtractor={(emp) => emp.employeeId}
      isLoading={isLoading}
      emptyState={{
        title: search ? "Không tìm thấy nhân viên" : "Không có dữ liệu",
        description: search
          ? `Không có nhân viên nào khớp với từ khóa "${search}".`
          : "Chưa có bản ghi chấm công nào trong kỳ này.",
      }}
    />
  )
}
