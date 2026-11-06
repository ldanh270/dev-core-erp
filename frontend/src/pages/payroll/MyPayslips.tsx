import {
  DataTablePage,
  type DataTableColumn,
} from "@/components/common"
import { PayslipDetailPage } from "@/components/features/payroll/payslip-detail-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PAYROLL_STATUS_BADGE,
  PAYROLL_STATUS_LABELS,
  PAYSLIP_RECEIPT_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { useMyPayslips } from "@/hooks/payroll/use-my-payslips"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useMemo, useState } from "react"

import { CalendarDays, ChevronRight, FileText } from "lucide-react"

export default function MyPayslips() {
  const { data: payslips, isLoading } = useMyPayslips()

  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedPayslip, setSelectedPayslip] = useState<IPayslip | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const filteredPayslips = useMemo(() => {
    if (!payslips) return []
    const s = searchTerm.toLowerCase()
    return payslips.filter((p) => {
      const periodStr = `${p.periodMonth}/${p.periodYear}`
      const periodStrZero = `${String(p.periodMonth).padStart(2, "0")}/${p.periodYear}`
      const statusStr = p.status ? PAYROLL_STATUS_LABELS[p.status].toLowerCase() : ""
      return periodStr.includes(s) || periodStrZero.includes(s) || statusStr.includes(s)
    })
  }, [payslips, searchTerm])

  const paginatedPayslips = useMemo(() => {
    return filteredPayslips.slice((page - 1) * limit, page * limit)
  }, [filteredPayslips, page, limit])

  const totalPages = Math.ceil(filteredPayslips.length / limit)

  const handleCloseForm = () => {
    setView("list")
    setSelectedPayslip(null)
  }

  const handleSelect = (payslip: IPayslip) => {
    setSelectedPayslip(payslip)
    setView("detail")
  }

  const columns: DataTableColumn<IPayslip>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className="text-muted-foreground">{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "period",
        header: "Kỳ lương",
        minWidth: "220px",
        sticky: true,
        cell: (payslip) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { handleSelect(payslip); }}
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Tháng {payslip.periodMonth}/{payslip.periodYear}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Kỳ lương định kỳ</span>
                {payslip.isPreview ? (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 shadow-none">
                    Xem trước
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "workingDays",
        header: "Ngày công",
        minWidth: "110px",
        align: "center",
        hideBelow: "md",
        cell: (payslip) => (
          <span className="font-medium text-foreground">
            {payslip.workingDays} <span className="text-xs font-normal text-muted-foreground">ngày</span>
          </span>
        ),
      },
      {
        id: "overtimeMinutes",
        header: "Tăng ca",
        minWidth: "110px",
        align: "center",
        hideBelow: "md",
        cell: (payslip) => (
          <span className="font-medium text-foreground">
            {payslip.overtimeMinutes} <span className="text-xs font-normal text-muted-foreground">phút</span>
          </span>
        ),
      },
      {
        id: "status",
        header: "Duyệt lương",
        minWidth: "130px",
        cell: (payslip) => (
          <Badge
            variant={payslip.status ? PAYROLL_STATUS_BADGE[payslip.status] : "default"}
            className="rounded-full shadow-none font-medium px-2.5 py-0.5 text-xs"
          >
            {payslip.status ? PAYROLL_STATUS_LABELS[payslip.status] : "Không rõ"}
          </Badge>
        ),
      },
      {
        id: "receiptStatus",
        header: "Nhận lương",
        minWidth: "130px",
        cell: (payslip) => (
          <Badge variant="outline" className="rounded-full shadow-none font-medium px-2.5 py-0.5 text-xs">
            {payslip.receiptStatus
              ? PAYSLIP_RECEIPT_STATUS_LABELS[payslip.receiptStatus]
              : "Chưa nhận"}
          </Badge>
        ),
      },
      {
        id: "netSalary",
        header: "Thực lãnh",
        minWidth: "140px",
        align: "right",
        cell: (payslip) => (
          <span className="font-bold text-primary text-sm">
            {formatCurrency(payslip.netSalary)}
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        width: "50px",
        align: "center",
        cell: (payslip) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => { handleSelect(payslip); }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        ),
      },
    ],
    [page, limit],
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
        onSearch: (val: string) => {
          setSearchTerm(val)
          setPage(1)
        },
        placeholder: "Tìm kiếm theo tháng/năm, trạng thái...",
      }}
      emptyState={{
        icon: FileText,
        title: "Bạn chưa có phiếu lương nào",
        description: "Khi hệ thống tạo và gửi phiếu lương hàng tháng, bạn sẽ theo dõi được tại đây.",
      }}
      pagination={
        filteredPayslips.length > 0
          ? {
              currentPage: page,
              totalPages,
              totalItems: filteredPayslips.length,
              itemsPerPage: limit,
              onPageChange: setPage,
              onItemsPerPageChange: (newLimit) => {
                setLimit(newLimit)
                setPage(1)
              },
            }
          : undefined
      }
    />
  )
}
