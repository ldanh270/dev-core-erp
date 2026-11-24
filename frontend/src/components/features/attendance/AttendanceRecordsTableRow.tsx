import { FileCheck2 } from "lucide-react"
import { StatusPill } from "@/components/common/status-pill"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
} from "@/config/entities/attendance.config"
import { toSelectedEmployee, type SelectedEmployeeSummary } from "@/hooks/attendance/use-admin-attendance-dashboard"
import { formatDate, formatTime } from "@/lib/utils"
import type { IAttendanceRecord } from "@/types/attendance.types"

const ATTENDANCE_STATUS_LABEL_MAP = new Map<string, string>(
  Object.entries(ATTENDANCE_STATUS_LABELS),
)
const ATTENDANCE_STATUS_VARIANT_MAP = new Map<string, "success" | "warning" | "danger" | "neutral">(
  Object.entries(ATTENDANCE_STATUS_VARIANTS) as [string, "success" | "warning" | "danger" | "neutral"][],
)

interface AttendanceRecordsTableRowProps {
  record: IAttendanceRecord
  isSelected: boolean
  onSelectEmployee: (emp: SelectedEmployeeSummary) => void
}

/**
 * Presenter table row formatting single employee attendance event attributes.
 * Displays check-in/out timestamps, calculated work hours, violation pills, and correction indicators.
 */
export function AttendanceRecordsTableRow({
  record,
  isSelected,
  onSelectEmployee,
}: AttendanceRecordsTableRowProps) {
  const workHours = Math.floor(record.totalWorkMinutes / 60)
  const workMins = record.totalWorkMinutes % 60

  return (
    <TableRow
      className={`cursor-pointer hover:bg-muted/30 ${
        isSelected ? "bg-primary/5" : ""
      }`}
      onClick={() => {
        onSelectEmployee(toSelectedEmployee(record))
      }}
    >
      <TableCell className="px-4 py-4">
        <p className="font-medium whitespace-nowrap">
          {record.employee?.fullName ?? record.employeeId}
        </p>
        {record.employee?.email && (
          <p className="text-xs text-muted-foreground">{record.employee.email}</p>
        )}
      </TableCell>
      <TableCell className="px-4 py-4 text-muted-foreground whitespace-nowrap">
        {formatDate(record.date)}
      </TableCell>
      <TableCell className="px-4 py-4 font-mono text-sm">
        {formatTime(record.checkInAt)}
      </TableCell>
      <TableCell className="px-4 py-4 font-mono text-sm">
        {formatTime(record.checkOutAt)}
      </TableCell>
      <TableCell className="px-4 py-4 text-muted-foreground whitespace-nowrap">
        {record.totalWorkMinutes > 0
          ? `${workHours}h${workMins > 0 ? ` ${workMins}m` : ""}`
          : "—"}
      </TableCell>
      <TableCell className="px-4 py-4">
        <StatusPill
          label={ATTENDANCE_STATUS_LABEL_MAP.get(record.status) ?? record.status}
          variant={ATTENDANCE_STATUS_VARIANT_MAP.get(record.status) ?? "neutral"}
        />
      </TableCell>
      <TableCell className="px-4 py-4 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
        {record.lateMinutes > 0 && (
          <span className="text-warning">+{record.lateMinutes}m muộn </span>
        )}
        {record.earlyLeaveMinutes > 0 && (
          <span className="text-warning">-{record.earlyLeaveMinutes}m sớm </span>
        )}
        {record.overtimeMinutes > 0 && (
          <span className="text-info-foreground">+{record.overtimeMinutes}m OT</span>
        )}
        {!record.lateMinutes &&
          !record.earlyLeaveMinutes &&
          !record.overtimeMinutes &&
          "—"}
      </TableCell>
      <TableCell className="px-4 py-4">
        {record.correctedByApplication ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <FileCheck2 size={11} />
            Đã sửa qua đơn
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}
