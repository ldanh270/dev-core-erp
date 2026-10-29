import { AppPagination, DataTableToolbar, EmptyState, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PAYROLL_STATUS,
  PAYROLL_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { useApprovePayroll, useRejectPayroll } from "@/hooks/payroll/use-payrolls"
import type { IPayroll } from "@/types/payroll.types"

import { useState } from "react"

import { CheckCircle2, Clock, MoreHorizontal, XCircle } from "lucide-react"

import { PayrollDetailSheet } from "./PayrollDetailSheet"

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

interface PayrollHistoryTableProps {
  payrolls: IPayroll[]
  isLoading: boolean
}

export function PayrollHistoryTable({ payrolls, isLoading }: PayrollHistoryTableProps) {
  const { mutate: approvePayroll } = useApprovePayroll()
  const { mutate: rejectPayroll } = useRejectPayroll()
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const filteredPayrolls = payrolls.filter((p) => {
    const s = searchTerm.toLowerCase()
    const periodStr = `${p.periodMonth}/${p.periodYear}`
    const periodStrZero = `${String(p.periodMonth).padStart(2, "0")}/${p.periodYear}`
    const statusStr = PAYROLL_STATUS_LABELS[p.status].toLowerCase()
    return (
      p.id.toLowerCase().includes(s) ||
      periodStr.includes(s) ||
      periodStrZero.includes(s) ||
      statusStr.includes(s)
    )
  })

  const paginatedPayrolls = filteredPayrolls.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredPayrolls.length / limit)

  const handleApprove = (id: string) => {
    approvePayroll(id)
  }

  const handleReject = (id: string) => {
    const reason = window.prompt("Enter rejection reason:")
    if (reason) {
      rejectPayroll({ id, reason })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center border rounded-xl">
        <p className="text-muted-foreground">Loading payroll history...</p>
      </div>
    )
  }

  if (payrolls.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={Clock}
          title="Chưa có bảng lương nào"
          description="Chưa có chu kỳ tính lương nào được ghi nhận. Hãy bấm 'Generate Payroll' để bắt đầu."
        />
      </div>
    )
  }

  return (
    <>
      <DataTableToolbar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val)
          setPage(1)
        }}
        searchPlaceholder="Tìm kiếm mã, tháng/năm, trạng thái..."
      />
      <div className="rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                #
              </TableHead>
              <TableHead className="hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                Payroll ID
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                Period
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                Total Amount
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="hidden md:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                Created At
              </TableHead>
              <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-8">
                  <EmptyState
                    icon={Clock}
                    title="Không tìm thấy bảng lương"
                    description="Không có chu kỳ tính lương nào phù hợp với điều kiện tìm kiếm."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayrolls.map((payroll, index) => {
                const isDraft = payroll.status === PAYROLL_STATUS.DRAFT

                return (
                  <TableRow key={payroll.id}>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPayrollId(payroll.id)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        PAY-{payroll.id.substring(payroll.id.length - 8).toUpperCase()}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium">
                      {payroll.periodMonth} / {payroll.periodYear}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(payroll.totalAmount)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusPill
                        label={PAYROLL_STATUS_LABELS[payroll.status]}
                        variant={getPayrollStatusVariant(payroll.status)}
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(payroll.createdAt))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {isDraft ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => handleApprove(payroll.id)}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                              <span>Approve</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(payroll.id)}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              <span>Reject</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredPayrolls.length > 0 && (
        <div className="bg-card rounded-xl border border-t-0 rounded-t-none">
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredPayrolls.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </div>
      )}

      <PayrollDetailSheet
        payrollId={selectedPayrollId}
        onClose={() => setSelectedPayrollId(null)}
      />
    </>
  )
}
