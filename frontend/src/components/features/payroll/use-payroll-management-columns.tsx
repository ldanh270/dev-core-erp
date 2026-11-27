import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAYROLL_STATUS, PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn, formatCurrency } from "@/lib/utils"
import type { IPayroll } from "@/types/payroll.types"

import { useMemo } from "react"
import { CheckCircle2, MoreHorizontal, XCircle } from "lucide-react"

const PAYROLL_STATUS_LABELS_MAP = new Map(Object.entries(PAYROLL_STATUS_LABELS))

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

interface UsePayrollManagementColumnsProps {
  onSelectPayroll: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

/**
 * Hook returning DataTableColumn definitions for payroll cycles and approval workflows.
 */
export function usePayrollManagementColumns({
  onSelectPayroll,
  onApprove,
  onReject,
}: UsePayrollManagementColumnsProps) {
  return useMemo<DataTableColumn<IPayroll>[]>(
    () => [
      {
        id: "cycle",
        header: "Kỳ lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (item) => (
          <div className="flex flex-col">
            <span className={TYPOGRAPHY.CELL_PRIMARY}>
              Tháng {item.periodMonth}/{item.periodYear}
            </span>
            <span className={TYPOGRAPHY.CELL_SECONDARY}>
              Khởi tạo: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        ),
      },
      {
        id: "totalAmount",
        header: "Tổng chi trả",
        width: getTableColWidthPx("CURRENCY"),
        minWidth: `${TABLE_COL_WIDTH.CURRENCY}px`,
        align: "right",
        cell: (item) => (
          <span
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "tabular-nums font-semibold text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatCurrency(item.totalAmount)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (item) => {
          const label = PAYROLL_STATUS_LABELS_MAP.get(item.status) || item.status
          return <StatusPill label={label} variant={getPayrollStatusVariant(item.status)} />
        },
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        align: "right",
        sticky: true,
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md border-border">
              <DropdownMenuItem
                onClick={() => {
                  onSelectPayroll(item.id)
                }}
                className="cursor-pointer text-xs font-medium"
              >
                Xem chi tiết
              </DropdownMenuItem>
              {item.status === PAYROLL_STATUS.DRAFT && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onApprove(item.id)
                    }}
                    className="cursor-pointer text-xs font-medium text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
                  >
                    <CheckCircle2 className="size-3.5 mr-2" /> Duyệt bảng lương
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onReject(item.id)
                    }}
                    className="cursor-pointer text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <XCircle className="size-3.5 mr-2" /> Từ chối
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onApprove, onReject, onSelectPayroll],
  )
}
