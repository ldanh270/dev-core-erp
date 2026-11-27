import {
  type DataTableColumn,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { EmployeeSalaryInfoCell } from "@/components/features/payroll/EmployeeSalaryInfoCell"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useMemo } from "react"
import { FileText, History, MoreHorizontal, User } from "lucide-react"

interface SelectedEmployeeBrief {
  id: string
  fullName: string
  position?: string
}

interface UseEmployeeSalaryColumnsProps {
  page: number
  limit: number
  templates?: IPayslipTemplate[]
  onOpenConfigDialog: (emp: SelectedEmployeeBrief) => void
  onOpenHistoryDialog: (emp: SelectedEmployeeBrief) => void
}

/**
 * Hook returning DataTableColumn definitions for the Employee Salary management table.
 */
export function useEmployeeSalaryColumns({
  page,
  limit,
  templates = [],
  onOpenConfigDialog,
  onOpenHistoryDialog,
}: UseEmployeeSalaryColumnsProps) {
  return useMemo<DataTableColumn<Employee>[]>(
    () => [
      {
        id: "index",
        header: "STT",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "employee",
        header: "Nhân sự",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        sticky: true,
        cell: (emp) => (
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
            onClick={() => {
              onOpenConfigDialog({
                id: emp.id,
                fullName: emp.fullName,
                position: emp.position || undefined,
              })
            }}
          >
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border border-border">
              {emp.avatar?.url ? (
                <img src={emp.avatar.url} alt={emp.fullName} className="size-full object-cover" />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  TYPOGRAPHY.CELL_PRIMARY,
                  "font-medium text-foreground truncate hover:text-primary transition-colors",
                )}
              >
                {emp.fullName}
              </div>
              <div
                className={cn(TYPOGRAPHY.CELL_CODE, "text-[10px] text-muted-foreground font-mono")}
              >
                {emp.id.split("-")[0].toUpperCase()}
              </div>
            </div>
          </button>
        ),
      },
      {
        id: "position",
        header: "Vị trí / Vai trò",
        width: getTableColWidthPx("POSITION"),
        minWidth: `${TABLE_COL_WIDTH.POSITION}px`,
        hideBelow: "md",
        cell: (emp) => (
          <div>
            <div
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "font-semibold text-foreground/85 text-xs truncate",
              )}
            >
              {emp.position || "—"}
            </div>
            <div
              className={cn(
                TYPOGRAPHY.CELL_SECONDARY,
                "text-[10px] text-muted-foreground uppercase mt-0.5",
              )}
            >
              {emp.role}
            </div>
          </div>
        ),
      },
      {
        id: "salaryConfig",
        header: "Lương cơ bản & Mẫu phiếu lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (emp) => <EmployeeSalaryInfoCell employeeId={emp.id} templates={templates} />,
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        cell: (emp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs rounded-xl w-48">
              <DropdownMenuItem
                onClick={() => {
                  onOpenConfigDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }}
                className="gap-2 cursor-pointer"
              >
                <FileText className="size-3.5" />
                Gán mẫu phiếu lương
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenHistoryDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }}
                className="gap-2 cursor-pointer"
              >
                <History className="size-3.5" />
                Xem lịch sử phiếu lương
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit, templates, onOpenConfigDialog, onOpenHistoryDialog],
  )
}
