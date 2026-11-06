import { PageCard, PageContainer, PageHeader, SectionHeader, StatusPill } from "@/components/common"
import { IconBox } from "@/components/common/icon-box"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSecuritySummary } from "@/hooks/security/queries/use-security-query"
import { useState } from "react"
import type { ActivityLogItem } from "@/types/security.types"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/routes.config"

import {
  AlertTriangle,
  History,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  login: "Đăng nhập thành công",
  logout: "Đăng xuất",
  failed_login: "Đăng nhập thất bại",
  role_assigned: "Gán vai trò",
  role_revoked: "Thu hồi vai trò",
  account_locked: "Khóa tài khoản",
  account_unlocked: "Mở khóa tài khoản",
}

const ACTION_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  login: "success",
  logout: "neutral",
  failed_login: "danger",
  role_assigned: "success",
  role_revoked: "warning",
  account_locked: "danger",
  account_unlocked: "success",
}

/**
 * Local component for rendering security events with complex layouts.
 * Isolates security-specific UI logic from shared common components.
 */
function SecurityEventRow({
  icon: Icon,
  label,
  subtitle,
  statusLabel,
  statusVariant,
  timestamp,
  colorClass,
  isLast,
}: {
  icon: LucideIcon
  label: string
  subtitle: string
  statusLabel: string
  statusVariant: "success" | "danger" | "warning" | "neutral"
  timestamp: string
  colorClass: string
  isLast?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        !isLast && "border-b border-border/20",
      )}
    >
      <div className="flex items-center gap-3">
        <IconBox icon={Icon} colorClass={colorClass} size="sm" />
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-foreground leading-none">{label}</span>
          <span className="text-[11px] text-muted-foreground mt-1">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill label={statusLabel} variant={statusVariant} />
        <span className="text-[10px] text-muted-foreground tabular-nums">{timestamp}</span>
      </div>
    </div>
  )
}

export default function SecurityDashboard() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days">("today")
  const { data, isLoading, isError, refetch } = useSecuritySummary(timeRange)

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu bảo mật...</p>
      </div>
      </PageContainer>
    )
  }

  if (isError || !data) {
    return (
      <PageContainer variant="default">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải thông tin bảo mật. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { refetch(); }}>
            Thử lại
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="default" className="space-y-8">
      <PageHeader
        title="Tổng quan bảo mật"
        description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
        actions={
          <div className="flex items-center gap-3">
            <Select
              value={timeRange}
              onValueChange={(val: "today" | "7days" | "30days") => { setTimeRange(val); }}
            >
              <SelectTrigger className="w-[160px] rounded-full text-sm font-semibold">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today" className="text-sm">Hôm nay</SelectItem>
                <SelectItem value="7days" className="text-sm">7 ngày qua</SelectItem>
                <SelectItem value="30days" className="text-sm">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-1.5 rounded-full text-sm font-semibold"
              onClick={() => { refetch(); }}
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PageCard
          className="cursor-pointer hover:border-rose-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=security&actionType=account_locked`) }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tài khoản bị khóa
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.lockedAccountsCount}
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard
          className="cursor-pointer hover:border-amber-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=auth&actionType=failed_login`) }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đăng nhập thất bại ({timeRange === "today" ? "Hôm nay" : timeRange === "7days" ? "7 ngày qua" : "30 ngày qua"})
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.failedLoginsToday}
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard
          className="cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate(`${ROUTES.HRM.ACTIVITY_LOGS}?category=auth&actionType=login`) }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đăng nhập thành công ({timeRange === "today" ? "Hôm nay" : timeRange === "7days" ? "7 ngày qua" : "30 ngày qua"})
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.successfulLoginsToday}
              </p>
            </div>
          </div>
        </PageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Security Events */}
        <PageCard className="h-full">
          <SectionHeader
            title="Sự kiện bảo mật gần đây"
            action={<History size={16} className="text-muted-foreground" />}
          />
          <div className="mt-4 space-y-0 px-1">
            {data.recentSecurityEvents.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Không có sự kiện bảo mật nào gần đây.</p>
              </div>
            ) : (
              data.recentSecurityEvents.map((event: ActivityLogItem, idx: number) => (
                <SecurityEventRow
                  key={event.id}
                  icon={event.actionType === "account_locked" ? Lock : ShieldCheck}
                  label={ACTION_LABELS[event.actionType] || event.actionType}
                  subtitle={`${event.employeeName || "Hệ thống"} • ${event.ipAddress || "Không rõ IP"}`}
                  statusLabel={event.actionType}
                  statusVariant={Object.entries(ACTION_VARIANTS).find(([k]) => k === event.actionType)?.[1] ?? "neutral"}
                  timestamp={new Date(event.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  colorClass={
                    event.actionType === "account_locked"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }
                  isLast={idx === data.recentSecurityEvents.length - 1}
                />
              ))
            )}
          </div>
        </PageCard>

        {/* Recent Role Events */}
        <PageCard className="h-full">
          <SectionHeader
            title="Thay đổi quyền hạn gần đây"
            action={<UserCheck size={16} className="text-muted-foreground" />}
          />
          <div className="mt-4 space-y-0 px-1">
            {data.recentRoleEvents.length === 0 ? (
              <div className="py-12 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Không có thay đổi quyền hạn nào gần đây.</p>
              </div>
            ) : (
              data.recentRoleEvents.map((event: ActivityLogItem, idx: number) => (
                <SecurityEventRow
                  key={event.id}
                  icon={event.actionType === "role_assigned" ? UserCheck : UserX}
                  label={ACTION_LABELS[event.actionType] || event.actionType}
                  subtitle={`${event.employeeName} • ${(() => {
                    if (!event.details) return "N/A"
                    try {
                      const parsed = typeof event.details === "string" ? JSON.parse(event.details) : event.details
                      return parsed?.role || "N/A"
                    } catch {
                      return "N/A"
                    }
                  })()}`}
                  statusLabel={event.actionType}
                  statusVariant={Object.entries(ACTION_VARIANTS).find(([k]) => k === event.actionType)?.[1] ?? "neutral"}
                  timestamp={new Date(event.createdAt).toLocaleDateString("vi-VN")}
                  colorClass={
                    event.actionType === "role_assigned"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-orange-500/10 text-orange-600"
                  }
                  isLast={idx === data.recentRoleEvents.length - 1}
                />
              ))
            )}
          </div>
        </PageCard>
      </div>
    </PageContainer>
  )
}
