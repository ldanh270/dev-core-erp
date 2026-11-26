import { TYPOGRAPHY } from "@/config/typography.config"
import { Calendar as CalendarIcon, CheckCircle2, Clock, Layers } from "lucide-react"

export interface MyInterviewsStatsRowProps {
  totalCount: number
  todayCount: number
  pendingCount: number
  completedCount: number
}

/**
 * Pure UI presenter rendering quick summary statistic cards for personal interview workload.
 */
export function MyInterviewsStatsRow({
  totalCount,
  todayCount,
  pendingCount,
  completedCount,
}: MyInterviewsStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
      <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className={TYPOGRAPHY.TABLE_HEADER}>Tổng số buổi PV</span>
          <Layers className="size-4 text-primary" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">{totalCount}</span>
          <span className="text-xs font-medium text-muted-foreground">Tất cả các vòng</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-warning/40 hover:shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className={TYPOGRAPHY.TABLE_HEADER}>Hôm nay</span>
          <Clock className="size-4 text-warning" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-warning">{todayCount}</span>
          <span className="text-xs font-medium text-muted-foreground">Buổi phỏng vấn</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-info/40 hover:shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className={TYPOGRAPHY.TABLE_HEADER}>Sắp diễn ra</span>
          <CalendarIcon className="size-4 text-info" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-info">{pendingCount}</span>
          <span className="text-xs font-medium text-muted-foreground">Chờ đánh giá</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-success/40 hover:shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className={TYPOGRAPHY.TABLE_HEADER}>Đã hoàn thành</span>
          <CheckCircle2 className="size-4 text-success" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-success">{completedCount}</span>
          <span className="text-xs font-medium text-muted-foreground">Đã ghi nhận</span>
        </div>
      </div>
    </div>
  )
}
