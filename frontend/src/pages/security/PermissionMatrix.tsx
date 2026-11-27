import { DataTablePage } from "@/components/common"
import { PermissionMatrixStatsCards } from "@/components/features/security/PermissionMatrixStatsCards"
import { PermissionMatrixToolbarActions } from "@/components/features/security/PermissionMatrixToolbarActions"
import { usePermissionMatrixColumns } from "@/components/features/security/use-permission-matrix-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { usePermissionMatrix } from "@/hooks/security/use-permission-matrix"
import type { RouteManifestEntry } from "@/types/system/route.types"

/**
 * PermissionMatrix page component.
 * Pure orchestrator displaying system route access manifests and required permissions.
 */
export default function PermissionMatrix() {
  const {
    loading,
    search,
    methodFilter,
    sortBy,
    currentPage,
    pageSize,
    stats,
    paginatedData,
    totalItems,
    totalPages,
    handleSearch,
    handleClearSearch,
    handleSortChange,
    handleMethodChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePermissionMatrix()

  const columns = usePermissionMatrixColumns()

  return (
    <DataTablePage<RouteManifestEntry>
      title="Cấu trúc Phân quyền"
      description="Danh sách các API endpoints của hệ thống và quyền cần có để truy cập (Single Source of Truth)."
      subHeader={<PermissionMatrixStatsCards stats={stats} />}
      search={{
        value: search,
        placeholder: "Tìm kiếm API, đường dẫn...",
        onSearch: handleSearch,
        onClear: handleClearSearch,
      }}
      toolbarActions={
        <PermissionMatrixToolbarActions
          sortBy={sortBy}
          onSortChange={handleSortChange}
          methodFilter={methodFilter}
          onMethodChange={handleMethodChange}
        />
      }
      columns={columns}
      data={paginatedData}
      keyExtractor={(row, index) => `${row.method}-${row.path}-${index}`}
      isLoading={loading}
      emptyState={{
        title: "Không tìm thấy API nào",
        description:
          "Không có route nào khớp với từ khóa tìm kiếm hoặc bộ lọc phương thức hiện tại.",
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: handlePageChange,
        onItemsPerPageChange: handlePageSizeChange,
        pageSizeOptions: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS as unknown as number[],
      }}
    />
  )
}
