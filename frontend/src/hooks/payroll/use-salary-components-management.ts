import { SYSTEM_CONFIG } from "@/config/system.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useCallback, useMemo, useState } from "react"

/**
 * Custom hook to encapsulate SalaryComponents management view state and pagination.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useSalaryComponentsManagement() {
  const { data: components, isLoading } = useSalaryComponents()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedComponent, setSelectedComponent] = useState<ISalaryComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)

  const handleCreate = useCallback(() => {
    setSelectedComponent(null)
    setView("create")
  }, [])

  const handleEdit = useCallback((comp: ISalaryComponent) => {
    setSelectedComponent(comp)
    setView("edit")
  }, [])

  const handleCloseForm = useCallback(() => {
    setView("list")
    setSelectedComponent(null)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredComponents = useMemo(() => {
    if (!components) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return components
    return components.filter(
      (c) => c.name.toLowerCase().includes(s) || c.formula.toLowerCase().includes(s),
    )
  }, [components, searchTerm])

  const paginatedComponents = useMemo(() => {
    return filteredComponents.slice((page - 1) * limit, page * limit)
  }, [filteredComponents, page, limit])

  const totalPages = Math.ceil(filteredComponents.length / limit) || 1

  return {
    components: paginatedComponents,
    isLoading,
    totalItems: filteredComponents.length,
    totalPages,
    currentPage: page,
    setCurrentPage: setPage,
    pageSize: limit,
    setPageSize: setLimit,
    view,
    selectedComponent,
    handleCreate,
    handleEdit,
    handleCloseForm,
    handleSearch,
  }
}
