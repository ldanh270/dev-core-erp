import { useSearchParams } from "react-router-dom"
import { useState, useCallback, useEffect } from "react"

const ALL_FILTER_VALUE = "all"

/**
 * Custom Hook to handle task filters with two-way URL query parameters synchronization.
 * Updates browser URL when filters change and initializes filters from URL query parameters.
 */
export function useTaskUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [issueSearch, setIssueSearchState] = useState(() => searchParams.get("search") || "")
  const [trackerFilter, setTrackerFilterState] = useState(() => searchParams.get("tracker") || ALL_FILTER_VALUE)
  const [statusFilter, setStatusFilterState] = useState(() => searchParams.get("statusId") || ALL_FILTER_VALUE)
  const [priorityFilter, setPriorityFilterState] = useState(() => searchParams.get("priority") || ALL_FILTER_VALUE)
  const [assigneeFilter, setAssigneeFilterState] = useState(() => searchParams.get("assigneeId") || ALL_FILTER_VALUE)
  const [createdByIdFilter, setCreatedByIdFilterState] = useState(() => searchParams.get("createdById") || ALL_FILTER_VALUE)
  const [currentPage, setCurrentPageState] = useState(() => Number(searchParams.get("page")) || 1)
  const [pageSize, setPageSizeState] = useState(() => Number(searchParams.get("limit")) || 25)

  // Sync state changes to URL query params
  const updateUrlParams = useCallback(
    (paramsObj: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prevParams) => {
          const newParams = new URLSearchParams(prevParams)
          Object.entries(paramsObj).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === ALL_FILTER_VALUE ||
              (key === "page" && Number(val) === 1) ||
              (key === "limit" && Number(val) === 25)
            ) {
              newParams.delete(key)
            } else {
              newParams.set(key, String(val))
            }
          })
          return newParams
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // External listener when searchParams change externally (e.g. back/forward navigation or custom query application)
   
  useEffect(() => {
    setIssueSearchState(searchParams.get("search") || "")
    setTrackerFilterState(searchParams.get("tracker") || ALL_FILTER_VALUE)
    setStatusFilterState(searchParams.get("statusId") || ALL_FILTER_VALUE)
    setPriorityFilterState(searchParams.get("priority") || ALL_FILTER_VALUE)
    setAssigneeFilterState(searchParams.get("assigneeId") || ALL_FILTER_VALUE)
    setCreatedByIdFilterState(searchParams.get("createdById") || ALL_FILTER_VALUE)
    setCurrentPageState(Number(searchParams.get("page")) || 1)
    setPageSizeState(Number(searchParams.get("limit")) || 25)
  }, [searchParams])

  const setIssueSearch = (val: string) => {
    setIssueSearchState(val)
    updateUrlParams({ search: val, page: 1 })
  }

  const setTrackerFilter = (val: string) => {
    setTrackerFilterState(val)
    updateUrlParams({ tracker: val, page: 1 })
  }

  const setStatusFilter = (val: string) => {
    setStatusFilterState(val)
    updateUrlParams({ statusId: val, page: 1 })
  }

  const setPriorityFilter = (val: string) => {
    setPriorityFilterState(val)
    updateUrlParams({ priority: val, page: 1 })
  }

  const setAssigneeFilter = (val: string) => {
    setAssigneeFilterState(val)
    updateUrlParams({ assigneeId: val, page: 1 })
  }

  const setCreatedByIdFilter = (val: string) => {
    setCreatedByIdFilterState(val)
    updateUrlParams({ createdById: val, page: 1 })
  }

  const setCurrentPage = (val: number | ((prev: number) => number)) => {
    setCurrentPageState((prev) => {
      const next = typeof val === "function" ? val(prev) : val
      updateUrlParams({ page: next })
      return next
    })
  }

  const setPageSize = (val: number) => {
    setPageSizeState(val)
    updateUrlParams({ limit: val, page: 1 })
  }

  return {
    issueSearch,
    setIssueSearch,
    trackerFilter,
    setTrackerFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    createdByIdFilter,
    setCreatedByIdFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    setStatusFilterState,
    setTrackerFilterState,
    setPriorityFilterState,
    setAssigneeFilterState,
    setCreatedByIdFilterState,
  }
}
