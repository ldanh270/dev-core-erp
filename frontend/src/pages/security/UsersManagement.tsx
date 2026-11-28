import { DataTablePage } from "@/components/common"
import { UsersManagementStatusLegend } from "@/components/features/security/UsersManagementStatusLegend"
import {
  type UserListItem,
  useUsersManagementColumns,
} from "@/components/features/security/use-users-management-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useUsersManagementMaster } from "@/hooks/security/use-users-management-master"

import { useMemo } from "react"

import { Lock, Users as UsersIcon } from "lucide-react"

/**
 * UsersManagement page component.
 * Pure orchestrator managing user accounts, lockout monitoring, and credential unlock flows.
 */
export default function UsersManagement() {
  const {
    setQuery,
    currentPage,
    pageSize,
    activeTab,
    handleTabChange,
    search,
    handleSearch,
    displayData,
    allUsers,
    lockedUsers,
    isLoading,
    handleUnlock,
    unlockMutation,
    total,
    totalPages,
  } = useUsersManagementMaster()

  const rows = (displayData ?? []) as UserListItem[]

  const columns = useUsersManagementColumns({
    activeTab,
    lockedUsers,
    handleUnlock,
    isUnlockPending: unlockMutation.isPending,
  })

  const tabsConfig = useMemo(
    () => ({
      items: [
        {
          id: "all",
          label: "Tất cả người dùng",
          count: allUsers?.meta.total || SYSTEM_CONFIG.PAGINATION.EMPTY_COUNT,
          icon: UsersIcon,
        },
        {
          id: "locked",
          label: "Tài khoản bị khóa",
          count: lockedUsers?.length || SYSTEM_CONFIG.PAGINATION.EMPTY_COUNT,
          icon: Lock,
        },
      ],
      activeTab,
      onTabChange: (id: string) => {
        handleTabChange(id as "all" | "locked")
      },
    }),
    [activeTab, allUsers?.meta.total, lockedUsers?.length, handleTabChange],
  )

  return (
    <DataTablePage<UserListItem>
      title="Quản lý người dùng & Bảo mật"
      description="Giám sát trạng thái tài khoản, vai trò và xử lý khóa truy cập."
      variant="viewport"
      data={rows}
      columns={columns}
      isLoading={isLoading}
      tabs={tabsConfig}
      keyExtractor={(user) => user.id || user.employeeId || ""}
      search={{
        value: search,
        onSearch: (val: string) => {
          handleSearch(val)
        },
        placeholder: "Tìm kiếm người dùng...",
      }}
      toolbarActions={<UsersManagementStatusLegend />}
      emptyState={{
        icon: UsersIcon,
        title: "Không có người dùng nào",
        description: "Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.",
      }}
      pagination={
        total > 0
          ? {
              currentPage,
              totalPages,
              totalItems: total,
              itemsPerPage: pageSize,
              onPageChange: (p) => {
                setQuery((prev) => ({ ...prev, page: p }))
              },
              onItemsPerPageChange: (limit) => {
                setQuery((prev) => ({
                  ...prev,
                  limit,
                  page: SYSTEM_CONFIG.PAGINATION.DEFAULT_PAGE,
                }))
              },
              pageSizeOptions: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS as unknown as number[],
            }
          : undefined
      }
    />
  )
}
