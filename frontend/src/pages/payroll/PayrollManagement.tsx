import { type DataTableColumn, DataTablePage, StatusPill } from "@/components/common"
import { GeneratePayrollModal } from "@/components/payroll/GeneratePayrollModal"
import { PayrollDetailSheet } from "@/components/payroll/PayrollDetailSheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAYROLL_STATUS, PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useApprovePayroll, usePayrolls, useRejectPayroll } from "@/hooks/payroll/use-payrolls"
import { cn, formatCurrency } from "@/lib/utils"
import type { IPayroll } from "@/types/payroll.types"
import { exportPayrollsToCSV } from "@/utils/export.util"

import { useCallback, useMemo, useState } from "react"

import { CheckCircle2, Download, Inbox, MoreHorizontal, XCircle } from "lucide-react"

const getPayrollStatusVariant = (status: string): "info" | "success" | "danger" | "neutral" => {
  switch (status) {
    case PAYROLL_STATUS.APPROVED:
      return "success"
    case PAYROLL_STATUS.DRAFT:
      return "info"
    case PAYROLL_STATUS.REJECTED:
      return "danger"
    default:
      return "neutral"
  }
}

/**
 * PayrollManagement — Enterprise payroll cycles management page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function PayrollManagement() {
  const [filters] = useState<{ status?: string; year?: number }>({})
  const { data: payrolls, isLoading } = usePayrolls(filters)
  const { mutate: approvePayroll } = useApprovePayroll()
  const { mutate: rejectPayroll } = useRejectPayroll()

  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const handleExport = useCallback(() => {
    if (payrolls && payrolls.length > 0) {
      exportPayrollsToCSV(payrolls, `payroll_export_${Date.now()}.csv`)
    }
  }, [payrolls])

  const handleApprove = useCallback(
    (id: string) => {
      approvePayroll(id)
    },
    [approvePayroll],
  )

  const handleReject = useCallback(
    (id: string) => {
      const reason = window.prompt("Nhập lý do từ chối:")
      if (reason) {
        rejectPayroll({ id, reason })
      }
    },
    [rejectPayroll],
  )

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredPayrolls = useMemo(() => {
    if (!payrolls) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return payrolls
    return payrolls.filter((p) => {
      const periodStr = `${p.periodMonth}/${p.periodYear}`
      const periodStrZero = `${String(p.periodMonth).padStart(2, "0")}/${p.periodYear}`
      const statusStr = PAYROLL_STATUS_LABELS[p.status]?.toLowerCase() ?? ""
      return (
        p.id.toLowerCase().includes(s) ||
        periodStr.includes(s) ||
        periodStrZero.includes(s) ||
        statusStr.includes(s)
      )
    })
  }, [payrolls, searchTerm])

  const totalPages = Math.ceil(filteredPayrolls.length / limit) || 1

  const paginatedPayrolls = useMemo(() => {
    return filteredPayrolls.slice((page - 1) * limit, page * limit)
  }, [filteredPayrolls, page, limit])

  const columns: DataTableColumn<IPayroll>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "id",
        header: "Mã bảng lương",
        width: getTableColWidthPx("CODE"),
        minWidth: "160px",
        sticky: true,
        cell: (payroll) => (
          <button
            type="button"
            onClick={() => {
              setSelectedPayrollId(payroll.id)
            }}
            className={cn(
              TYPOGRAPHY.CELL_CODE,
              "font-medium text-primary hover:underline text-left cursor-pointer",
            )}
          >
            PAY-{payroll.id.substring(payroll.id.length - 8).toUpperCase()}
          </button>
        ),
      },
      {
        id: "period",
        header: "Kỳ lương",
        width: getTableColWidthPx("DATE"),
        minWidth: "130px",
        cell: (payroll) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "font-medium text-foreground")}>
            Tháng {payroll.periodMonth}/{payroll.periodYear}
          </span>
        ),
      },
      {
        id: "totalAmount",
        header: "Tổng chi trả",
        width: getTableColWidthPx("CURRENCY"),
        minWidth: "160px",
        cell: (payroll) => (
          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold text-foreground")}>
            {formatCurrency(payroll.totalAmount)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: "140px",
        cell: (payroll) => (
          <StatusPill
            label={PAYROLL_STATUS_LABELS[payroll.status]}
            variant={getPayrollStatusVariant(payroll.status)}
          />
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: getTableColWidthPx("DATE"),
        minWidth: "130px",
        hideBelow: "md",
        cell: (payroll) => (
          <span className={TYPOGRAPHY.CELL_DATE}>
            {new Intl.DateTimeFormat("vi-VN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(payroll.createdAt))}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        cell: (payroll) => {
          const isDraft = payroll.status === PAYROLL_STATUS.DRAFT
          if (!isDraft) return <span className="text-muted-foreground text-xs">—</span>

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Thao tác bảng lương"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                  onClick={() => {
                    handleApprove(payroll.id)
                  }}
                  className="gap-2 text-xs"
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Duyệt</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleReject(payroll.id)
                  }}
                  className="gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <XCircle className="size-4 text-destructive" />
                  <span>Từ chối</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [page, limit, handleApprove, handleReject],
  )

  return (
    <>
      <DataTablePage<IPayroll>
        title="Quản lý bảng lương"
        description="Quản lý chu kỳ lương của tổ chức, xem lịch sử và tạo bảng lương mới."
        variant="viewport"
        data={paginatedPayrolls}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(p) => p.id}
        search={{
          value: searchTerm,
          debounceMs: 400,
          onSearch: handleSearch,
          placeholder: "Tìm kiếm mã, tháng/năm, trạng thái...",
        }}
        primaryAction={<GeneratePayrollModal />}
        headerActions={
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!payrolls || payrolls.length === 0}
            className="rounded-full shadow-xs gap-1.5 font-semibold"
          >
            <Download className="size-4" />
            Xuất CSV
          </Button>
        }
        emptyState={{
          icon: Inbox,
          title: searchTerm.trim() ? "Không tìm thấy bảng lương nào" : "Chưa có bảng lương nào",
          description: searchTerm.trim()
            ? `Không tìm thấy bảng lương nào khớp với từ khóa "${searchTerm}".`
            : "Chưa có chu kỳ tính lương nào được ghi nhận. Hãy bấm 'Tạo bảng lương' để bắt đầu.",
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredPayrolls.length,
          itemsPerPage: limit,
          onPageChange: setPage,
          onItemsPerPageChange: (newLimit: number) => {
            setLimit(newLimit)
            setPage(1)
          },
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <PayrollDetailSheet
        payrollId={selectedPayrollId}
        onClose={() => {
          setSelectedPayrollId(null)
        }}
      />
    </>
  )
}
