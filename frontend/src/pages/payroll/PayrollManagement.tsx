import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { GeneratePayrollModal } from "@/components/payroll/GeneratePayrollModal"
import { PayrollDetailSheet } from "@/components/payroll/PayrollDetailSheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PAYROLL_STATUS,
  PAYROLL_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import {
  useApprovePayroll,
  usePayrolls,
  useRejectPayroll,
} from "@/hooks/payroll/use-payrolls"
import type { IPayroll } from "@/types/payroll.types"
import { exportPayrollsToCSV } from "@/utils/export.util"

import { useMemo, useState } from "react"

import {
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal,
  XCircle,
} from "lucide-react"

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

export default function PayrollManagement() {
  const [filters] = useState<{ status?: string; year?: number }>({})
  const { data: payrolls, isLoading } = usePayrolls(filters)
  const { mutate: approvePayroll } = useApprovePayroll()
  const { mutate: rejectPayroll } = useRejectPayroll()

  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const handleExport = () => {
    if (payrolls) {
      exportPayrollsToCSV(payrolls, `payroll_export_${Date.now()}.csv`)
    }
  }

  const handleApprove = (id: string) => {
    approvePayroll(id)
  }

  const handleReject = (id: string) => {
    const reason = window.prompt("Nhập lý do từ chối:")
    if (reason) {
      rejectPayroll({ id, reason })
    }
  }

  const filteredPayrolls = useMemo(() => {
    if (!payrolls) return []
    const s = searchTerm.toLowerCase()
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

  const paginatedPayrolls = useMemo(() => {
    return filteredPayrolls.slice((page - 1) * limit, page * limit)
  }, [filteredPayrolls, page, limit])

  const totalPages = Math.ceil(filteredPayrolls.length / limit)

  const columns: DataTableColumn<IPayroll>[] = useMemo(
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
        id: "id",
        header: "Mã bảng lương",
        minWidth: "160px",
        sticky: true,
        cell: (payroll) => (
          <button
            type="button"
            onClick={() => { setSelectedPayrollId(payroll.id); }}
            className="font-mono font-medium text-primary hover:underline text-left"
          >
            PAY-{payroll.id.substring(payroll.id.length - 8).toUpperCase()}
          </button>
        ),
      },
      {
        id: "period",
        header: "Kỳ lương",
        minWidth: "120px",
        cell: (payroll) => (
          <span className="font-medium">
            Tháng {payroll.periodMonth}/{payroll.periodYear}
          </span>
        ),
      },
      {
        id: "totalAmount",
        header: "Tổng chi trả",
        minWidth: "160px",
        cell: (payroll) => (
          <span className="font-semibold text-foreground">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(payroll.totalAmount)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
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
        minWidth: "140px",
        hideBelow: "md",
        cell: (payroll) => (
          <span className="text-muted-foreground">
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
        width: "60px",
        align: "center",
        cell: (payroll) => {
          const isDraft = payroll.status === PAYROLL_STATUS.DRAFT
          if (!isDraft) return <span className="text-muted-foreground text-xs">—</span>

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem onClick={() => { handleApprove(payroll.id); }}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>Duyệt</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { handleReject(payroll.id); }}>
                  <XCircle className="mr-2 h-4 w-4 text-destructive" />
                  <span>Từ chối</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [page, limit],
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
          onSearch: (val: string) => {
            setSearchTerm(val)
            setPage(1)
          },
          placeholder: "Tìm kiếm mã, tháng/năm, trạng thái...",
        }}
        primaryAction={<GeneratePayrollModal />}
        headerActions={
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!payrolls || payrolls.length === 0}
            className="rounded-full font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        }
        emptyState={{
          icon: Clock,
          title: "Chưa có bảng lương nào",
          description: "Chưa có chu kỳ tính lương nào được ghi nhận. Hãy bấm 'Tạo bảng lương' để bắt đầu.",
        }}
        pagination={
          filteredPayrolls.length > 0
            ? {
                currentPage: page,
                totalPages,
                totalItems: filteredPayrolls.length,
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

      <PayrollDetailSheet
        payrollId={selectedPayrollId}
        onClose={() => { setSelectedPayrollId(null); }}
      />
    </>
  )
}
