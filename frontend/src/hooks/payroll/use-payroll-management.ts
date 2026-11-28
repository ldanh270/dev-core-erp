import { PAYROLL_DETAIL_SEARCH_PARAM } from "@/config/entities/payroll.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useApprovePayroll, usePayrolls, useRejectPayroll } from "@/hooks/payroll/use-payrolls"
import type { IPayroll } from "@/types/payroll.types"
import { exportPayrollsToCSV } from "@/utils/export.util"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router"

/**
 * Custom hook to encapsulate PayrollManagement state, filtering, pagination, and approval logic.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function usePayrollManagement() {
  const [filters] = useState<{ status?: string; year?: number }>({})
  const { data: payrolls, isLoading } = usePayrolls(filters)
  const { mutate: approvePayroll } = useApprovePayroll()
  const { mutate: rejectPayroll } = useRejectPayroll()
  const [searchParams, setSearchParams] = useSearchParams()

  const linkedPayrollId = searchParams.get(PAYROLL_DETAIL_SEARCH_PARAM)
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)

  const activePayrollId = linkedPayrollId ?? selectedPayrollId

  const handleCloseDetail = useCallback(() => {
    setSelectedPayrollId(null)
    if (linkedPayrollId) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete(PAYROLL_DETAIL_SEARCH_PARAM)
      setSearchParams(nextParams, { replace: true })
    }
  }, [linkedPayrollId, searchParams, setSearchParams])

  const handleExport = useCallback(() => {
    if (payrolls && payrolls.length > 0) {
      exportPayrollsToCSV(payrolls, `payroll_export_${Date.now()}.csv`)
    }
  }, [payrolls])

  const handleApprove = useCallback(
    (id: string) => {
      approvePayroll(id)
    },
    [approvePayroll],
  )

  const handleReject = useCallback(
    (id: string) => {
      const reason = window.prompt("Nhập lý do từ chối:")
      if (reason) {
        rejectPayroll({ id, reason })
      }
    },
    [rejectPayroll],
  )

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredData = useMemo(() => {
    if (!payrolls) return []
    if (!searchTerm.trim()) return payrolls

    const lower = searchTerm.toLowerCase().trim()
    return payrolls.filter((item: IPayroll) => {
      const matchMonth =
        `tháng ${item.periodMonth}`.includes(lower) ||
        `${item.periodMonth}/${item.periodYear}`.includes(lower)
      const matchYear = String(item.periodYear).includes(lower)
      const matchStatus = item.status.toLowerCase().includes(lower)
      return matchMonth || matchYear || matchStatus
    })
  }, [payrolls, searchTerm])

  const totalPages = Math.ceil(filteredData.length / limit) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredData.slice(startIndex, startIndex + limit)
  }, [filteredData, page, limit])

  return {
    payrolls: paginatedData,
    rawPayrolls: payrolls,
    isLoading,
    totalItems: filteredData.length,
    totalPages,
    currentPage: page,
    setCurrentPage: setPage,
    pageSize: limit,
    setPageSize: setLimit,
    selectedPayrollId: activePayrollId,
    setSelectedPayrollId,
    handleCloseDetail,
    handleExport,
    handleApprove,
    handleReject,
    handleSearch,
  }
}
