import { PageCard } from "@/components/common"
import { CalendarX2, Clock, Users, UserCheck } from "lucide-react"

interface AttendanceDashboardStatsProps {
  totalRecords?: number
  presentToday: number
  lateToday: number
  absentToday: number
}

/**
 * Presenter component displaying four primary attendance metrics cards for today.
 * Pure UI presentation adhering to DevCore design tokens.
 */
export function AttendanceDashboardStats({
  totalRecords,
  presentToday,
  lateToday,
  absentToday,
}: AttendanceDashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Tổng nhân sự</p>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{totalRecords || "—"}</p>
        <p className="text-xs text-muted-foreground mt-1">Trong khoảng lọc</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Đã có mặt</p>
          <UserCheck className="h-4 w-4 text-success" />
        </div>
        <p className="text-2xl font-bold text-success">{presentToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Đã check in hôm nay</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Đi muộn</p>
          <Clock className="h-4 w-4 text-warning" />
        </div>
        <p className="text-2xl font-bold text-warning">{lateToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
      </PageCard>

      <PageCard padding="lg">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium tracking-tight">Vắng mặt</p>
          <CalendarX2 className="h-4 w-4 text-destructive" />
        </div>
        <p className="text-2xl font-bold text-destructive">{absentToday}</p>
        <p className="text-xs text-muted-foreground mt-1">Hôm nay</p>
      </PageCard>
    </div>
  )
}
