import {
  DataTablePage,
  type DataTableColumn,
  StatusPill,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/config/entities/attendance.config"
import { TABLE_COL_WIDTH } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import { useAllApplications } from "@/hooks/application/useAllApplications"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplicationListItem } from "@/lib/api/application.api"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { FileText, type LucideIcon, RotateCcw } from "lucide-react"

type StatusVariant = "success" | "warning" | "danger" | "neutral"

const STATUS_MAP = new Map<string, { label: string; variant: StatusVariant }>([
  [APPLICATION_STATUS.PENDING, { label: "Đang duyệt", variant: "warning" }],
  [APPLICATION_STATUS.PARTNER_PENDING, { label: "Chờ xác nhận đổi ca", variant: "warning" }],
  [APPLICATION_STATUS.APPROVED, { label: "Đã duyệt", variant: "success" }],
  [APPLICATION_STATUS.REJECTED, { label: "Không duyệt", variant: "danger" }],
  [APPLICATION_STATUS.CANCELLED, { label: "Đã hủy", variant: "neutral" }],
])

const APPLICATION_TYPE_MAP = new Map<string, string>(
  Object.entries(APPLICATION_TYPE_LABELS),
)

export interface ApplicationListProps {
  mode: "mine" | "manage" | "all"
  title: string
  description?: string
  primaryAction?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  subHeader?: ReactNode
  extraContent?: ReactNode
  onRowClick: (app: IApplicationListItem) => void
  hookState:
    | ReturnType<typeof useMyApplications>
    | ReturnType<typeof useManageApplications>
    | ReturnType<typeof useAllApplications>
}

/**
 * Enterprise ApplicationList component powered by DataTablePage master primitive.
 * Locks viewport height to guarantee sticky headers and persistent pinned pagination.
 */
export function ApplicationList({
  mode,
  title,
  description,
  primaryAction,
  subHeader,
  extraContent,
  onRowClick,
  hookState,
}: ApplicationListProps) {
  const currentHooks = hookState
  const {
    applications,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    stats,
  } = currentHooks as ReturnType<typeof useMyApplications> &
    ReturnType<typeof useManageApplications> &
    ReturnType<typeof useAllApplications>

  const [isTransitionLoading, setIsTransitionLoading] = useState(true)
  const showLoading = isLoading || isRefreshing || isTransitionLoading

  useEffect(() => {
    if (!isLoading && !isRefreshing) {
      const frame = requestAnimationFrame(() => {
        setIsTransitionLoading(false)
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }
  }, [isLoading, isRefreshing])

  const beginTransition = () => {
    setIsTransitionLoading(true)
  }

  const statusTabs = useMemo(() => [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "pending", label: "Chờ duyệt", count: stats.pending },
    { id: "approved", label: "Đã duyệt", count: stats.approved },
    { id: "rejected", label: "Không duyệt", count: stats.rejected },
  ], [stats])

  const columns: DataTableColumn<IApplicationListItem>[] = useMemo(() => {
    const cols: DataTableColumn<IApplicationListItem>[] = [
      {
        id: "id",
        header: "Mã đơn",
        width: `${TABLE_COL_WIDTH.CODE}px`,
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        sticky: true,
        cell: (app) => (
          <span className={cn(TYPOGRAPHY.CELL_CODE, "font-semibold")}>
            {app.id.substring(0, 8).toUpperCase()}
          </span>
        ),
      },
    ]

    if (mode === "manage" || mode === "all") {
      cols.push(
        {
          id: "employeeFullName",
          header: "Họ và tên",
          width: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
          minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
          sticky: true,
          cell: (app) => (
            <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "truncate")} title={app.employee?.fullName}>
              {app.employee?.fullName || "N/A"}
            </span>
          ),
        },
        {
          id: "employeeCode",
          header: "Mã nhân sự",
          width: `${TABLE_COL_WIDTH.CODE}px`,
          minWidth: `${TABLE_COL_WIDTH.CODE}px`,
          cell: (app) => (
            <span className={cn(TYPOGRAPHY.CELL_CODE, "text-primary")}>
              {app.employeeId.substring(0, 10)}
            </span>
          ),
        },
      )
    }

    cols.push(
      {
        id: "type",
        header: "Loại đơn",
        width: `${TABLE_COL_WIDTH.TYPE}px`,
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (app) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>
            {APPLICATION_TYPE_MAP.get(app.type) || app.type}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: `${TABLE_COL_WIDTH.STATUS}px`,
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        cell: (app) => {
          const s = STATUS_MAP.get(app.status)
          return (
            <StatusPill
              label={s?.label || app.status}
              variant={s?.variant || "neutral"}
            />
          )
        },
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: `${TABLE_COL_WIDTH.DATE}px`,
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        cell: (app) => (
          <span className={TYPOGRAPHY.CELL_DATE}>
            {new Date(app.createdAt).toLocaleDateString("vi-VN")}
          </span>
        ),
      },
      {
        id: "createdBy",
        header: "Người tạo",
        width: "160px",
        minWidth: "160px",
        cell: (app) => (
          <div className="flex flex-col">
            <span className={cn(TYPOGRAPHY.CELL_CODE, "text-primary font-medium")}>
              {app.employeeId.substring(0, 10)}
            </span>
            <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "truncate max-w-40")} title={app.employee?.fullName}>
              {app.employee?.fullName || "N/A"}
            </span>
          </div>
        ),
      },
      {
        id: "approvedBy",
        header: "Người duyệt",
        width: "160px",
        minWidth: "160px",
        cell: (app) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "whitespace-nowrap")}>
            {app.approvedBy?.fullName || app.assignedTo?.fullName || "—"}
          </span>
        ),
      },
    )

    return cols
  }, [mode])

  const filterControls = (
    <div className="flex items-center gap-3">
      <div className="min-w-[180px]">
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            beginTransition()
            setTypeFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger
            aria-label="Lọc theo loại đơn"
            className="bg-background border-border shadow-none rounded-full h-10 text-sm font-medium"
          >
            <SelectValue placeholder="Loại đơn" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tất cả loại đơn</SelectItem>
            {Object.values(APPLICATION_TYPES).map((t) => (
              <SelectItem key={t.LABEL} value={t.LABEL}>
                {t.DESCRIPTION}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          beginTransition()
          setKeyword("")
          setTypeFilter("all")
          setPage(1)
        }}
        className="h-10 gap-1.5 rounded-full text-sm font-medium"
      >
        <RotateCcw className="size-4" />
        Đặt lại
      </Button>
    </div>
  )

  return (
    <DataTablePage<IApplicationListItem>
      title={title}
      description={description}
      primaryAction={primaryAction}
      subHeader={subHeader}
      variant="viewport"
      tabs={
        mode !== "manage"
          ? {
              items: statusTabs,
              activeTab: statusFilter,
              onTabChange: (id) => {
                beginTransition()
                setStatusFilter(id as "all" | "pending" | "approved" | "rejected" | "cancelled")
                setPage(1)
              },
            }
          : undefined
      }
      search={
        mode !== "manage"
          ? {
              placeholder: "Tìm theo tên, người duyệt hoặc mã…",
              value: keyword,
              onSearch: (val) => {
                beginTransition()
                setKeyword(val)
                setPage(1)
              },
              onClear: () => {
                beginTransition()
                setKeyword("")
                setPage(1)
              },
            }
          : undefined
      }
      filters={mode !== "manage" ? filterControls : undefined}
      columns={columns}
      data={applications}
      isLoading={showLoading}
      onRowClick={(app) => { onRowClick(app) }}
      emptyState={{
        icon: FileText,
        title: "Không tìm thấy đơn phù hợp",
        description: "Không có đơn từ nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.",
      }}
      pagination={{
        currentPage: page,
        totalPages: totalPages || 1,
        totalItems: total,
        itemsPerPage: pageSize,
        onPageChange: (nextPage) => {
          beginTransition()
          setPage(nextPage)
        },
        onItemsPerPageChange: (nextPageSize) => {
          beginTransition()
          setPageSize(nextPageSize)
          setPage(1)
        },
        pageSizeOptions: [10, 20, 50],
      }}
      extraContent={extraContent}
    />
  )
}
