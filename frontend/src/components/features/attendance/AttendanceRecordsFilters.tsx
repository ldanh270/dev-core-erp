import { DateRangePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  type IAttendanceStatus,
} from "@/config/entities/attendance.config"

const ATTENDANCE_STATUS_LABEL_MAP = new Map<string, string>(
  Object.entries(ATTENDANCE_STATUS_LABELS),
)

interface AttendanceRecordsFiltersProps {
  startDate: string
  endDate: string
  statusFilter: IAttendanceStatus | "all"
  onDateChange: (range: { startDate: string | null; endDate: string | null }) => void
  onStatusFilterChange: (status: IAttendanceStatus | "all") => void
  onResetFilters: () => void
}

/**
 * Filter bar presenter providing date range picker and status dropdown controls.
 * Dispatches filter state changes upwards to dashboard orchestrator hooks.
 */
export function AttendanceRecordsFilters({
  startDate,
  endDate,
  statusFilter,
  onDateChange,
  onStatusFilterChange,
  onResetFilters,
}: AttendanceRecordsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border">
      <div>
        <p className="text-sm font-semibold text-foreground">Chi tiết bản ghi</p>
        <p className="text-xs text-muted-foreground">Bấm vào từng nhân sự để xem lịch sử.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onDateChange}
          size="sm"
        />

        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val as IAttendanceStatus | "all")}
        >
          <SelectTrigger className="h-9 w-36 rounded-full text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {ATTENDANCE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ATTENDANCE_STATUS_LABEL_MAP.get(status) ?? status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== "all" || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Đặt lại
          </Button>
        )}
      </div>
    </div>
  )
}
