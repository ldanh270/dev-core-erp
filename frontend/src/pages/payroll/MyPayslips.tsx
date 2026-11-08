import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { PayslipDetailPage } from "@/components/features/payroll/payslip-detail-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PAYROLL_STATUS,
  PAYROLL_STATUS_LABELS,
  PAYSLIP_RECEIPT_STATUS,
  PAYSLIP_RECEIPT_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useMyPayslips } from "@/hooks/payroll/use-my-payslips"
import { cn, formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useCallback, useMemo, useState } from "react"
import { CalendarDays, ChevronRight, Inbox } from "lucide-react"

const getPayrollStatusVariant = (status?: string): "info" | "success" | "danger" | "neutral" => {
  switch (status) {
    case PAYROLL_STATUS.APPROVED:
    case PAYROLL_STATUS.PAID:
      return "success"
    case PAYROLL_STATUS.PENDING_APPROVAL:
      return "info"
    case PAYROLL_STATUS.REJECTED:
      return "danger"
    default:
      return "neutral"
  }
}

const getReceiptStatusVariant = (receiptStatus?: string): "success" | "neutral" => {
  return receiptStatus === PAYSLIP_RECEIPT_STATUS.RECEIVED ? "success" : "neutral"
}

/**
 * MyPayslips — Employee personal payslip preview and history page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function MyPayslips() {
  const { data: payslips, isLoading } = useMyPayslips()

  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedPayslip, setSelectedPayslip] = useState<IPayslip | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const handleCloseForm = useCallback(() => {
    setView("list")
    setSelectedPayslip(null)
  }, [])

  const handleSelect = useCallback((payslip: IPayslip) => {
    setSelectedPayslip(payslip)
    setView("detail")
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredPayslips = useMemo(() => {
    if (!payslips) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return payslips
    return payslips.filter((p) => {
      const periodStr = `${p.periodMonth}/${p.periodYear}`
      const periodStrZero = `${String(p.periodMonth).padStart(2, "0")}/${p.periodYear}`
      const statusStr = p.status ? (PAYROLL_STATUS_LABELS[p.status] ?? "").toLowerCase() : ""
      return periodStr.includes(s) || periodStrZero.includes(s) || statusStr.includes(s)
    })
  }, [payslips, searchTerm])

  const paginatedPayslips = useMemo(() => {
    return filteredPayslips.slice((page - 1) * limit, page * limit)
  }, [filteredPayslips, page, limit])

  const totalPages = Math.ceil(filteredPayslips.length / limit) || 1

  const columns: DataTableColumn<IPayslip>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            {(page - 1) * limit + index + 1}
          </span>
        ),
      },
      {
        id: "period",
        header: "Kỳ lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: "220px",
        sticky: true,
        cell: (payslip) => (
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
            onClick={() => {
              handleSelect(payslip)
            }}
          >
            <div className="size-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <CalendarDays className="size-4" />
            </div>
            <div className="min-w-0">
              <div className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold text-foreground group-hover:text-primary transition-colors")}>
                Tháng {payslip.periodMonth}/{payslip.periodYear}
              </div>
              <div className={cn(TYPOGRAPHY.CELL_SECONDARY, "flex items-center gap-2 mt-0.5 text-xs")}>
                <span>Kỳ lương định kỳ</span>
                {payslip.isPreview ? (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0 shadow-none font-normal">
                    Xem trước
                  </Badge>
                ) : null}
              </div>
            </div>
          </button>
        ),
      },
      {
        id: "workingDays",
        header: "Ngày công",
        width: getTableColWidthPx("CODE"),
        minWidth: "100px",
        align: "center",
        hideBelow: "md",
        cell: (payslip) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>
            <span className="font-semibold text-foreground">{payslip.workingDays}</span> ngày
          </span>
        ),
      },
      {
        id: "overtimeMinutes",
        header: "Tăng ca",
        width: getTableColWidthPx("CODE"),
        minWidth: "100px",
        align: "center",
        hideBelow: "md",
        cell: (payslip) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>
            <span className="font-semibold text-foreground">{payslip.overtimeMinutes}</span> phút
          </span>
        ),
      },
      {
        id: "status",
        header: "Duyệt lương",
        width: getTableColWidthPx("STATUS"),
        minWidth: "140px",
        cell: (payslip) => (
          <StatusPill
            label={payslip.status ? PAYROLL_STATUS_LABELS[payslip.status] : "Không rõ"}
            variant={getPayrollStatusVariant(payslip.status)}
          />
        ),
      },
      {
        id: "receiptStatus",
        header: "Nhận lương",
        width: getTableColWidthPx("STATUS"),
        minWidth: "140px",
        cell: (payslip) => (
          <StatusPill
            label={
              payslip.receiptStatus
                ? PAYSLIP_RECEIPT_STATUS_LABELS[payslip.receiptStatus]
                : "Chưa nhận"
            }
            variant={getReceiptStatusVariant(payslip.receiptStatus)}
          />
        ),
      },
      {
        id: "netSalary",
        header: "Thực lãnh",
        width: getTableColWidthPx("CURRENCY"),
        minWidth: "140px",
        align: "right",
        cell: (payslip) => (
          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold text-primary text-sm")}>
            {formatCurrency(payslip.netSalary)}
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        cell: (payslip) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => {
              handleSelect(payslip)
            }}
            aria-label="Xem chi tiết phiếu lương"
          >
            <ChevronRight className="size-4" />
          </Button>
        ),
      },
    ],
    [page, limit, handleSelect],
  )

  if (view !== "list") {
    return <PayslipDetailPage payslip={selectedPayslip} onClose={handleCloseForm} />
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
        debounceMs: 400,
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
        totalItems: filteredPayslips.length,
        itemsPerPage: limit,
        onPageChange: setPage,
        onItemsPerPageChange: (newLimit: number) => {
          setLimit(newLimit)
          setPage(1)
        },
        pageSizeOptions: [10, 20, 50],
      }}
    />
  )
}
