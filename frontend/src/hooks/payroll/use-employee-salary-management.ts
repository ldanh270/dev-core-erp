import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { usePayslipTemplates } from "@/hooks/payroll/use-employee-salary-config"

import { useCallback, useState } from "react"

/**
 * Custom hook orchestrating employee salary query, search filters, modal states, and pagination.
 */
export interface SelectedSalaryEmployee {
  id: string
  fullName: string
  position?: string
}

/** Custom hook orchestrating employee salary query, search filters, modal states, and pagination. */
export function useEmployeeSalaryManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedSalaryEmployee | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page,
    limit,
    search: searchQuery,
  })

  const { data: templates } = usePayslipTemplates()

  const handleOpenConfigDialog = useCallback((emp: SelectedSalaryEmployee) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
  }, [])

  const handleOpenHistoryDialog = useCallback((emp: SelectedSalaryEmployee) => {
    setSelectedEmployee(emp)
    setHistoryDialogOpen(true)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleLimitChange = useCallback((nextLimit: number) => {
    setLimit(nextLimit)
    setPage(1)
  }, [])

  return {
    page,
    limit,
    searchQuery,
    employees: employeeData?.data ?? [],
    totalItems: employeeData?.meta.total || 0,
    totalPages: employeeData?.meta.totalPages || 1,
    isEmployeesLoading,
    templates,
    configDialogOpen,
    setConfigDialogOpen,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedEmployee,
    handleOpenConfigDialog,
    handleOpenHistoryDialog,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  }
}
