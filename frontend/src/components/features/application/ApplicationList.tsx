import { AppPagination, EmptyState, SearchInput, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  APPLICATION_STATUS,
  APPLICATION_TYPES,
  APPLICATION_TYPE_LABELS,
} from "@/config/entities/attendance.config"
import { cn } from "@/lib/utils"
import { useAllApplications } from "@/hooks/application/useAllApplications"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplicationListItem } from "@/lib/api/application.api"

import { useEffect, useState } from "react"
import { FileText, RotateCcw } from "lucide-react"

type StatusVariant = "success" | "warning" | "danger" | "neutral"

const STATUS_LABELS: Record<string, { label: string; variant: StatusVariant } | undefined> = {
  [APPLICATION_STATUS.PENDING]: {
    label: "Đang duyệt",
    variant: "warning",
  },
  [APPLICATION_STATUS.PARTNER_PENDING]: {
    label: "Chờ xác nhận đổi ca",
    variant: "warning",
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: "Đã duyệt",
    variant: "success",
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: "Không duyệt",
    variant: "danger",
  },
  [APPLICATION_STATUS.CANCELLED]: {
    label: "Đã hủy",
    variant: "neutral",
  },
}

interface ApplicationListProps {
  mode: "mine" | "manage" | "all"
  onRowClick: (app: IApplicationListItem) => void
  hookState:
    | ReturnType<typeof useMyApplications>
    | ReturnType<typeof useManageApplications>
    | ReturnType<typeof useAllApplications>
}

/**
 * Standardized ApplicationList component.
 * Features 400ms debounced search, integer-aligned table cells, and pinned pagination.
 */
export function ApplicationList({ mode, onRowClick, hookState }: ApplicationListProps) {
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

  /** Hides stale rows while a new list query is being requested. */
  const beginTransition = () => {
    setIsTransitionLoading(true)
  }

  const STATUS_TABS = [
    { value: "all", label: "Tất cả", count: stats.total },
    { value: "pending", label: "Chờ duyệt", count: stats.pending },
    { value: "approved", label: "Đã duyệt", count: stats.approved },
    { value: "rejected", label: "Không duyệt", count: stats.rejected },
  ] as const

  const thClass = "h-10 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-middle select-none whitespace-nowrap"
  const tdClass = "h-[60px] px-4 py-2.5 text-sm align-middle"

  return (
    <div className="flex w-full flex-col animate-in fade-in duration-300">
      {/* Top Tabs */}
      {mode !== "manage" && (
        <nav className="flex items-center gap-1 border-b border-border bg-card px-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 relative">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  beginTransition()
                  setStatusFilter(
                    tab.value as "all" | "pending" | "approved" | "rejected" | "cancelled",
                  )
                  setPage(1)
                }}
                className={cn(
                  "relative flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 transition-colors whitespace-nowrap cursor-pointer",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full h-5 min-w-5 px-2 flex items-center justify-center text-xs font-semibold border leading-none",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* Filters and Actions Toolbar */}
      {mode !== "manage" && (
        <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3 sm:flex-row sm:items-center justify-between bg-card shrink-0">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput
              value={keyword}
              onSearch={(val) => {
                beginTransition()
                setKeyword(val)
                setPage(1)
              }}
              onClear={() => {
                beginTransition()
                setKeyword("")
                setPage(1)
              }}
              placeholder="Tìm theo tên, người duyệt hoặc mã…"
              className="w-full sm:max-w-xs"
            />

            <div className="min-w-[180px]">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  beginTransition()
                  setTypeFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" aria-label="Lọc theo loại đơn" className="bg-background border-border shadow-none rounded-full">
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
              size="sm"
              onClick={() => {
                beginTransition()
                setKeyword("")
                setTypeFilter("all")
                setPage(1)
              }}
              className="gap-1.5 rounded-full"
            >
              <RotateCcw className="size-3.5" />
              Đặt lại
            </Button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="relative flex-1 min-h-0 overflow-auto overscroll-contain app-scrollbar">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead className="bg-card">
            <tr>
              <th className={cn(thClass, "border-b border-border bg-card")}>Mã đơn</th>
              {(mode === "manage" || mode === "all") && (
                <th className={cn(thClass, "border-b border-border bg-card")}>Họ và tên</th>
              )}
              {(mode === "manage" || mode === "all") && (
                <th className={cn(thClass, "border-b border-border bg-card")}>Mã nhân sự</th>
              )}
              <th className={cn(thClass, "border-b border-border bg-card")}>Loại đơn</th>
              <th className={cn(thClass, "border-b border-border bg-card")}>Trạng thái</th>
              <th className={cn(thClass, "border-b border-border bg-card")}>Ngày tạo</th>
              <th className={cn(thClass, "border-b border-border bg-card")}>Người tạo</th>
              <th className={cn(thClass, "border-b border-border bg-card")}>Người duyệt</th>
            </tr>
          </thead>
          <tbody>
            {showLoading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`} className="border-b border-border">
                  {Array.from({ length: mode === "manage" || mode === "all" ? 8 : 6 }).map((_, cIdx) => (
                    <td key={`loading-cell-${cIdx}`} className={cn(tdClass, "border-b border-border")}>
                      <Skeleton className="h-4 w-4/5 rounded-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td
                  colSpan={mode === "manage" || mode === "all" ? 8 : 6}
                  className="py-12 px-4 text-center border-b border-border"
                >
                  <EmptyState
                    icon={FileText}
                    title="Không tìm thấy đơn phù hợp"
                    description="Không có đơn từ nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                  />
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => {
                    onRowClick(app)
                  }}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onRowClick(app)
                  }}
                  className="group hover:bg-muted/25 transition-colors cursor-pointer border-b border-border"
                >
                  <td className={cn(tdClass, "border-b border-border font-medium text-foreground")}>
                    {app.id.substring(0, 8).toUpperCase()}
                  </td>
                  {(mode === "manage" || mode === "all") && (
                    <td className={cn(tdClass, "border-b border-border font-medium text-foreground whitespace-nowrap")}>
                      {app.employee?.fullName || "N/A"}
                    </td>
                  )}
                  {(mode === "manage" || mode === "all") && (
                    <td className={cn(tdClass, "border-b border-border text-primary font-medium group-hover:underline")}>
                      {app.employeeId.substring(0, 10)}
                    </td>
                  )}
                  <td className={cn(tdClass, "border-b border-border text-foreground font-medium")}>
                    {APPLICATION_TYPE_LABELS[app.type] || app.type}
                  </td>
                  <td className={cn(tdClass, "border-b border-border")}>
                    <StatusPill
                      label={STATUS_LABELS[app.status]?.label || app.status}
                      variant={STATUS_LABELS[app.status]?.variant || "neutral"}
                    />
                  </td>
                  <td className={cn(tdClass, "border-b border-border text-muted-foreground whitespace-nowrap")}>
                    {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className={cn(tdClass, "border-b border-border")}>
                    <div className="flex flex-col">
                      <span className="text-primary font-medium">
                        {app.employeeId.substring(0, 10)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {app.employee?.fullName || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className={cn(tdClass, "border-b border-border text-muted-foreground")}>
                    {app.approvedBy?.fullName || app.assignedTo?.fullName || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      {!showLoading && applications.length > 0 && (
        <div className="shrink-0 border-t border-border bg-card">
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={(nextPage) => {
              beginTransition()
              setPage(nextPage)
            }}
            onItemsPerPageChange={(nextPageSize) => {
              if (![10, 20, 50].includes(nextPageSize)) return
              beginTransition()
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
