import { PageCard } from "@/components/common"
import { Lock, ShieldCheck, Unlock } from "lucide-react"

/**
 * Props for PermissionMatrixStatsCards component.
 */
export interface PermissionMatrixStatsCardsProps {
  stats: {
    total: number
    publicRoutes: number
    protectedRoutes: number
    permissionRoutes: number
  }
}

/**
 * Presenter component displaying route permission counters (Public, Protected, Permission Required).
 */
export function PermissionMatrixStatsCards({ stats }: PermissionMatrixStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
      <PageCard className="bg-muted/20 border-border">
        <div className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Unlock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Công khai
            </p>
            <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
              {stats.publicRoutes}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
            </h3>
          </div>
        </div>
      </PageCard>

      <PageCard className="bg-muted/20 border-border">
        <div className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10 text-success">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Yêu cầu đăng nhập
            </p>
            <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
              {stats.protectedRoutes}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
            </h3>
          </div>
        </div>
      </PageCard>

      <PageCard className="bg-muted/20 border-border">
        <div className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10 text-info">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Yêu cầu quyền đặc biệt
            </p>
            <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
              {stats.permissionRoutes}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
            </h3>
          </div>
        </div>
      </PageCard>
    </div>
  )
}
