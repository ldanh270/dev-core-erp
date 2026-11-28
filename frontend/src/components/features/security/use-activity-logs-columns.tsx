import { type DataTableColumn, StatusPill, TABLE_COL_WIDTH, TYPOGRAPHY } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTION_VARIANTS,
  SECURITY_CATEGORY_VARIANTS,
} from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import { cn } from "@/lib/utils"
import type { ActivityLogItem } from "@/types/security.types"

import { useMemo } from "react"

import { Activity, Eye, Globe, Key, Lock, Shield, Unlock, User } from "lucide-react"

const ACTION_VARIANT_MAP = new Map<string, string>(Object.entries(ACTIVITY_ACTION_VARIANTS))

function renderActionIcon(actionType: string) {
  if (actionType.includes("ROLE") || actionType.includes("PERMISSION")) {
    return <Shield className="size-4" />
  }
  if (actionType.includes("EMPLOYEE")) return <User className="size-4" />
  if (
    actionType.includes("password") ||
    actionType.includes("login") ||
    actionType.includes("logout")
  ) {
    return <Key className="size-4" />
  }
  if (actionType.includes("lock")) {
    return actionType.includes("unlocked") ? (
      <Unlock className="size-4" />
    ) : (
      <Lock className="size-4" />
    )
  }
  return <Activity className="size-4" />
}

function getActionIconColor(actionType: string) {
  const variant = ACTION_VARIANT_MAP.get(actionType) ?? "neutral"
  switch (variant) {
    case "success":
      return "text-emerald-500"
    case "danger":
      return "text-rose-500"
    case "warning":
      return "text-amber-500"
    case "info":
      return "text-blue-500"
    default:
      return "text-muted-foreground"
  }
}

/**
 * Custom hook producing table column definitions for the Activity Logs data table.
 *
 * @param onViewDetail Callback invoked when clicking the view details action.
 */
export function useActivityLogsColumns(onViewDetail: (id: string) => void) {
  return useMemo<DataTableColumn<ActivityLogItem>[]>(
    () => [
      {
        id: "action",
        header: "Hành động",
        width: `${TABLE_COL_WIDTH.TITLE}px`,
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (log) => (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("shrink-0", getActionIconColor(log.actionType))}>
              {renderActionIcon(log.actionType)}
            </div>
            <span
              className={cn("font-semibold", TYPOGRAPHY.CELL_PRIMARY)}
              title={ACTIVITY_ACTION_LABELS[log.actionType] ?? log.actionType}
            >
              {ACTIVITY_ACTION_LABELS[log.actionType] ?? log.actionType}
            </span>
          </div>
        ),
      },
      {
        id: "employee",
        header: "Nhân viên",
        width: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        cell: (log) => (
          <div className="min-w-0 flex flex-col justify-center">
            <p className={TYPOGRAPHY.CELL_PRIMARY} title={log.employeeName || COMMON_TEXTS.SYSTEM}>
              {log.employeeName || (
                <span className="text-muted-foreground italic">{COMMON_TEXTS.SYSTEM}</span>
              )}
            </p>
            <p className={TYPOGRAPHY.CELL_CODE}>{log.employeeId || COMMON_TEXTS.NOT_AVAILABLE}</p>
          </div>
        ),
      },
      {
        id: "category",
        header: "Danh mục",
        align: "center",
        width: `${TABLE_COL_WIDTH.TYPE}px`,
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (log) => (
          <StatusPill
            label={log.category}
            variant={SECURITY_CATEGORY_VARIANTS[log.category] ?? "neutral"}
            className="px-3 py-0.5 font-bold uppercase"
          />
        ),
      },
      {
        id: "ipAddress",
        header: "Địa chỉ IP",
        width: `${TABLE_COL_WIDTH.TIMESTAMP}px`,
        minWidth: `${TABLE_COL_WIDTH.TIMESTAMP}px`,
        hideBelow: "lg",
        cell: (log) => (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 rounded-full border border-border/40 text-xs font-mono text-muted-foreground">
            <Globe className="size-3.5 opacity-50 shrink-0" />
            <span>{log.ipAddress || "—"}</span>
          </div>
        ),
      },
      {
        id: "time",
        header: "Thời gian",
        width: `${TABLE_COL_WIDTH.DATE}px`,
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        cell: (log) => (
          <div className="min-w-0 flex flex-col justify-center">
            <p className={TYPOGRAPHY.CELL_DATE}>
              {new Date(log.createdAt).toLocaleDateString("vi-VN")}
            </p>
            <p className={TYPOGRAPHY.CELL_TIME}>
              {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Chi tiết",
        align: "center",
        width: `${TABLE_COL_WIDTH.ACTIONS}px`,
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        cell: (log) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onViewDetail(log.id)
              }}
              className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              title="Xem chi tiết"
              aria-label="Xem chi tiết"
            >
              <Eye className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetail],
  )
}
