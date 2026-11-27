import { PageCard } from "@/components/common"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"
import { Lock, ShieldAlert, UserCheck } from "lucide-react"

/**
 * Props for SecurityStatsRow component.
 */
export interface SecurityStatsRowProps {
  timeRange: "today" | "7days" | "30days"
  lockedAccountsCount: number
  failedLoginsToday: number
  successfulLoginsToday: number
}

/**
 * Presenter component displaying security KPI summary cards with direct drill-down navigation.
 */
export function SecurityStatsRow({
  timeRange,
  lockedAccountsCount,
  failedLoginsToday,
  successfulLoginsToday,
}: SecurityStatsRowProps) {
  const periodLabel =
    timeRange === "today" ? "Hôm nay" : timeRange === "7days" ? "7 ngày qua" : "30 ngày qua"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PageCard
        className="cursor-pointer hover:border-destructive/40 hover:shadow-md transition-all duration-200"
        onClick={() => {
          routerNavigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=security&actionType=account_locked`)
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tài khoản bị khóa
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{lockedAccountsCount}</p>
          </div>
        </div>
      </PageCard>

      <PageCard
        className="cursor-pointer hover:border-warning/40 hover:shadow-md transition-all duration-200"
        onClick={() => {
          routerNavigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=auth&actionType=failed_login`)
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Đăng nhập thất bại ({periodLabel})
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{failedLoginsToday}</p>
          </div>
        </div>
      </PageCard>

      <PageCard
        className="cursor-pointer hover:border-success/40 hover:shadow-md transition-all duration-200"
        onClick={() => {
          routerNavigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=auth&actionType=login`)
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Đăng nhập thành công ({periodLabel})
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{successfulLoginsToday}</p>
          </div>
        </div>
      </PageCard>
    </div>
  )
}
