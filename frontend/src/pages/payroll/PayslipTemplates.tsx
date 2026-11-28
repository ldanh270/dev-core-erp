import { DataTablePage } from "@/components/common"
import { BulkAssignPayslipTemplateDialog } from "@/components/features/payroll/BulkAssignPayslipTemplateDialog"
import { CreatePayslipTemplateForm } from "@/components/features/payroll/CreatePayslipTemplateForm"
import { DeletePayslipTemplateDialog } from "@/components/features/payroll/DeletePayslipTemplateDialog"
import { usePayslipTemplatesColumns } from "@/components/features/payroll/use-payslip-templates-columns"
import { FORM_VIEW_MODE } from "@/config/entities/payroll.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { usePayslipTemplatesManagement } from "@/hooks/payroll/use-payslip-templates-management"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { Inbox, Plus } from "lucide-react"

/**
 * PayslipTemplates — Standardized payslip template management page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function PayslipTemplates() {
  const {
    view,
    setView,
    selectedTemplate,
    templateToDelete,
    setTemplateToDelete,
    templateToAssign,
    setTemplateToAssign,
    searchTerm,
    page,
    limit,
    isLoading,
    isDeleting,
    paginatedTemplates,
    totalItems,
    totalPages,
    handleDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseForm,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  } = usePayslipTemplatesManagement()

  const columns = usePayslipTemplatesColumns({
    page,
    limit,
    onOpenView: handleOpenView,
    onOpenEdit: handleOpenEdit,
    onAssign: setTemplateToAssign,
    onDelete: setTemplateToDelete,
  })

  if (view !== FORM_VIEW_MODE.LIST) {
    return (
      <CreatePayslipTemplateForm
        initialData={selectedTemplate}
        isReadOnly={view === FORM_VIEW_MODE.VIEW}
        onSuccess={handleCloseForm}
        onCancel={handleCloseForm}
        onEdit={() => {
          if (selectedTemplate) {
            setView(FORM_VIEW_MODE.EDIT)
          }
        }}
      />
    )
  }

  return (
    <>
      <DataTablePage<IPayslipTemplate>
        title="Mẫu phiếu lương"
        description="Quản lý mẫu phiếu lương và gán nhanh cho nhiều nhân viên."
        variant="viewport"
        data={paginatedTemplates}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(template) => template.id}
        search={{
          value: searchTerm,
          debounceMs: SYSTEM_CONFIG.SEARCH.DEBOUNCE_MS,
          onSearch: handleSearch,
          placeholder: "Tìm kiếm mã mẫu, tên mẫu...",
        }}
        primaryAction={{
          label: "Tạo mới mẫu phiếu lương",
          icon: Plus,
          onClick: handleOpenCreate,
        }}
        emptyState={{
          icon: Inbox,
          title: searchTerm.trim() ? "Không tìm thấy mẫu phiếu lương" : "Chưa có mẫu phiếu lương",
          description: searchTerm.trim()
            ? `Không có mẫu phiếu lương nào khớp với từ khóa "${searchTerm}".`
            : "Tạo mẫu phiếu lương đầu tiên để gán cho các nhân sự trong tổ chức.",
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: handlePageChange,
          onItemsPerPageChange: handleLimitChange,
          pageSizeOptions: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS as unknown as number[],
        }}
      />

      <DeletePayslipTemplateDialog
        template={templateToDelete}
        onClose={() => {
          setTemplateToDelete(null)
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {templateToAssign && (
        <BulkAssignPayslipTemplateDialog
          open={Boolean(templateToAssign)}
          onOpenChange={(open) => {
            if (!open) setTemplateToAssign(null)
          }}
          template={templateToAssign}
        />
      )}
    </>
  )
}
