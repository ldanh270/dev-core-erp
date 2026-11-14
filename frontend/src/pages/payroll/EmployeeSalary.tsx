import { type DataTableColumn, DataTablePage } from "@/components/common"
import EmployeePayslipHistoryDialog from "@/components/features/payroll/EmployeePayslipHistoryDialog"
import EmployeeSalaryConfigDialog from "@/components/features/payroll/employee-salary-config-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useActiveSalaryConfig,
  usePayslipTemplates,
} from "@/hooks/payroll/use-employee-salary-config"
import { cn, formatCurrency } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { useCallback, useMemo, useState } from "react"

import { FileText, History, Inbox, MoreHorizontal, User } from "lucide-react"

function EmployeeSalaryInfoCell({
  employeeId,
  templates,
}: {
  employeeId: string
  templates?: { id: string; name: string }[]
}) {
  const { data: config, isLoading } = useActiveSalaryConfig(employeeId)
  const templateName = templates?.find((t) => t.id === config?.templateId)?.name || "Chưa thiết lập"

  if (isLoading) {
    return <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "text-xs")}>Đang tải...</span>
  }

  return (
    <div className="flex items-center gap-3">
      <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold text-foreground")}>
        {config ? (
          formatCurrency(Number(config.baseSalary))
        ) : (
          <span className="text-destructive font-normal text-xs">Chưa thiết lập</span>
        )}
      </span>
      <span
        className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
          config
            ? "bg-primary/5 text-primary border-primary/20"
            : "bg-muted text-muted-foreground border-border",
        )}
      >
        {templateName}
      </span>
    </div>
  )
}

/**
 * EmployeeSalary — Enterprise employee salary and template assignment page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function EmployeeSalary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string
    fullName: string
    position?: string
  } | null>(null)

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page,
    limit,
    search: searchQuery,
  })

  const { data: templates } = usePayslipTemplates()

  const handleOpenConfigDialog = useCallback(
    (emp: { id: string; fullName: string; position?: string }) => {
      setSelectedEmployee(emp)
      setConfigDialogOpen(true)
    },
    [],
  )

  const handleOpenHistoryDialog = useCallback(
    (emp: { id: string; fullName: string; position?: string }) => {
      setSelectedEmployee(emp)
      setHistoryDialogOpen(true)
    },
    [],
  )

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val)
    setPage(1)
  }, [])

  const columns: DataTableColumn<Employee>[] = useMemo(
    () => [
      {
        id: "index",
        header: "STT",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
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
        minWidth: "220px",
        sticky: true,
        cell: (emp) => (
          <button
            type="button"
            className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
            onClick={() => {
              handleOpenConfigDialog({
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
        minWidth: "160px",
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
        minWidth: "240px",
        cell: (emp) => <EmployeeSalaryInfoCell employeeId={emp.id} templates={templates} />,
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        cell: (emp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs rounded-xl w-48">
              <DropdownMenuItem
                onClick={() => {
                  handleOpenConfigDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }}
                className="gap-2"
              >
                <FileText className="size-3.5" />
                Gán mẫu phiếu lương
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleOpenHistoryDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }}
                className="gap-2"
              >
                <History className="size-3.5" />
                Xem lịch sử phiếu lương
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit, templates, handleOpenConfigDialog, handleOpenHistoryDialog],
  )

  return (
    <>
      <DataTablePage<Employee>
        title="Lương nhân sự"
        description="Quản lý cấu hình mức lương cơ bản và mẫu phiếu lương của nhân viên."
        variant="viewport"
        data={employeeData?.data ?? []}
        columns={columns}
        isLoading={isEmployeesLoading}
        keyExtractor={(emp) => emp.id}
        search={{
          value: searchQuery,
          debounceMs: 400,
          onSearch: handleSearch,
          placeholder: "Tìm kiếm nhân viên...",
        }}
        emptyState={{
          icon: Inbox,
          title: searchQuery.trim()
            ? "Không tìm thấy nhân viên"
            : "Chưa có dữ liệu lương nhân viên",
          description: searchQuery.trim()
            ? `Không có nhân viên nào khớp với từ khóa "${searchQuery}".`
            : "Chưa có nhân viên nào được thiết lập cấu hình lương.",
        }}
        pagination={{
          currentPage: page,
          totalPages: employeeData?.meta.totalPages || 1,
          totalItems: employeeData?.meta.total || 0,
          itemsPerPage: limit,
          onPageChange: setPage,
          onItemsPerPageChange: (newLimit: number) => {
            setLimit(newLimit)
            setPage(1)
          },
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <EmployeeSalaryConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        employee={selectedEmployee}
      />

      <EmployeePayslipHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        employee={selectedEmployee}
      />
    </>
  )
}
