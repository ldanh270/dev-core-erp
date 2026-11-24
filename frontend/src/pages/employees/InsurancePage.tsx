import { DataTablePage } from "@/components/common"
import { useInsuranceColumns } from "@/components/features/employees/insurance-columns"
import { useInsuranceManagement } from "@/hooks/employees/use-insurance-management"
import type { Employee } from "@/types/employee.types"
import { Plus } from "lucide-react"

/**
 * Standardized Social & Health Insurance management page.
 * Thin declarative composition shell powered by DataTablePage and useInsuranceManagement hook.
 */
export default function InsurancePage() {
  const {
    employees,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    searchTerm,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  } = useInsuranceManagement()

  const columns = useInsuranceColumns()

  return (
    <DataTablePage<Employee>
      title="Bảo hiểm xã hội & Y tế"
      description="Quản lý thông tin số sổ BHXH, thẻ BHYT và mức lương đóng bảo hiểm"
      density="compact"
      primaryAction={{
        label: "Cập nhật dữ liệu BH",
        icon: Plus,
        onClick: () => {
          // Placeholder for batch update modal
        },
      }}
      search={{
        placeholder: "Tìm theo tên, username, CCCD...",
        value: searchTerm,
        onSearch: handleSearch,
      }}
      columns={columns}
      data={employees}
      keyExtractor={(employee) => employee.id}
      isLoading={isLoading}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: handlePageChange,
        onItemsPerPageChange: handleLimitChange,
      }}
    />
  )
}
