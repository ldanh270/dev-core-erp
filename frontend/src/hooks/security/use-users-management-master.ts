import { type IUsersManagementTab, USERS_MANAGEMENT_TABS } from "@/config/entities/security.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { useLockedAccounts, useUnlockAccount } from "@/hooks/security/queries/use-security-query"
import { useDebounce } from "@/hooks/use-debounce"
import type { EmployeeListQuery } from "@/types/employee.types"

import { useCallback, useMemo, useState } from "react"

import { toast } from "sonner"

/**
 * Master hook for the Users Management dashboard page.
 * Combines logic for viewing all employees, filtering locked accounts,
 * unlocking accounts, handling tabs, and client/server-side pagination.
 */
export function useUsersManagementMaster() {
  const [activeTab, setActiveTab] = useState<IUsersManagementTab>(USERS_MANAGEMENT_TABS.ALL)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)

  const [query, setQuery] = useState<EmployeeListQuery>({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT,
  })

  // Queries
  const {
    data: allUsers,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    refetch: refetchAll,
  } = useEmployees({
    ...query,
    search: debouncedSearch || undefined,
  })

  const {
    data: lockedUsers,
    isLoading: isLoadingLocked,
    isError: isErrorLocked,
    refetch: refetchLocked,
  } = useLockedAccounts()

  const unlockMutation = useUnlockAccount()

  // Unlock user handler (preserves pagination query state)
  const handleUnlock = useCallback(
    async (id: string) => {
      try {
        await unlockMutation.mutateAsync(id)
        toast.success("Đã mở khóa tài khoản thành công")
      } catch {
        toast.error("Không thể mở khóa tài khoản")
      }
    },
    [unlockMutation],
  )

  // Filters locked users based on search
  const filteredLockedUsers = useMemo(() => {
    if (!lockedUsers) return []
    if (!search) return lockedUsers
    const lower = search.toLowerCase()
    return lockedUsers.filter(
      (u) =>
        (u.employeeName || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower),
    )
  }, [lockedUsers, search])

  // Paginates locked users on the client side
  const paginatedLockedUsers = useMemo(() => {
    const limit = query.limit || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
    const start = ((query.page || 1) - 1) * limit
    const end = start + limit
    return filteredLockedUsers.slice(start, end)
  }, [filteredLockedUsers, query.page, query.limit])

  // Reset pagination on search input changes
  const handleSearch = useCallback((valueOrEvent: React.ChangeEvent<HTMLInputElement> | string) => {
    const val = typeof valueOrEvent === "string" ? valueOrEvent : valueOrEvent.target.value
    setSearch(val)
    setQuery((prev) => ({ ...prev, page: 1 }))
  }, [])

  // Reset pagination on tab switches
  const handleTabChange = useCallback((tab: IUsersManagementTab) => {
    setActiveTab(tab)
    setQuery((prev) => ({ ...prev, page: 1 }))
  }, [])

  // Unified loading & error states
  const isLoading = activeTab === USERS_MANAGEMENT_TABS.ALL ? isLoadingAll : isLoadingLocked
  const isError = activeTab === USERS_MANAGEMENT_TABS.ALL ? isErrorAll : isErrorLocked
  const refetch = activeTab === USERS_MANAGEMENT_TABS.ALL ? refetchAll : refetchLocked

  // Paginated display data selection
  const displayData =
    activeTab === USERS_MANAGEMENT_TABS.ALL ? allUsers?.data : paginatedLockedUsers

  // Pagination metrics
  const total =
    activeTab === USERS_MANAGEMENT_TABS.ALL
      ? (allUsers?.meta.total ?? 0)
      : filteredLockedUsers.length
  const totalPages =
    activeTab === USERS_MANAGEMENT_TABS.ALL
      ? (allUsers?.meta.totalPages ?? 0)
      : Math.ceil(
          filteredLockedUsers.length / (query.limit || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT),
        )

  const limit = query.limit || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const pageStart = ((query.page || 1) - 1) * limit + (displayData?.length ? 1 : 0)
  const pageEnd = ((query.page || 1) - 1) * limit + (displayData?.length || 0)

  const visiblePages = useMemo(() => {
    return Array.from(
      { length: Math.min(SYSTEM_CONFIG.PAGINATION.MAX_VISIBLE_PAGES, totalPages) },
      (_, i) => i + 1,
    )
  }, [totalPages])

  return {
    query,
    setQuery,
    activeTab,
    handleTabChange,
    search,
    handleSearch,
    displayData,
    allUsers,
    lockedUsers,
    isLoading,
    isError,
    refetch,
    handleUnlock,
    unlockMutation,
    total,
    totalPages,
    pageStart,
    pageEnd,
    visiblePages,
  }
}
