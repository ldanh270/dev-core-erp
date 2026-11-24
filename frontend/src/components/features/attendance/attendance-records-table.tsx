import { Loader2 } from "lucide-react"
import { PageCard } from "@/components/common"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { IAttendanceStatus } from "@/config/entities/attendance.config"
import type { SelectedEmployeeSummary } from "@/hooks/attendance/use-admin-attendance-dashboard"
import type { IAttendanceRecord } from "@/types/attendance.types"
import { AttendanceRecordsFilters } from "./AttendanceRecordsFilters"
import { AttendanceRecordsTableRow } from "./AttendanceRecordsTableRow"

export { AttendanceAttentionCards } from "./AttendanceAttentionCards"
export type { AttendanceAttentionCardsProps } from "./AttendanceAttentionCards"

interface AttendanceRecordsTableProps {
  records?: IAttendanceRecord[]
  isLoading: boolean
  isError: boolean
  startDate: string
  endDate: string
  statusFilter: IAttendanceStatus | "all"
  onDateChange: (range: { startDate: string | null; endDate: string | null }) => void
  onStatusFilterChange: (status: IAttendanceStatus | "all") => void
  onResetFilters: () => void
  selectedEmployee: SelectedEmployeeSummary | null
  onSelectEmployee: (emp: SelectedEmployeeSummary) => void
}

/**
 * Presenter table displaying filtered attendance logs with inline state indicators.
 * Encapsulates table header rows, loading spinner, and empty state rendering.
 */
export function AttendanceRecordsTable({
  records,
  isLoading,
  isError,
  startDate,
  endDate,
  statusFilter,
  onDateChange,
  onStatusFilterChange,
  onResetFilters,
  selectedEmployee,
  onSelectEmployee,
}: AttendanceRecordsTableProps) {
  return (
    <PageCard padding="none">
      <AttendanceRecordsFilters
        startDate={startDate}
        endDate={endDate}
        statusFilter={statusFilter}
        onDateChange={onDateChange}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetFilters}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3">Nhân sự</TableHead>
              <TableHead className="px-4 py-3">Ngày</TableHead>
              <TableHead className="px-4 py-3">Check-in</TableHead>
              <TableHead className="px-4 py-3">Check-out</TableHead>
              <TableHead className="px-4 py-3">Tổng giờ</TableHead>
              <TableHead className="px-4 py-3">Trạng thái</TableHead>
              <TableHead className="px-4 py-3 hidden lg:table-cell">Vi phạm / OT</TableHead>
              <TableHead className="px-4 py-3">Hiệu chỉnh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Đang tải dữ liệu...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-destructive">
                  Không thể tải bản ghi chấm công. Vui lòng thử lại.
                </TableCell>
              </TableRow>
            ) : !records?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Không tìm thấy bản ghi chấm công nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <AttendanceRecordsTableRow
                  key={record.id}
                  record={record}
                  isSelected={selectedEmployee?.id === record.employeeId}
                  onSelectEmployee={onSelectEmployee}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageCard>
  )
}
