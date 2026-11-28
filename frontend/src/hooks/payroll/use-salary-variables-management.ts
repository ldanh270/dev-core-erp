import { FORM_VIEW_MODE, type FormViewMode } from "@/config/entities/payroll.config"
import { SALARY_VARIABLE_DESCRIPTIONS } from "@/config/messages/payroll.message"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useDeleteSalaryVariable, useSalaryVariables } from "@/hooks/payroll/use-salary-variable"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"

import { useCallback, useMemo, useState } from "react"

export type VariableRow = Omit<ISalaryVariable, "value"> & {
  value: number | string
  isSystem?: boolean
}

/** System predefined built-in calculation variables available in all payroll formulas. */
export const SYSTEM_VARIABLES: VariableRow[] = [
  {
    id: "sys_baseSalary",
    code: "baseSalary",
    name: "Lương cơ bản",
    value: "Theo thiết lập lương",
    description: SALARY_VARIABLE_DESCRIPTIONS.BASE_SALARY,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_workingDays",
    code: "workingDays",
    name: "Ngày làm việc chuẩn",
    value: "Theo lịch tháng",
    description: SALARY_VARIABLE_DESCRIPTIONS.STANDARD_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_actualWorkingDays",
    code: "actualWorkingDays",
    name: "Ngày làm thực tế",
    value: "Từ chấm công",
    description: SALARY_VARIABLE_DESCRIPTIONS.WORKING_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_overtimeMinutes",
    code: "overtimeMinutes",
    name: "Phút tăng ca",
    value: "Từ chấm công",
    description: SALARY_VARIABLE_DESCRIPTIONS.OVERTIME_MINUTES,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_paidLeaveDays",
    code: "paidLeaveDays",
    name: "Nghỉ phép có lương",
    value: "Từ hệ thống phép",
    description: SALARY_VARIABLE_DESCRIPTIONS.HOLIDAY_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_unpaidLeaveDays",
    code: "unpaidLeaveDays",
    name: "Nghỉ không lương",
    value: "Từ hệ thống phép",
    description: SALARY_VARIABLE_DESCRIPTIONS.ABSENT_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Custom hook to encapsulate SalaryVariables state, pagination, and deletion logic.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useSalaryVariablesManagement() {
  const { data: userVariables, isLoading } = useSalaryVariables()
  const deleteMutation = useDeleteSalaryVariable()

  const [activeTab, setActiveTab] = useState<string>("all")
  const [view, setView] = useState<FormViewMode>(FORM_VIEW_MODE.LIST)
  const [selectedVariable, setSelectedVariable] = useState<ISalaryVariable | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)

  const handleCreate = useCallback(() => {
    setSelectedVariable(null)
    setView(FORM_VIEW_MODE.CREATE)
  }, [])

  const handleEdit = useCallback((variable: VariableRow) => {
    if (typeof variable.value === "number") {
      setSelectedVariable(variable as ISalaryVariable)
      setView(FORM_VIEW_MODE.EDIT)
    }
  }, [])

  const handleCloseForm = useCallback(() => {
    setView(FORM_VIEW_MODE.LIST)
    setSelectedVariable(null)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const allVariables: VariableRow[] = useMemo(() => {
    const custom: VariableRow[] = (userVariables ?? []).map((v) => ({ ...v, isSystem: false }))
    return [...SYSTEM_VARIABLES, ...custom]
  }, [userVariables])

  const filteredVariables = useMemo(() => {
    return allVariables.filter((item) => {
      if (activeTab === "system" && !item.isSystem) return false
      if (activeTab === "custom" && item.isSystem) return false

      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim()
        return (
          item.name.toLowerCase().includes(s) ||
          item.code.toLowerCase().includes(s) ||
          (item.description && item.description.toLowerCase().includes(s))
        )
      }
      return true
    })
  }, [allVariables, activeTab, searchTerm])

  const totalPages = Math.ceil(filteredVariables.length / limit) || 1

  const paginatedVariables = useMemo(() => {
    const start = (page - 1) * limit
    return filteredVariables.slice(start, start + limit)
  }, [filteredVariables, page, limit])

  const systemCount = SYSTEM_VARIABLES.length
  const customCount = userVariables?.length ?? 0
  const totalCount = systemCount + customCount

  return {
    variables: paginatedVariables,
    isLoading,
    totalItems: filteredVariables.length,
    totalPages,
    currentPage: page,
    setCurrentPage: setPage,
    pageSize: limit,
    setPageSize: setLimit,
    activeTab,
    setActiveTab,
    view,
    selectedVariable,
    systemCount,
    customCount,
    totalCount,
    deleteMutation,
    handleCreate,
    handleEdit,
    handleCloseForm,
    handleSearch,
  }
}
