import { PageCard, SectionHeader, StatusPill } from "@/components/common"
import { IconBox } from "@/components/common/icon-box"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { ActivityLogItem } from "@/types/security.types"
import { History, Lock, ShieldCheck, UserCheck, UserX, type LucideIcon } from "lucide-react"

const ACTION_LABEL_MAP = new Map<string, string>([
  ["login", "Đăng nhập thành công"],
  ["logout", "Đăng xuất"],
  ["failed_login", "Đăng nhập thất bại"],
  ["role_assigned", "Gán vai trò"],
  ["role_revoked", "Thu hồi vai trò"],
  ["account_locked", "Khóa tài khoản"],
  ["account_unlocked", "Mở khóa tài khoản"],
])

const ACTION_VARIANT_MAP = new Map<string, "success" | "danger" | "warning" | "neutral">([
  ["login", "success"],
  ["logout", "neutral"],
  ["failed_login", "danger"],
  ["role_assigned", "success"],
  ["role_revoked", "warning"],
  ["account_locked", "danger"],
  ["account_unlocked", "success"],
])

function parseRoleDetails(details: unknown): string {
  if (!details) return "N/A"
  try {
    const parsed = typeof details === "string" ? JSON.parse(details) : details
    return (parsed as { role?: string })?.role || "N/A"
  } catch {
    return "N/A"
  }
}

interface SecurityEventRowProps {
  icon: LucideIcon
  label: string
  subtitle: string
  statusLabel: string
  statusVariant: "success" | "danger" | "warning" | "neutral"
  timestamp: string
  colorClass: string
  isLast?: boolean
}

function SecurityEventRow({
  icon: Icon,
  label,
  subtitle,
  statusLabel,
  statusVariant,
  timestamp,
  colorClass,
  isLast,
}: SecurityEventRowProps) {
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
          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "leading-none")}>{label}</span>
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1")}>{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill label={statusLabel} variant={statusVariant} />
        <span className={cn(TYPOGRAPHY.CELL_TIME, "tabular-nums")}>{timestamp}</span>
      </div>
    </div>
  )
}

/**
 * Props for SecurityEventsSection component.
 */
export interface SecurityEventsSectionProps {
  recentSecurityEvents: ActivityLogItem[]
  recentRoleEvents: ActivityLogItem[]
}

/**
 * Presenter component rendering recent security events and role changes lists.
 */
export function SecurityEventsSection({
  recentSecurityEvents,
  recentRoleEvents,
}: SecurityEventsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PageCard className="h-full">
        <SectionHeader
          title="Sự kiện bảo mật gần đây"
          action={<History size={16} className="text-muted-foreground" />}
        />
        <div className="mt-4 space-y-0 px-1">
          {recentSecurityEvents.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Không có sự kiện bảo mật nào gần đây.</p>
            </div>
          ) : (
            recentSecurityEvents.map((event, idx) => (
              <SecurityEventRow
                key={event.id}
                icon={event.actionType === "account_locked" ? Lock : ShieldCheck}
                label={ACTION_LABEL_MAP.get(event.actionType) || event.actionType}
                subtitle={`${event.employeeName || "Hệ thống"} • ${event.ipAddress || "Không rõ IP"}`}
                statusLabel={event.actionType}
                statusVariant={ACTION_VARIANT_MAP.get(event.actionType) ?? "neutral"}
                timestamp={new Date(event.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                colorClass={
                  event.actionType === "account_locked"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"
                }
                isLast={idx === recentSecurityEvents.length - 1}
              />
            ))
          )}
        </div>
      </PageCard>

      <PageCard className="h-full">
        <SectionHeader
          title="Thay đổi quyền hạn gần đây"
          action={<UserCheck size={16} className="text-muted-foreground" />}
        />
        <div className="mt-4 space-y-0 px-1">
          {recentRoleEvents.length === 0 ? (
            <div className="py-12 text-center">
              <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Không có thay đổi quyền hạn nào gần đây.
              </p>
            </div>
          ) : (
            recentRoleEvents.map((event, idx) => (
              <SecurityEventRow
                key={event.id}
                icon={event.actionType === "role_assigned" ? UserCheck : UserX}
                label={ACTION_LABEL_MAP.get(event.actionType) || event.actionType}
                subtitle={`${event.employeeName} • ${parseRoleDetails(event.details)}`}
                statusLabel={event.actionType}
                statusVariant={ACTION_VARIANT_MAP.get(event.actionType) ?? "neutral"}
                timestamp={new Date(event.createdAt).toLocaleDateString("vi-VN")}
                colorClass={
                  event.actionType === "role_assigned"
                    ? "bg-primary/10 text-primary"
                    : "bg-warning/10 text-warning"
                }
                isLast={idx === recentRoleEvents.length - 1}
              />
            ))
          )}
        </div>
      </PageCard>
    </div>
  )
}
