import { DataTablePage } from "@/components/common"
import { CreateRequisitionDialog } from "@/components/features/recruitment/CreateRequisitionDialog"
import { RequisitionDetailsDrawer } from "@/components/features/recruitment/RequisitionDetailsDrawer"
import { RequisitionsPriorityFilter } from "@/components/features/recruitment/RequisitionsPriorityFilter"
import { useRequisitionsColumns } from "@/components/features/recruitment/use-requisitions-columns"
import { useRequisitionsManagement } from "@/hooks/recruitment/use-requisitions-management"
import type { JobRequisition } from "@/types/recruitment.types"

import { useMemo } from "react"

import { FileSearch, Plus } from "lucide-react"

/**
 * Tier 2 Page Orchestrator for Job Requisitions.
 * Coordinates list filtering, priority queries, detail drawers, and create dialogs.
 */
export default function RequisitionsPage() {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    keyword,
    priorityFilter,
    hasActiveFilters,
    isLoading,
    totalItems,
    totalPages,
    paginatedRequisitions,
    tabsConfig,
    hasPermission,
    employeeId,
    isCreateOpen,
    isEditOpen,
    selectedRequisition,
    viewingRequisitionId,
    handleSearch,
    handlePriorityChange,
    handleResetFilters,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleViewDetails,
    handleCloseDrawer,
  } = useRequisitionsManagement()

  const columns = useMemo(
    () =>
      useRequisitionsColumns({
        hasPermission,
        employeeId,
        onViewDetails: handleViewDetails,
        onEdit: handleOpenEdit,
      }),
    [hasPermission, employeeId, handleViewDetails, handleOpenEdit],
  )

  return (
    <>
      <DataTablePage<JobRequisition>
        title="Yêu cầu tuyển dụng"
        description="Theo dõi nhu cầu tuyển dụng, người duyệt và tiến độ mở vị trí."
        variant="viewport"
        data={paginatedRequisitions}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(req) => req.id}
        search={{
          value: keyword,
          onSearch: handleSearch,
          placeholder: "Tìm theo mã, vị trí, phòng ban, người duyệt...",
        }}
        filters={
          <RequisitionsPriorityFilter
            priorityFilter={priorityFilter}
            hasActiveFilters={hasActiveFilters}
            onPriorityChange={handlePriorityChange}
            onResetFilters={handleResetFilters}
          />
        }
        primaryAction={
          hasPermission("recruitment.create")
            ? {
                label: "Tạo yêu cầu mới",
                icon: Plus,
                onClick: handleOpenCreate,
              }
            : undefined
        }
        emptyState={{
          icon: FileSearch,
          title: hasActiveFilters
            ? "Không tìm thấy yêu cầu phù hợp"
            : "Chưa có yêu cầu tuyển dụng nào",
          description: hasActiveFilters
            ? "Không có yêu cầu tuyển dụng nào khớp với bộ lọc hoặc từ khóa tìm kiếm."
            : "Hiện tại chưa có yêu cầu tuyển dụng nào được tạo. Hãy bấm 'Tạo yêu cầu mới' để bắt đầu.",
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (value) => {
            setPageSize(value)
            setPage(1)
          },
        }}
      />

      <CreateRequisitionDialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={handleCloseModal}
        requisition={selectedRequisition}
      />

      <RequisitionDetailsDrawer
        requisitionId={viewingRequisitionId}
        onClose={handleCloseDrawer}
        onEdit={handleOpenEdit}
      />
    </>
  )
}
