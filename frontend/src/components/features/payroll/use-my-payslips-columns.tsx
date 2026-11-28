import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PAYROLL_STATUS,
  PAYROLL_STATUS_LABELS,
  PAYSLIP_RECEIPT_STATUS,
  PAYSLIP_RECEIPT_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn, formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useMemo } from "react"

import { CalendarDays, ChevronRight } from "lucide-react"

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

interface UseMyPayslipsColumnsProps {
  page: number
  limit: number
  onSelectPayslip: (payslip: IPayslip) => void
}

/**
 * Hook returning DataTableColumn definitions for employee personal payslips table.
 */
export function useMyPayslipsColumns({ page, limit, onSelectPayslip }: UseMyPayslipsColumnsProps) {
  return useMemo<DataTableColumn<IPayslip>[]>(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "period",
        header: "Kỳ lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (payslip) => (
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
            onClick={() => {
              onSelectPayslip(payslip)
            }}
          >
            <div className="size-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <CalendarDays className="size-4" />
            </div>
            <div className="min-w-0">
              <div
                className={cn(
                  TYPOGRAPHY.CELL_PRIMARY,
                  "font-semibold text-foreground group-hover:text-primary transition-colors",
                )}
              >
                Tháng {payslip.periodMonth}/{payslip.periodYear}
              </div>
              <div
                className={cn(TYPOGRAPHY.CELL_SECONDARY, "flex items-center gap-2 mt-0.5 text-xs")}
              >
                <span>Kỳ lương định kỳ</span>
                {payslip.isPreview ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full text-[10px] px-2 py-0 shadow-none font-normal"
                  >
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
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
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
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
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
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
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
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
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
        minWidth: `${TABLE_COL_WIDTH.CURRENCY}px`,
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
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        cell: (payslip) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              onSelectPayslip(payslip)
            }}
            aria-label="Xem chi tiết phiếu lương"
          >
            <ChevronRight className="size-4" />
          </Button>
        ),
      },
    ],
    [page, limit, onSelectPayslip],
  )
}
