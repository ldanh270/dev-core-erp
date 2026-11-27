import { DataTablePage } from "@/components/common"
import { SalaryComponentFormPage } from "@/components/features/payroll/SalaryComponentFormPage"
import { useSalaryComponentsColumns } from "@/components/features/payroll/use-salary-components-columns"
import { useSalaryComponentsManagement } from "@/hooks/payroll/use-salary-components-management"
import type { ISalaryComponent } from "@/types/payroll.types"

import { Inbox, Plus } from "lucide-react"

/**
 * SalaryComponents — Standardized salary components management page.
 * Thin declarative composition shell powered by DataTablePage, useSalaryComponentsManagement, and useSalaryComponentsColumns.
 */
export default function SalaryComponents() {
  const {
    components,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    view,
    selectedComponent,
    handleCreate,
    handleEdit,
    handleCloseForm,
    handleSearch,
  } = useSalaryComponentsManagement()

  const columns = useSalaryComponentsColumns({
    currentPage,
    pageSize,
    onEdit: handleEdit,
  })

  if (view === "create" || view === "edit") {
    return (
      <SalaryComponentFormPage
        initialData={selectedComponent}
        onSuccess={handleCloseForm}
        onCancel={handleCloseForm}
      />
    )
  }

  return (
    <DataTablePage<ISalaryComponent>
      title="Thành phần lương"
      description="Quản lý danh mục các khoản phụ cấp, giảm trừ và công thức lương"
      density="compact"
      primaryAction={{
        label: "Thêm thành phần",
        icon: Plus,
        onClick: handleCreate,
      }}
      search={{
        placeholder: "Tìm theo tên hoặc công thức...",
        onSearch: handleSearch,
      }}
      columns={columns}
      data={components}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      emptyState={{
        icon: Inbox,
        title: "Chưa có thành phần lương nào",
        description: "Thêm thành phần đầu tiên để bắt đầu xây dựng mẫu phiếu lương.",
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: setPageSize,
      }}
    />
  )
}
