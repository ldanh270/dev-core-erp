import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn, formatCurrency } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { useMemo } from "react"

import { User } from "lucide-react"

/**
 * Table column definitions for the Social & Health Insurance data table.
 * Pure presentational UI column mappings.
 *
 * @returns Array of data table columns for employee insurance view
 */
export function useInsuranceColumns(): DataTableColumn<Employee>[] {
  return useMemo(
    () => [
      {
        id: "employee",
        header: "Nhân sự",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        sticky: true,
        cell: (employee) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p
                className={cn(TYPOGRAPHY.CELL_PRIMARY, "leading-5 truncate")}
                title={employee.fullName}
              >
                {employee.fullName}
              </p>
              <p
                className={cn(TYPOGRAPHY.CELL_SECONDARY, "leading-4 truncate")}
                title={employee.username}
              >
                @{employee.username}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "code",
        header: "Mã NV",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        sticky: true,
        cell: (employee) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground inline-block truncate">
            {employee.id ? employee.id.slice(-6).toUpperCase() : "—"}
          </span>
        ),
      },
      {
        id: "socialInsurance",
        header: "Số sổ BHXH",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (employee) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            {employee.nationalId ? `79${employee.nationalId.slice(0, 8)}` : "—"}
          </span>
        ),
      },
      {
        id: "healthInsurance",
        header: "Mã BHYT",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (employee) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            {employee.nationalId ? `DN4${employee.nationalId.slice(0, 10)}` : "—"}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Lương đóng BH",
        align: "right",
        width: getTableColWidthPx("CURRENCY"),
        minWidth: `${TABLE_COL_WIDTH.CURRENCY}px`,
        cell: () => (
          <span className={cn(TYPOGRAPHY.CELL_CURRENCY, "whitespace-nowrap")}>
            {formatCurrency(5000000)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        cell: () => <StatusPill label="Đang đóng BHXH" variant="success" />,
      },
    ],
    [],
  )
}
