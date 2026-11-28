import {
  PAYROLL_DETAIL_SEARCH_PARAM,
  PAYROLL_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { useMyPayslips } from "@/hooks/payroll/use-my-payslips"
import type { IPayslip } from "@/types/payroll.types"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useSearchParams } from "react-router-dom"

/**
 * Custom hook orchestrating employee personal payslip list, filters, and detail preview modal.
 */
export function useMyPayslipsManagement() {
  const { data: payslips, isLoading, refetch } = useMyPayslips()
  const [searchParams, setSearchParams] = useSearchParams()

  const linkedPayrollId = searchParams.get(PAYROLL_DETAIL_SEARCH_PARAM)
  const linkedPayslip = useMemo(
    () => payslips?.find(({ payrollId }) => payrollId === linkedPayrollId),
    [payslips, linkedPayrollId],
  )

  useEffect(() => {
    if (linkedPayrollId && !linkedPayslip) {
      void refetch()
    }
  }, [linkedPayrollId, linkedPayslip, refetch])

  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedPayslip, setSelectedPayslip] = useState<IPayslip | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const activePayslip = linkedPayslip ?? selectedPayslip
  const isDetailView = Boolean(linkedPayslip) || view === "detail"

  const handleCloseDetail = useCallback(() => {
    setView("list")
    setSelectedPayslip(null)
    if (linkedPayrollId) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete(PAYROLL_DETAIL_SEARCH_PARAM)
      setSearchParams(nextParams, { replace: true })
    }
  }, [linkedPayrollId, searchParams, setSearchParams])

  const handleSelectPayslip = useCallback((payslip: IPayslip) => {
    setSelectedPayslip(payslip)
    setView("detail")
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleLimitChange = useCallback((nextLimit: number) => {
    setLimit(nextLimit)
    setPage(1)
  }, [])

  const filteredPayslips = useMemo(() => {
    if (!payslips) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return payslips
    return payslips.filter((p) => {
      const periodStr = `${p.periodMonth}/${p.periodYear}`
      const periodStrZero = `${String(p.periodMonth).padStart(2, "0")}/${p.periodYear}`
      const statusStr = p.status ? (PAYROLL_STATUS_LABELS[p.status] ?? "").toLowerCase() : ""
      return periodStr.includes(s) || periodStrZero.includes(s) || statusStr.includes(s)
    })
  }, [payslips, searchTerm])

  const paginatedPayslips = useMemo(() => {
    return filteredPayslips.slice((page - 1) * limit, page * limit)
  }, [filteredPayslips, page, limit])

  const totalPages = Math.ceil(filteredPayslips.length / limit) || 1

  return {
    view: isDetailView ? ("detail" as const) : ("list" as const),
    selectedPayslip: activePayslip,
    searchTerm,
    page,
    limit,
    isLoading,
    paginatedPayslips,
    totalItems: filteredPayslips.length,
    totalPages,
    handleCloseDetail,
    handleSelectPayslip,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  }
}
