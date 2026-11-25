import { DataTablePage } from "@/components/common"
import { CreateRequisitionDialog } from "@/components/features/recruitment/CreateRequisitionDialog"
import { RequisitionDetailsDrawer } from "@/components/features/recruitment/requisition-details-drawer"
import { getRequisitionsColumns } from "@/components/features/recruitment/requisitions-columns"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REQUISITION_PRIORITY } from "@/config/entities/recruitment.config"
import { useRequisitionsManagement } from "@/hooks/recruitment/use-requisitions-management"
import type { JobRequisition } from "@/types/recruitment.types"
import { FileSearch, Filter, Plus, RotateCcw } from "lucide-react"
import { useMemo } from "react"

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
      getRequisitionsColumns({
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
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <Select value={priorityFilter} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-[150px] text-sm font-semibold bg-background rounded-full">
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ưu tiên</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.URGENT}>Khẩn cấp</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.HIGH}>Cao</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.MEDIUM}>Trung bình</SelectItem>
                <SelectItem value={REQUISITION_PRIORITY.LOW}>Thấp</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-10 px-4 text-sm font-semibold gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Xóa lọc
              </Button>
            )}
          </div>
        }
        primaryAction={
          hasPermission("recruitment.create") ? (
            <Button onClick={handleOpenCreate} className="rounded-full font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Tạo yêu cầu mới
            </Button>
          ) : undefined
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
