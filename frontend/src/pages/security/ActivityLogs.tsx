import { AppPagination, DateRangePicker, PageCard, PageContainer, PageHeader } from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import { ActivityLogsTable } from "@/components/features/security/ActivityLogsTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useActivityLogsMaster } from "@/hooks/security/use-activity-logs-master"
import { cn } from "@/lib/utils"

import {
  AlertTriangle,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

/**
 * ActivityLogs Component.
 * Renders a full audit trail of system activities with filtering and detail view.
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
    isError,
    refetch,
  } = useActivityLogsMaster()

  const totalPages = data?.meta.totalPages ?? 0

  if (isLoading) {
    return (
      <PageContainer variant="table">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu nhật ký...</p>
        </div>
      </PageContainer>
    )
  }

  if (isError || !data) {
    return (
      <PageContainer variant="table">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải nhật ký hoạt động. Vui lòng thử lại sau.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full text-xs font-semibold"
            onClick={() => {
              refetch()
            }}
          >
            Thử lại
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="table">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Truy vết toàn bộ hoạt động bảo mật và thay đổi dữ liệu trong hệ thống."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              refetch()
            }}
            className="gap-1.5 rounded-full text-sm font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      <PageCard className="overflow-hidden p-0 flex-1 min-h-0 flex flex-col" padding="none">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm theo ID nhân viên..."
                className="pl-10 bg-background border-border/80 focus:border-primary rounded-full text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    handleSearch("")
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={query.category || "ALL"}
                onValueChange={(val) => {
                  handleFilterChange("category", val)
                }}
              >
                <SelectTrigger className="w-[150px] rounded-full text-sm font-semibold bg-background">
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
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Lọc theo ngày:</span>
            <DateRangePicker
              startDate={query.fromDate || null}
              endDate={query.toDate || null}
              onChange={({ startDate, endDate }) => {
                handleFilterChange("fromDate", startDate || undefined)
                handleFilterChange("toDate", endDate || undefined)
              }}
              size="default"
              placeholder="Chọn khoảng ngày..."
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <ActivityLogsTable logs={data.data} onViewDetail={setViewingLogId} />

        {data && data.meta.total > 0 && (
          <div className="border-t border-border bg-card shrink-0">
            <AppPagination
              currentPage={query.page || 1}
              totalPages={totalPages}
              onPageChange={(p) => {
                setQuery((prev) => ({ ...prev, page: p }))
              }}
              totalItems={data.meta.total}
              itemsPerPage={query.limit || 20}
              onItemsPerPageChange={(limit) => {
                setQuery((prev) => ({ ...prev, limit, page: 1 }))
              }}
            />
          </div>
        )}
      </PageCard>

      {/* Detail Drawer */}
      <ActivityLogDetailDrawer
        logId={viewingLogId}
        onClose={() => {
          setViewingLogId(null)
        }}
      />
    </PageContainer>
  )
}
