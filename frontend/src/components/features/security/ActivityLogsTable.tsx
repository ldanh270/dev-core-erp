import { EmptyState, StatusPill } from "@/components/common"
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTION_VARIANTS,
  SECURITY_CATEGORY_VARIANTS,
} from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import type { ActivityLogItem } from "@/types/security.types"

import { Activity, Eye, FileText, Globe, Key, Lock, Shield, Unlock, User } from "lucide-react"

const getActionIcon = (actionType: string) => {
  if (actionType.includes("ROLE") || actionType.includes("PERMISSION"))
    return <Shield className="w-4 h-4" />
  if (actionType.includes("EMPLOYEE")) return <User className="w-4 h-4" />
  if (
    actionType.includes("password") ||
    actionType.includes("login") ||
    actionType.includes("logout")
  )
    return <Key className="w-4 h-4" />
  if (actionType.includes("lock"))
    return actionType.includes("unlocked") ? (
      <Unlock className="w-4 h-4" />
    ) : (
      <Lock className="w-4 h-4" />
    )
  return <Activity className="w-4 h-4" />
}

interface ActivityLogsTableProps {
  logs: ActivityLogItem[]
  onViewDetail: (id: string) => void
  hideEmployee?: boolean
}

export function ActivityLogsTable({
  logs,
  onViewDetail,
  hideEmployee = false,
}: ActivityLogsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/5">
            <th className="w-[20%] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Hành động
            </th>
            {!hideEmployee && (
              <th className="w-[20%] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nhân viên
              </th>
            )}
            <th className="w-[15%] px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục
            </th>
            <th className="w-[20%] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Địa chỉ IP
            </th>
            <th className="w-[15%] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Thời gian
            </th>
            <th className="w-[10%] px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={hideEmployee ? 5 : 6} className="px-5 py-8 text-center">
                <EmptyState
                  icon={FileText}
                  title="Không có bản ghi nhật ký"
                  description="Không tìm thấy nhật ký hoạt động nào trong khoảng thời gian này."
                />
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="group hover:bg-muted/30 transition-colors duration-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={
                        (ACTIVITY_ACTION_VARIANTS[log.actionType] ?? "neutral") === "success"
                          ? "text-emerald-500"
                          : (ACTIVITY_ACTION_VARIANTS[log.actionType] ?? "neutral") === "danger"
                            ? "text-rose-500"
                            : (ACTIVITY_ACTION_VARIANTS[log.actionType] ?? "neutral") === "warning"
                              ? "text-amber-500"
                              : (ACTIVITY_ACTION_VARIANTS[log.actionType] ?? "neutral") === "info"
                                ? "text-blue-500"
                                : "text-muted-foreground"
                      }
                    >
                      {getActionIcon(log.actionType)}
                    </div>
                    <span className="font-semibold text-foreground text-[13px]">
                      {ACTIVITY_ACTION_LABELS[log.actionType] ?? log.actionType}
                    </span>
                  </div>
                </td>
                {!hideEmployee && (
                  <td className="px-5 py-4">
                    <div className="text-[13px] text-foreground font-medium">
                      {log.employeeName || (
                        <span className="text-muted-foreground italic">{COMMON_TEXTS.SYSTEM}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {log.employeeId || COMMON_TEXTS.NOT_AVAILABLE}
                    </div>
                  </td>
                )}
                <td className="px-5 py-4 text-center">
                  <StatusPill
                    label={log.category}
                    variant={SECURITY_CATEGORY_VARIANTS[log.category] ?? "neutral"}
                    className="text-[13px] px-3 py-1 font-bold uppercase"
                  />
                </td>
                <td className="px-5 py-4 font-mono text-[12px] text-muted-foreground">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 rounded-full border border-border/40 text-xs">
                    <Globe className="w-3.5 h-3.5 opacity-50" />
                    <span>{log.ipAddress || "—"}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-[13px] text-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => {
                      onViewDetail(log.id)
                    }}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none inline-flex items-center justify-center"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-[18px] h-[18px]" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
