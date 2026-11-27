import { DataTablePage } from "@/components/common"
import EmployeePayslipHistoryDialog from "@/components/features/payroll/EmployeePayslipHistoryDialog"
import EmployeeSalaryConfigDialog from "@/components/features/payroll/EmployeeSalaryConfigDialog"
import { useEmployeeSalaryColumns } from "@/components/features/payroll/use-employee-salary-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployeeSalaryManagement } from "@/hooks/payroll/use-employee-salary-management"
import type { Employee } from "@/types/employee.types"

import { Inbox } from "lucide-react"

/**
 * EmployeeSalary — Enterprise employee salary and template assignment page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function EmployeeSalary() {
  const {
    page,
    limit,
    searchQuery,
    employees,
    totalItems,
    totalPages,
    isEmployeesLoading,
    templates,
    configDialogOpen,
    setConfigDialogOpen,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedEmployee,
    handleOpenConfigDialog,
    handleOpenHistoryDialog,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  } = useEmployeeSalaryManagement()

  const columns = useEmployeeSalaryColumns({
    page,
    limit,
    templates,
    onOpenConfigDialog: handleOpenConfigDialog,
    onOpenHistoryDialog: handleOpenHistoryDialog,
  })

  return (
    <>
      <DataTablePage<Employee>
        title="Lương nhân sự"
        description="Quản lý cấu hình mức lương cơ bản và mẫu phiếu lương của nhân viên."
        variant="viewport"
        data={employees}
        columns={columns}
        isLoading={isEmployeesLoading}
        keyExtractor={(emp) => emp.id}
        search={{
          value: searchQuery,
          debounceMs: SYSTEM_CONFIG.SEARCH.DEBOUNCE_MS,
          onSearch: handleSearch,
          placeholder: "Tìm kiếm nhân viên...",
        }}
        emptyState={{
          icon: Inbox,
          title: searchQuery.trim()
            ? "Không tìm thấy nhân viên"
            : "Chưa có dữ liệu lương nhân viên",
          description: searchQuery.trim()
            ? `Không có nhân viên nào khớp với từ khóa "${searchQuery}".`
            : "Chưa có nhân viên nào được thiết lập cấu hình lương.",
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

      <EmployeeSalaryConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        employee={selectedEmployee}
      />

      <EmployeePayslipHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        employee={selectedEmployee}
      />
    </>
  )
}
