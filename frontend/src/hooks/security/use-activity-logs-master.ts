import { useActivityLogs } from "@/hooks/security/queries/use-security-query"
import { useDebounce } from "@/hooks/use-debounce"
import type { ActivityLogQuery } from "@/types/security.types"

import { useCallback, useEffect, useState } from "react"

import { useSearchParams } from "react-router-dom"

/**
 * Master hook for managing Activity Logs page state and logic.
 * Handles pagination, filtering, search, and detail viewing with URL search parameters synchronization.
 */
export function useActivityLogsMaster() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryParam = searchParams.get("category") || undefined
  const actionTypeParam = searchParams.get("actionType") || undefined
  const fromDateParam = searchParams.get("fromDate") || undefined
  const toDateParam = searchParams.get("toDate") || undefined
  const pageRaw = searchParams.get("page")
  const pageParam = pageRaw ? parseInt(pageRaw, 10) : 1

  const [query, setQuery] = useState<ActivityLogQuery>({
    page: pageParam,
    limit: 20,
    category: categoryParam,
    actionType: actionTypeParam,
    fromDate: fromDateParam,
    toDate: toDateParam,
  })

  const [searchTerm, setSearchText] = useState("")
  const [viewingLogId, setViewingLogId] = useState<string | null>(null)

  // Sync search term with query using debounce
  const debouncedSearch = useDebounce(searchTerm, 500)

  const { data, isLoading, isFetching, isError, refetch } = useActivityLogs({
    ...query,
    employeeId: debouncedSearch || undefined, // Simple search by employeeId for now
  })

  // Synchronize state with URL search params on change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.category) params.set("category", query.category)
    if (query.actionType) params.set("actionType", query.actionType)
    if (query.fromDate) params.set("fromDate", query.fromDate)
    if (query.toDate) params.set("toDate", query.toDate)
    if (query.page && query.page > 1) params.set("page", query.page.toString())

    const newStr = params.toString()
    const currentStr = searchParams.toString()
    if (newStr !== currentStr) {
      setSearchParams(params, { replace: true })
    }
  }, [
    query.actionType,
    query.category,
    query.fromDate,
    query.page,
    query.toDate,
    searchParams,
    setSearchParams,
  ])

  // Synchronize URL search params to local state (e.g. back/forward navigation or dashboard click)
  useEffect(() => {
    setQuery((prev) => {
      if (
        prev.category === categoryParam &&
        prev.actionType === actionTypeParam &&
        prev.fromDate === fromDateParam &&
        prev.toDate === toDateParam &&
        prev.page === pageParam
      ) {
        return prev
      }
      return {
        ...prev,
        category: categoryParam,
        actionType: actionTypeParam,
        fromDate: fromDateParam,
        toDate: toDateParam,
        page: pageParam,
      }
    })
  }, [actionTypeParam, categoryParam, fromDateParam, pageParam, toDateParam])

  const handleSearch = useCallback((valueOrEvent: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof valueOrEvent === "string" ? valueOrEvent : valueOrEvent.target.value
    setSearchText(value)
    setQuery((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleFilterChange = useCallback(
    (key: keyof ActivityLogQuery, value: ActivityLogQuery[keyof ActivityLogQuery]) => {
      setQuery((prev) => ({ ...prev, [key]: value, page: 1 }))
    },
    [],
  )

  return {
    query,
    setQuery,
    searchTerm,
    handleSearch,
    handleFilterChange,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}
