import { EmptyState, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTION_VARIANTS,
  SECURITY_CATEGORY_VARIANTS,
} from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { ActivityLogItem } from "@/types/security.types"

import { Activity, Eye, FileText, Globe, Key, Lock, Shield, Unlock, User } from "lucide-react"

const getActionIcon = (actionType: string) => {
  if (actionType.includes("ROLE") || actionType.includes("PERMISSION"))
    return <Shield className="size-4" />
  if (actionType.includes("EMPLOYEE")) return <User className="size-4" />
  if (
    actionType.includes("password") ||
    actionType.includes("login") ||
    actionType.includes("logout")
  )
    return <Key className="size-4" />
  if (actionType.includes("lock"))
    return actionType.includes("unlocked") ? (
      <Unlock className="size-4" />
    ) : (
      <Lock className="size-4" />
    )
  return <Activity className="size-4" />
}

const ACTION_VARIANT_MAP = new Map<string, string>(Object.entries(ACTIVITY_ACTION_VARIANTS))

const getActionIconColor = (actionType: string) => {
  const variant = ACTION_VARIANT_MAP.get(actionType) ?? "neutral"
  switch (variant) {
    case "success":
      return "text-emerald-500"
    case "danger":
      return "text-destructive"
    case "warning":
      return "text-amber-500"
    case "info":
      return "text-primary"
    default:
      return "text-muted-foreground"
  }
}

interface ActivityLogsTableProps {
  logs: ActivityLogItem[]
  onViewDetail: (id: string) => void
  hideEmployee?: boolean
}

/** Standardized ActivityLogsTable using UI primitives. */
export function ActivityLogsTable({
  logs,
  onViewDetail,
  hideEmployee = false,
}: ActivityLogsTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto w-full">
      <Table className="w-full text-sm">
        <TableHeader className="sticky top-0 z-20 bg-background border-b border-border shadow-xs">
          <TableRow className="hover:bg-transparent">
            <TableHead
              className={cn(
                "sticky left-0 z-30 bg-background w-[22%] min-w-52 h-10 px-4",
                TYPOGRAPHY.TABLE_HEADER,
              )}
            >
              Hành động
            </TableHead>
            {!hideEmployee && (
              <TableHead className={cn("w-[20%] min-w-44 h-10 px-4", TYPOGRAPHY.TABLE_HEADER)}>
                Nhân viên
              </TableHead>
            )}
            <TableHead
              className={cn("w-[15%] min-w-32 h-10 px-4 text-center", TYPOGRAPHY.TABLE_HEADER)}
            >
              Danh mục
            </TableHead>
            <TableHead className={cn("w-[18%] min-w-36 h-10 px-4", TYPOGRAPHY.TABLE_HEADER)}>
              Địa chỉ IP
            </TableHead>
            <TableHead className={cn("w-[15%] min-w-36 h-10 px-4", TYPOGRAPHY.TABLE_HEADER)}>
              Thời gian
            </TableHead>
            <TableHead
              className={cn("w-[10%] min-w-24 h-10 px-4 text-center", TYPOGRAPHY.TABLE_HEADER)}
            >
              Chi tiết
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={hideEmployee ? 5 : 6} className="px-5 py-12 text-center">
                <EmptyState
                  icon={FileText}
                  title="Không có bản ghi nhật ký"
                  description="Không tìm thấy nhật ký hoạt động nào trong khoảng thời gian này."
                />
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow
                key={log.id}
                className="group hover:bg-muted/30 transition-colors duration-100"
              >
                <TableCell className="sticky left-0 z-10 bg-background h-[60px] px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={getActionIconColor(log.actionType)}>
                      {getActionIcon(log.actionType)}
                    </div>
                    <span className="font-semibold text-foreground text-[13px] truncate">
                      {ACTIVITY_ACTION_LABELS[log.actionType] ?? log.actionType}
                    </span>
                  </div>
                </TableCell>
                {!hideEmployee && (
                  <TableCell className="h-[60px] px-5 py-3">
                    <div className="text-[13px] text-foreground font-medium truncate">
                      {log.employeeName || (
                        <span className="text-muted-foreground italic">{COMMON_TEXTS.SYSTEM}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {log.employeeId || COMMON_TEXTS.NOT_AVAILABLE}
                    </div>
                  </TableCell>
                )}
                <TableCell className="h-[60px] px-5 py-3 text-center">
                  <StatusPill
                    label={log.category}
                    variant={SECURITY_CATEGORY_VARIANTS[log.category] ?? "neutral"}
                    className="text-[13px] px-3 py-1 font-bold uppercase"
                  />
                </TableCell>
                <TableCell className="h-[60px] px-5 py-3 font-mono text-[12px] text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-full font-mono text-xs font-normal"
                  >
                    <Globe className="size-3.5 opacity-50" />
                    <span>{log.ipAddress || "—"}</span>
                  </Badge>
                </TableCell>
                <TableCell className="h-[60px] px-5 py-3">
                  <div className="text-[13px] text-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </TableCell>
                <TableCell className="h-[60px] px-5 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onViewDetail(log.id)
                    }}
                    className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                    title="Xem chi tiết"
                  >
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
