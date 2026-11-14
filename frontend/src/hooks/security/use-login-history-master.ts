import { useMyActivityLogs } from "@/hooks/security/queries/use-security-query"
import type { ActivityLogQuery } from "@/types/security.types"

import { useCallback, useEffect, useState } from "react"

import { useSearchParams } from "react-router-dom"

/**
 * Master hook for login history page
 * Manages filtering, pagination and URL synchronization
 */
export function useLoginHistoryMaster() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize query state from search params
  const [query, setQuery] = useState<ActivityLogQuery>({
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 10,
    actionType: searchParams.get("actionType") || undefined,
    fromDate: searchParams.get("fromDate") || undefined,
    toDate: searchParams.get("toDate") || undefined,
  })

  const [viewingLogId, setViewingLogId] = useState<string | null>(null)

  // Sync state to search params
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("page", String(query.page))
    params.set("limit", String(query.limit))
    if (query.actionType) params.set("actionType", query.actionType)
    if (query.fromDate) params.set("fromDate", query.fromDate)
    if (query.toDate) params.set("toDate", query.toDate)

    setSearchParams(params, { replace: true })
  }, [query, setSearchParams])

  const { data, isLoading, isFetching, isError, refetch } = useMyActivityLogs(query)

  const handleFilterChange = useCallback((updates: Partial<ActivityLogQuery>) => {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }))
  }, [])

  return {
    query,
    setQuery,
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
