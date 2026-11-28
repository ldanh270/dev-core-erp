import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { IPayslipDailyWorkLog } from "@/types/payroll.types"

import { MessageSquare } from "lucide-react"

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  on_time: "Đúng giờ",
  late: "Đi muộn",
  early_leave: "Về sớm",
  absent: "Vắng",
  overtime: "Tăng ca",
  no_record: "Chưa có dữ liệu",
}

const ATTENDANCE_STATUS_LABEL_MAP = new Map(Object.entries(ATTENDANCE_STATUS_LABELS))

/** Helper formatter for human-readable work duration hours string. */
function formatWorkHours(hours: number) {
  return `${Math.max(0, hours).toFixed(2).replace(/\.00$/, "")} giờ`
}

/** Helper mapping attendance status code to localized label. */
function getAttendanceStatusLabel(status: string) {
  return ATTENDANCE_STATUS_LABEL_MAP.get(status) || status
}

interface PayslipDailyWorkTabProps {
  dailyWorkLogs: IPayslipDailyWorkLog[]
  canFeedback?: boolean
  onOpenFeedback: (date: string) => void
}

/**
 * Presenter tab rendering calendar breakdown of work shifts, overtime, and attendance punches.
 */
export function PayslipDailyWorkTab({
  dailyWorkLogs,
  canFeedback,
  onOpenFeedback,
}: PayslipDailyWorkTabProps) {
  return (
    <div className="max-h-[380px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/40">
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Ca</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Giờ làm</TableHead>
            <TableHead className="text-right">Tăng ca</TableHead>
            <TableHead className="text-right">Muộn/Sớm</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {dailyWorkLogs.map((day) => (
            <TableRow key={day.date}>
              <TableCell className="font-medium">
                Ngày {day.dayOfMonth}
                <div className="text-xs text-muted-foreground">{day.date}</div>
              </TableCell>
              <TableCell>{day.shiftName || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="rounded-full shadow-none">
                  {getAttendanceStatusLabel(day.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{formatWorkHours(day.workHours)}</TableCell>
              <TableCell className="text-right">{day.overtimeMinutes} phút</TableCell>
              <TableCell className="text-right">
                {day.lateMinutes + day.earlyLeaveMinutes} phút
              </TableCell>
              <TableCell className="text-right">
                {canFeedback ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      onOpenFeedback(day.date)
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {dailyWorkLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Chưa có dữ liệu công theo ngày.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}
