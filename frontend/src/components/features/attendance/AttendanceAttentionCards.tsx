import { AlertTriangle, TimerOff, UserCheck } from "lucide-react"
import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"

export interface AttendanceAttentionCardsProps {
  openCheckoutCount: number
  attentionRecordsCount: number
  correctedCount: number
}

/**
 * Presenter cards highlighting abnormal attendance occurrences requiring administrative review.
 * Summarizes unclosed checkout instances, tardiness, early leaves, and manual adjustments.
 */
export function AttendanceAttentionCards({
  openCheckoutCount,
  attentionRecordsCount,
  correctedCount,
}: AttendanceAttentionCardsProps) {
  return (
    <PageCard padding="lg" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Cần xử lý</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Các bản ghi có dấu hiệu bất thường trong khoảng lọc hiện tại.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${openCheckoutCount} chưa checkout hôm nay`} variant="warning" />
          <StatusPill label={`${attentionRecordsCount} bản ghi cần xem`} variant="info" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TimerOff className="h-4 w-4 text-warning" />
            Chưa checkout
          </div>
          <p className="mt-2 text-2xl font-bold">{openCheckoutCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Nhân sự đã check in nhưng chưa hoàn tất check out.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Bất thường
          </div>
          <p className="mt-2 text-2xl font-bold">{attentionRecordsCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bao gồm đi muộn, về sớm, OT hoặc chưa đóng ca.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserCheck className="h-4 w-4 text-success" />
            Đã sửa qua đơn
          </div>
          <p className="mt-2 text-2xl font-bold">{correctedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bản ghi được đồng bộ hợp lệ từ đơn từ giải trình.
          </p>
        </div>
      </div>
    </PageCard>
  )
}
