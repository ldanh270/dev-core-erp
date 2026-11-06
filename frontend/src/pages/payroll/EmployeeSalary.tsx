import { DataTablePage, type DataTableColumn } from "@/components/common"
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
import { useDebounce } from "@/hooks/use-debounce"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useActiveSalaryConfig,
  usePayslipTemplates,
} from "@/hooks/payroll/use-employee-salary-config"
import type { Employee } from "@/types/employee.types"

import { useMemo, useState } from "react"

import { MoreHorizontal, User } from "lucide-react"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

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
    return <span className="text-muted-foreground text-xs">Đang tải...</span>
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold text-foreground">
        {config ? formatCurrency(Number(config.baseSalary)) : (
          <span className="text-destructive font-normal">Chưa thiết lập</span>
        )}
      </span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
          config
            ? "bg-primary/5 text-primary border-primary/20"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {templateName}
      </span>
    </div>
  )
}

export default function EmployeeSalary() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
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
    search: debouncedSearch,
  })

  const { data: templates } = usePayslipTemplates()

  const handleOpenConfigDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
  }

  const handleOpenHistoryDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setHistoryDialogOpen(true)
  }

  const columns: DataTableColumn<Employee>[] = useMemo(
    () => [
      {
        id: "index",
        header: "STT",
        width: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className="text-muted-foreground">{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "employee",
        header: "Nhân sự",
        minWidth: "240px",
        sticky: true,
        cell: (emp) => (
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() =>
              handleOpenConfigDialog({
                id: emp.id,
                fullName: emp.fullName,
                position: emp.position || undefined,
              })
            }
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border border-border">
              {emp.avatar?.url ? (
                <img src={emp.avatar.url} alt={emp.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate hover:text-primary transition-colors">
                {emp.fullName}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {emp.id.split("-")[0].toUpperCase()}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "position",
        header: "Vị trí / Vai trò",
        minWidth: "180px",
        hideBelow: "md",
        cell: (emp) => (
          <div>
            <div className="font-semibold text-foreground/85 text-xs">{emp.position || "—"}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{emp.role}</div>
          </div>
        ),
      },
      {
        id: "salaryConfig",
        header: "Lương cơ bản & Mẫu phiếu lương",
        minWidth: "260px",
        cell: (emp) => (
          <EmployeeSalaryInfoCell employeeId={emp.id} templates={templates} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: "60px",
        align: "center",
        cell: (emp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs rounded-xl">
              <DropdownMenuItem
                onClick={() =>
                  handleOpenConfigDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }
              >
                Gán mẫu phiếu lương
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleOpenHistoryDialog({
                    id: emp.id,
                    fullName: emp.fullName,
                    position: emp.position || undefined,
                  })
                }
              >
                Xem lịch sử phiếu lương
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit, templates],
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
          onSearch: (val: string) => {
            setSearchQuery(val)
            setPage(1)
          },
          placeholder: "Tìm kiếm nhân viên...",
        }}
        pagination={
          employeeData && employeeData.meta.total > 0
            ? {
                currentPage: page,
                totalPages: employeeData.meta.totalPages,
                totalItems: employeeData.meta.total,
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
