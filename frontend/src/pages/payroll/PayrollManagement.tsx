import { DataTablePage } from "@/components/common"
import { GeneratePayrollModal } from "@/components/features/payroll/GeneratePayrollModal"
import { PayrollDetailSheet } from "@/components/features/payroll/PayrollDetailSheet"
import { PayrollManagementToolbarActions } from "@/components/features/payroll/PayrollManagementToolbarActions"
import { usePayrollManagementColumns } from "@/components/features/payroll/use-payroll-management-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { usePayrollManagement } from "@/hooks/payroll/use-payroll-management"
import type { IPayroll } from "@/types/payroll.types"

import { Inbox } from "lucide-react"

/**
 * PayrollManagement — Enterprise payroll cycles management page.
 * Thin declarative composition shell powered by DataTablePage, usePayrollManagement, and usePayrollManagementColumns.
 */
export default function PayrollManagement() {
  const {
    payrolls,
    rawPayrolls,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedPayrollId,
    setSelectedPayrollId,
    handleCloseDetail,
    handleExport,
    handleApprove,
    handleReject,
    handleSearch,
  } = usePayrollManagement()

  const columns = usePayrollManagementColumns({
    onSelectPayroll: setSelectedPayrollId,
    onApprove: handleApprove,
    onReject: handleReject,
  })

  return (
    <>
      <DataTablePage<IPayroll>
        title="Quản lý Bảng lương"
        description="Theo dõi và chốt kỳ lương định kỳ cho nhân sự toàn công ty"
        density="compact"
        primaryAction={<GeneratePayrollModal />}
        toolbarActions={
          <PayrollManagementToolbarActions
            onExport={handleExport}
            canExport={Boolean(rawPayrolls && rawPayrolls.length > 0)}
          />
        }
        search={{
          placeholder: "Tìm kiếm kỳ lương...",
          debounceMs: SYSTEM_CONFIG.SEARCH.DEBOUNCE_MS,
          onSearch: handleSearch,
        }}
        columns={columns}
        data={payrolls}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyState={{
          icon: Inbox,
          title: "Chưa có kỳ lương nào",
          description: "Khởi tạo bảng lương đầu tiên để bắt đầu tính toán chi trả.",
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setCurrentPage,
          onItemsPerPageChange: setPageSize,
          pageSizeOptions: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS as unknown as number[],
        }}
      />

      {selectedPayrollId && (
        <PayrollDetailSheet payrollId={selectedPayrollId} onClose={handleCloseDetail} />
      )}
    </>
  )
}
