import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import type { Employee } from "@/types/employee.types"

import { useCallback, useMemo } from "react"

import { useSearchParams } from "react-router-dom"

const EMPTY_EMPLOYEES: Employee[] = []

/**
 * Custom hook to encapsulate InsurancePage state, URL sync, filtering, and pagination.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useInsuranceManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const searchTerm = searchParams.get("search") || ""

  const { data: paginatedData, isLoading } = useEmployees({ limit: 100 })
  const employees = paginatedData?.data ?? EMPTY_EMPLOYEES

  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (keyword.trim()) {
          next.set("search", keyword.trim())
        } else {
          next.delete("search")
        }
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(nextPage))
        return next
      })
    },
    [setSearchParams],
  )

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("limit", String(nextLimit))
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const filteredEmployees = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) return employees

    return employees.filter((employee: Employee) =>
      [employee.fullName, employee.username, employee.nationalId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedTerm)),
    )
  }, [employees, searchTerm])

  const totalPages = Math.ceil(filteredEmployees.length / limit) || 1

  const paginatedEmployees = useMemo(
    () => filteredEmployees.slice((page - 1) * limit, page * limit),
    [filteredEmployees, page, limit],
  )

  return {
    employees: paginatedEmployees,
    isLoading,
    totalItems: filteredEmployees.length,
    totalPages,
    currentPage: page,
    pageSize: limit,
    searchTerm,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  }
}
