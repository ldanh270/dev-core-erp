import { DataTablePage } from "@/components/common"
import { PayslipDetailPage } from "@/components/features/payroll/PayslipDetailPage"
import { useMyPayslipsColumns } from "@/components/features/payroll/use-my-payslips-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useMyPayslipsManagement } from "@/hooks/payroll/use-my-payslips-management"
import type { IPayslip } from "@/types/payroll.types"

import { Inbox } from "lucide-react"

/**
 * Displays the employee’s payslips and opens the one referenced by a notification.
 * @returns {import("react").ReactElement} The payroll screen.
 */
export default function MyPayslips() {
  const {
    view,
    selectedPayslip,
    searchTerm,
    page,
    limit,
    isLoading,
    paginatedPayslips,
    totalItems,
    totalPages,
    handleCloseDetail,
    handleSelectPayslip,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  } = useMyPayslipsManagement()

  const columns = useMyPayslipsColumns({
    page,
    limit,
    onSelectPayslip: handleSelectPayslip,
  })

  if (view !== "list") {
    return <PayslipDetailPage payslip={selectedPayslip} onClose={handleCloseDetail} />
  }

  return (
    <DataTablePage<IPayslip>
      title="Lương của tôi"
      description="Xem trước lương sắp nhận, lịch sử và chi tiết các phiếu lương của bạn."
      variant="viewport"
      data={paginatedPayslips}
      columns={columns}
      isLoading={isLoading}
      keyExtractor={(payslip) => payslip.id}
      search={{
        value: searchTerm,
        debounceMs: SYSTEM_CONFIG.SEARCH.DEBOUNCE_MS,
        onSearch: handleSearch,
        placeholder: "Tìm kiếm theo tháng/năm, trạng thái...",
      }}
      emptyState={{
        icon: Inbox,
        title: searchTerm.trim() ? "Không tìm thấy phiếu lương" : "Bạn chưa có phiếu lương nào",
        description: searchTerm.trim()
          ? `Không có phiếu lương nào phù hợp với từ khóa "${searchTerm}".`
          : "Khi hệ thống tạo và gửi phiếu lương hàng tháng, bạn sẽ theo dõi được tại đây.",
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
  )
}
