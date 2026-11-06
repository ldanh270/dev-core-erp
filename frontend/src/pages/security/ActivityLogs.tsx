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
      <PageContainer variant="default">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu nhật ký...</p>
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
            Không thể tải nhật ký hoạt động. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4 rounded-full text-xs font-semibold" onClick={() => { refetch(); }}>
            Thử lại
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Truy vết toàn bộ hoạt động bảo mật và thay đổi dữ liệu trong hệ thống."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetch(); }}
            className="gap-1.5 rounded-full text-xs font-semibold"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      <PageCard className="overflow-hidden" padding="sm">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                size="sm"
                placeholder="Tìm theo ID nhân viên..."
                className="pl-8 bg-background border-border/80 focus:border-primary rounded-full"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select
                value={query.category || "all"}
                onValueChange={(val) => {
                  handleFilterChange("category", val === "all" ? undefined : val)
                }}
              >
                <SelectTrigger size="sm" className="w-[170px] bg-background border-border/80 font-semibold rounded-full">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="role">Vai trò</SelectItem>
                  <SelectItem value="permission">Quyền hạn</SelectItem>
                  <SelectItem value="employee">Nhân sự</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {query.actionType && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 h-9 rounded-full text-xs font-semibold border border-primary/20">
                Hành động: {query.actionType}
                <button
                  onClick={() => { handleFilterChange("actionType", undefined); }}
                  className="hover:bg-primary hover:text-white rounded-full p-0.5 transition-colors flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Lọc theo ngày:</span>
            <DateRangePicker
              startDate={query.fromDate || null}
              endDate={query.toDate || null}
              onChange={({ startDate, endDate }) => {
                handleFilterChange("fromDate", startDate || undefined);
                handleFilterChange("toDate", endDate || undefined);
              }}
              size="sm"
              placeholder="Chọn khoảng ngày..."
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <ActivityLogsTable logs={data.data} onViewDetail={setViewingLogId} />

        {data && data.meta.total > 0 && (
          <div className="border-t border-border">
            <AppPagination
              currentPage={query.page || 1}
              totalPages={totalPages}
              onPageChange={(p) => { setQuery((prev) => ({ ...prev, page: p })); }}
              totalItems={data.meta.total}
              itemsPerPage={query.limit || 20}
              onItemsPerPageChange={(limit) => { setQuery((prev) => ({ ...prev, limit, page: 1 })); }}
            />
          </div>
        )}
      </PageCard>

      {/* Detail Drawer */}
      <ActivityLogDetailDrawer
        logId={viewingLogId}
        onClose={() => { setViewingLogId(null); }}
      />
    </PageContainer>
  )
}
