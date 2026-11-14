/** Day-cell renderer for scheduled and actual attendance details. */
import { StatusPill } from "@/components/common/status-pill"
import { CHECK_IN_VARIANCE_STATUS } from "@/config/entities/attendance.config"
import type { IAttendanceMatrixShift } from "@/types/attendance.types"
import { formatClock, formatVariance } from "@/utils/attendance/attendance-matrix.util"

const VARIANTS = new Map<string, "success" | "info" | "warning" | "neutral">([
  [CHECK_IN_VARIANCE_STATUS.EARLY, "success"],
  [CHECK_IN_VARIANCE_STATUS.ON_TIME, "info"],
  [CHECK_IN_VARIANCE_STATUS.LATE, "warning"],
  [CHECK_IN_VARIANCE_STATUS.UNAVAILABLE, "neutral"],
])

/** Renders one matrix day, optionally collapsing extra shifts in the monthly view. */
export function AttendanceMatrixCell({
  shifts,
  collapseMultiple = false,
}: {
  shifts: IAttendanceMatrixShift[]
  collapseMultiple?: boolean
}) {
  if (shifts.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visibleShifts = collapseMultiple ? shifts.slice(0, 1) : shifts
  const hiddenShiftCount = shifts.length - visibleShifts.length

  return (
    <div className="space-y-2">
      {visibleShifts.map((shift) => (
        <div
          key={shift.id}
          className="min-w-32 space-y-1 rounded-lg border border-border bg-muted/20 p-2"
        >
          <p className="truncate text-xs font-medium">{shift.shiftName ?? "Ca làm"}</p>
          <p
            className="font-mono text-xs text-foreground"
            title={`Check-in ${formatClock(shift.checkInAt)}, checkout ${formatClock(shift.checkOutAt)}`}
          >
            {formatClock(shift.checkInAt)} · {formatClock(shift.checkOutAt)}
          </p>
          <StatusPill
            label={formatVariance(shift)}
            variant={VARIANTS.get(shift.status) ?? "neutral"}
          />
        </div>
      ))}
      {hiddenShiftCount > 0 && (
        <span
          className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          title={`${hiddenShiftCount} ca khác trong ngày`}
        >
          +{hiddenShiftCount} ca khác
        </span>
      )}
    </div>
  )
}
