import { AppPagination, DataTableToolbar, PageCard, PageContainer, PageHeader } from "@/components/common"
import EmployeePayslipHistoryDialog from "@/components/features/payroll/EmployeePayslipHistoryDialog"
import EmployeeSalaryConfigDialog from "@/components/features/payroll/employee-salary-config-dialog"
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
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useDebounce } from "@/hooks/use-debounce"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useActiveSalaryConfig,
  usePayslipTemplates,
} from "@/hooks/payroll/use-employee-salary-config"
import type { Employee } from "@/types/employee.types"

import { useState } from "react"

import { Loader2, MoreHorizontal, User } from "lucide-react"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
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

  const handleOpenConfigDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
  }

  const handleOpenHistoryDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setHistoryDialogOpen(true)
  }

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Lương nhân sự"
        description="Quản lý cấu hình mức lương cơ bản và mẫu phiếu lương của nhân viên."
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <DataTableToolbar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm kiếm nhân viên..."
        />

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-10 min-w-12.5 px-4 py-3 font-medium text-center text-xs text-muted-foreground uppercase">
                  STT
                </TableHead>
                <TableHead className="h-10 px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Nhân sự
                </TableHead>
                <TableHead className="h-10 hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Vị trí / Vai trò
                </TableHead>
                <TableHead className="h-10 hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Lương cơ bản
                </TableHead>
                <TableHead className="h-10 px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Mẫu phiếu lương
                </TableHead>
                <TableHead className="h-10 min-w-12.5 px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isEmployeesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : !employeeData || employeeData.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy nhân viên nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                employeeData.data.map((emp: Employee, index: number) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    index={(page - 1) * limit + index + 1}
                    onConfigure={handleOpenConfigDialog}
                    onViewHistory={handleOpenHistoryDialog}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {employeeData && employeeData.meta.total > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={employeeData.meta.totalPages}
            onPageChange={setPage}
            totalItems={employeeData.meta.total}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        )}
      </PageCard>

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
    </PageContainer>
  )
}

interface RowProps {
  emp: Employee
  index: number
  onConfigure: (emp: { id: string; fullName: string; position?: string }) => void
  onViewHistory: (emp: { id: string; fullName: string; position?: string }) => void
}

function EmployeeRow({ emp, index, onConfigure, onViewHistory }: RowProps) {
  const { data: config, isLoading } = useActiveSalaryConfig(emp.id)
  const { data: templates } = usePayslipTemplates()

  const templateName = templates?.find((t) => t.id === config?.templateId)?.name || "Chưa thiết lập"

  return (
    <TableRow
      className="hover:bg-muted/30 cursor-pointer"
      onClick={() =>
        onConfigure({ id: emp.id, fullName: emp.fullName, position: emp.position || undefined })
      }
    >
      <TableCell className="h-[60px] text-center px-4 py-3 text-muted-foreground">{index}</TableCell>
      <TableCell className="h-[60px] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border">
            {emp.avatar?.url ? (
              <img src={emp.avatar.url} alt={emp.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
          <div>
            <div className="font-medium text-foreground">{emp.fullName}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {emp.id.split("-")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="h-[60px] hidden sm:table-cell px-4 py-3">
        <div className="font-semibold text-foreground/80">{emp.position || "-"}</div>
        <div className="text-[10px] text-muted-foreground uppercase">{emp.role}</div>
      </TableCell>
      <TableCell className="h-[60px] hidden sm:table-cell px-4 py-3 font-semibold">
        {isLoading ? (
          <span className="text-muted-foreground">Đang tải...</span>
        ) : config ? (
          formatCurrency(Number(config.baseSalary))
        ) : (
          <span className="text-destructive">Chưa thiết lập</span>
        )}
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3">
        {isLoading ? (
          <span className="text-muted-foreground">Đang tải...</span>
        ) : (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              config
                ? "bg-primary/5 text-primary border-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {templateName}
          </span>
        )}
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem
              onClick={() =>
                onConfigure({
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
                onViewHistory({
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
      </TableCell>
    </TableRow>
  )
}
