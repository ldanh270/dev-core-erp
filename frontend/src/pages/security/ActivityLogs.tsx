import {
  type DataTableColumn,
  DataTablePage,
  DateRangePicker,
  StatusPill,
  TABLE_COL_WIDTH,
  TYPOGRAPHY,
} from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTION_VARIANTS,
  SECURITY_CATEGORY_VARIANTS,
} from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import { useActivityLogsMaster } from "@/hooks/security/use-activity-logs-master"
import { cn } from "@/lib/utils"
import type { ActivityLogItem } from "@/types/security.types"

import { useMemo } from "react"
import {
  Activity,
  Eye,
  FileText,
  Filter,
  Globe,
  Key,
  Lock,
  RefreshCw,
  Shield,
  Unlock,
  User,
} from "lucide-react"

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
 * Standardized ActivityLogs component powered by DataTablePage master component.
 * Integrates internal viewport scrolling, debounced search, responsive filters, and pinned pagination.
 */
export default function ActivityLogs() {
  const {
    query,
    setQuery,
    searchTerm,
    handleSearch,
    handleFilterChange,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    refetch,
  } = useActivityLogsMaster()

  const currentPage = query.page || 1
  const pageSize = query.limit || 20
  const totalPages = data?.meta.totalPages ?? 0

  const columns: DataTableColumn<ActivityLogItem>[] = useMemo(
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
              {getActionIcon(log.actionType)}
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
            <p
              className={TYPOGRAPHY.CELL_PRIMARY}
              title={log.employeeName || COMMON_TEXTS.SYSTEM}
            >
              {log.employeeName || (
                <span className="text-muted-foreground italic">{COMMON_TEXTS.SYSTEM}</span>
              )}
            </p>
            <p className={TYPOGRAPHY.CELL_CODE}>
              {log.employeeId || COMMON_TEXTS.NOT_AVAILABLE}
            </p>
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
        width: "150px",
        minWidth: "150px",
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
                setViewingLogId(log.id)
              }}
              className="rounded-full text-muted-foreground hover:text-foreground"
              title="Xem chi tiết"
              aria-label="Xem chi tiết"
            >
              <Eye className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [setViewingLogId],
  )

  return (
    <DataTablePage<ActivityLogItem>
      title="Nhật ký hoạt động"
      description="Truy vết toàn bộ hoạt động bảo mật và thay đổi dữ liệu trong hệ thống."
      headerActions={
        <Button
          variant="outline"
          onClick={() => {
            void refetch()
          }}
          className="gap-1.5 rounded-full text-sm font-semibold"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Làm mới
        </Button>
      }
      search={{
        placeholder: "Tìm theo ID nhân viên...",
        value: searchTerm,
        onSearch: handleSearch,
        onClear: () => {
          handleSearch("")
        },
      }}
      filters={
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <Select
              value={query.category || "ALL"}
              onValueChange={(val) => {
                handleFilterChange("category", val)
              }}
            >
              <SelectTrigger
                className={cn(
                  "w-[155px] rounded-full bg-background",
                  TYPOGRAPHY.TOOLBAR_CONTROL,
                )}
              >
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                <SelectItem value="AUTH">Xác thực</SelectItem>
                <SelectItem value="HRM">Nhân sự</SelectItem>
                <SelectItem value="SECURITY">Bảo mật</SelectItem>
                <SelectItem value="ATTENDANCE">Chấm công</SelectItem>
                <SelectItem value="SYSTEM">Hệ thống</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={TYPOGRAPHY.TOOLBAR_LABEL}>
              Lọc theo ngày:
            </span>
            <DateRangePicker
              startDate={query.fromDate || null}
              endDate={query.toDate || null}
              onChange={({ startDate, endDate }) => {
                handleFilterChange("fromDate", startDate || undefined)
                handleFilterChange("toDate", endDate || undefined)
              }}
              size="default"
              placeholder="Chọn khoảng ngày..."
              className="w-[210px] rounded-full shrink-0"
            />
          </div>
        </div>
      }
      columns={columns}
      data={data?.data || []}
      isLoading={isLoading}
      emptyState={{
        icon: FileText,
        title: "Không có bản ghi nhật ký",
        description: "Không tìm thấy nhật ký hoạt động nào trong khoảng thời gian này.",
      }}
      onResetFilters={() => {
        handleSearch("")
        handleFilterChange("category", "ALL")
        handleFilterChange("fromDate", undefined)
        handleFilterChange("toDate", undefined)
      }}
      pagination={
        data && data.meta.total > 0
          ? {
              currentPage,
              totalPages,
              totalItems: data.meta.total,
              itemsPerPage: pageSize,
              onPageChange: (p) => {
                setQuery((prev) => ({ ...prev, page: p }))
              },
              onItemsPerPageChange: (limit) => {
                setQuery((prev) => ({ ...prev, limit, page: 1 }))
              },
              pageSizeOptions: [10, 20, 50, 100],
            }
          : undefined
      }
      extraContent={
        <ActivityLogDetailDrawer
          logId={viewingLogId}
          onClose={() => {
            setViewingLogId(null)
          }}
        />
      }
    />
  )
}
