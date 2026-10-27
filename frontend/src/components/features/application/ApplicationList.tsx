import { AppPagination, EmptyState, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAllApplications } from "@/hooks/application/useAllApplications"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import type { IApplicationListItem } from "@/lib/api/application.api"

import { useEffect, useState } from "react"

import { FileText, Filter, RotateCcw, Search } from "lucide-react"

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

/** Renders the filterable and paginated application table for the selected route scope. */
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

  const [localKeyword, setLocalKeyword] = useState(keyword)
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

  return (
    <div className="flex w-full flex-col animate-in fade-in duration-300">
      <>
        {/* Top Tabs */}
        {mode !== "manage" && (
          <div className="flex items-center gap-6 overflow-x-auto border-b border-border px-6">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    beginTransition()
                    setStatusFilter(
                      tab.value as "all" | "pending" | "approved" | "rejected" | "cancelled",
                    )
                    setPage(1)
                  }}
                  className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Filters and Actions */}
        {mode !== "manage" && (
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center bg-muted/20">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-sm">
                <Input
                  type="text"
                  value={localKeyword}
                  onChange={(e) => {
                    setLocalKeyword(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      beginTransition()
                      setKeyword(localKeyword)
                      setPage(1)
                    }
                  }}
                  name="applicationSearch"
                  autoComplete="off"
                  placeholder="Tìm theo tên, người duyệt hoặc mã…"
                  aria-label="Tìm kiếm đơn"
                  className="h-9 pl-9 pr-4 text-xs bg-background shadow-none border-border rounded-full"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="min-w-[180px]">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    beginTransition()
                    setTypeFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger aria-label="Lọc theo loại đơn" className="h-9 bg-background px-4 text-xs border-border shadow-none rounded-full">
                    <SelectValue placeholder="Loại đơn" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Loại đơn</SelectItem>
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
                  setLocalKeyword("")
                  setKeyword("")
                  setTypeFilter("all")
                  setPage(1)
                }}
                className="h-9 px-4 text-xs rounded-full"
              >
                <RotateCcw className="size-3.5" />
                Đặt lại
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  beginTransition()
                  setKeyword(localKeyword)
                  setPage(1)
                }}
                className="h-9 px-5 text-xs rounded-full font-semibold"
              >
                <Filter className="size-3.5" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        )}
      </>

      {/* Table Area */}
      <div className="flex flex-col bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="sticky top-0 z-10 whitespace-nowrap border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-4 w-[15%]">Mã đơn</th>
                {(mode === "manage" || mode === "all") && (
                  <th className="px-4 py-4 w-[15%]">Họ và tên</th>
                )}
                {(mode === "manage" || mode === "all") && (
                  <th className="px-4 py-4 w-[10%]">Mã nhân sự</th>
                )}
                <th className="px-4 py-4 w-[15%]">Loại đơn</th>
                <th className="px-4 py-4 w-[10%]">Trạng thái</th>
                <th className="px-4 py-4 w-[10%]">Ngày tạo</th>
                <th className="px-4 py-4 w-[15%]">Người tạo</th>
                <th className="px-4 py-4 w-[15%]">Người duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {showLoading ? (
                <tr>
                  <td colSpan={mode === "manage" || mode === "all" ? 8 : 6} className="p-5">
                    <div className="space-y-3" aria-label="Đang tải dữ liệu">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={mode === "manage" || mode === "all" ? 8 : 6}
                    className="p-8"
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
                    className="h-16 cursor-pointer group transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                  >
                    <td className="px-4 py-4 text-foreground font-medium">
                      {app.id.substring(0, 8).toUpperCase()}
                    </td>
                    {(mode === "manage" || mode === "all") && (
                      <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                        {app.employee?.fullName || "N/A"}
                      </td>
                    )}
                    {(mode === "manage" || mode === "all") && (
                      <td className="px-4 py-4 text-primary font-medium group-hover:underline">
                        {app.employeeId.substring(0, 10)}
                      </td>
                    )}
                    <td className="px-4 py-4 text-foreground font-medium">
                      {APPLICATION_TYPE_LABELS[app.type] || app.type}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-start">
                        <StatusPill
                          label={STATUS_LABELS[app.status]?.label || app.status}
                          variant={STATUS_LABELS[app.status]?.variant || "neutral"}
                          className="px-3 py-1 text-[11px]"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-primary font-medium">
                          {app.employeeId.substring(0, 10)}
                        </span>
                        <span className="text-muted-foreground text-[11px] mt-0.5">
                          {app.employee?.fullName || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {app.approvedBy?.fullName || app.assignedTo?.fullName || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {!showLoading && applications.length > 0 && (
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
        )}
      </div>
    </div>
  )
}
