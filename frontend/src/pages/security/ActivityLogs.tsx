import { DataTablePage } from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import {
  ActivityLogsCategoryFilter,
  ActivityLogsDateRangeToolbar,
  ActivityLogsHeaderActions,
} from "@/components/features/security/ActivityLogsFilters"
import { useActivityLogsColumns } from "@/components/features/security/use-activity-logs-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useActivityLogsMaster } from "@/hooks/security/use-activity-logs-master"
import type { ActivityLogItem } from "@/types/security.types"

/**
 * Standardized ActivityLogs component powered by DataTablePage master component.
 * Integrates internal viewport scrolling, debounced search, responsive filters, and pinned pagination.
 */
export default function ActivityLogs() {
  const {
    query,
    setQuery,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
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

  const columns = useActivityLogsColumns(setViewingLogId)

  return (
    <DataTablePage<ActivityLogItem>
      title="Nhật ký hoạt động"
      description="Truy vết toàn bộ hoạt động bảo mật và thay đổi dữ liệu trong hệ thống."
      headerActions={
        <ActivityLogsHeaderActions
          isFetching={isFetching}
          onRefresh={() => {
            void refetch()
          }}
        />
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
        <ActivityLogsCategoryFilter
          category={query.category || "ALL"}
          onCategoryChange={(val) => {
            handleFilterChange("category", val)
          }}
        />
      }
      toolbarActions={
        <ActivityLogsDateRangeToolbar
          fromDate={query.fromDate}
          toDate={query.toDate}
          onDateRangeChange={({ startDate, endDate }) => {
            handleFilterChange("fromDate", startDate)
            handleFilterChange("toDate", endDate)
          }}
        />
      }
      columns={columns}
      data={data?.data || []}
      isLoading={isLoading}
      emptyState={{
        title: "Không có bản ghi nhật ký",
        description: "Không tìm thấy nhật ký hoạt động nào trong khoảng thời gian này.",
      }}
      onResetFilters={() => {
        handleSearch("")
        handleFilterChange("category", "ALL")
        handleFilterChange("fromDate", undefined)
        handleFilterChange("toDate", undefined)
      }}
      pagination={{
        currentPage,
        totalPages: totalPages || 1,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: (p) => {
          setQuery((prev) => ({ ...prev, page: p }))
        },
        onItemsPerPageChange: (limit) => {
          setQuery((prev) => ({ ...prev, limit, page: 1 }))
        },
        pageSizeOptions: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS as unknown as number[],
      }}
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

