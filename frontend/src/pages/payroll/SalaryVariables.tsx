import { DataTablePage, useConfirm } from "@/components/common"
import { SalaryVariableFormPage } from "@/components/features/payroll/SalaryVariableFormPage"
import { useSalaryVariablesColumns } from "@/components/features/payroll/use-salary-variables-columns"
import {
  type VariableRow,
  useSalaryVariablesManagement,
} from "@/hooks/payroll/use-salary-variables-management"

import { Inbox, Plus } from "lucide-react"

/**
 * SalaryVariables — Standardized salary calculation variables management page.
 * Thin declarative composition shell powered by DataTablePage, useSalaryVariablesManagement, and useSalaryVariablesColumns.
 */
export default function SalaryVariables() {
  const confirm = useConfirm()
  const {
    variables,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    view,
    selectedVariable,
    systemCount,
    customCount,
    totalCount,
    deleteMutation,
    handleCreate,
    handleEdit,
    handleCloseForm,
    handleSearch,
  } = useSalaryVariablesManagement()

  const columns = useSalaryVariablesColumns({
    currentPage,
    pageSize,
    confirm,
    onEdit: handleEdit,
    onDelete: (id) => deleteMutation.mutate(id),
    isDeleting: deleteMutation.isPending,
  })

  if (view === "create" || view === "edit") {
    return (
      <SalaryVariableFormPage
        initialData={selectedVariable}
        onSuccess={handleCloseForm}
        onCancel={handleCloseForm}
      />
    )
  }

  return (
    <DataTablePage<VariableRow>
      title="Biến số tính lương"
      description="Quản lý các biến số hệ thống và biến số tùy chỉnh dùng trong công thức phiếu lương"
      density="compact"
      primaryAction={{
        label: "Thêm biến số",
        icon: Plus,
        onClick: handleCreate,
      }}
      tabs={{
        items: [
          { id: "all", label: "Tất cả", count: totalCount },
          { id: "system", label: "Hệ thống", count: systemCount },
          { id: "custom", label: "Tùy chỉnh", count: customCount },
        ],
        activeTab,
        onTabChange: setActiveTab,
      }}
      search={{
        placeholder: "Tìm theo tên, mã biến...",
        onSearch: handleSearch,
      }}
      columns={columns}
      data={variables}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      emptyState={{
        icon: Inbox,
        title: "Chưa có biến số nào",
        description: "Tạo biến số tùy chỉnh đầu tiên để sử dụng trong các công thức tính lương.",
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
