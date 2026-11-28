import { Clock } from "lucide-react"

interface PayslipAttendanceSummaryProps {
  workingDays: number
  absentDays: number
  overtimeMinutes: number
}

/**
 * Presenter card displaying attendance metrics (standard days, actual days, paid leave) on a payslip.
 */
export function PayslipAttendanceSummary({
  workingDays,
  absentDays,
  overtimeMinutes,
}: PayslipAttendanceSummaryProps) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">Tổng kết chấm công</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
            <span className="text-muted-foreground mb-1">Ngày công</span>
            <span className="font-semibold text-2xl">{workingDays}</span>
          </div>
          <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
            <span className="text-muted-foreground mb-1">Vắng mặt</span>
            <span className="font-semibold text-2xl text-destructive">{absentDays}</span>
          </div>
          <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
            <span className="text-muted-foreground mb-1">Tăng ca (phút)</span>
            <span className="font-semibold text-2xl text-success">{overtimeMinutes}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
