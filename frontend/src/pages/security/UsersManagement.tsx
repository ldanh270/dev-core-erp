import { DataTablePage } from "@/components/common"
import {
  type UserListItem,
  useUsersManagementColumns,
} from "@/components/features/security/use-users-management-columns"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useUsersManagementMaster } from "@/hooks/security/use-users-management-master"
import { Lock, ShieldAlert, ShieldCheck, Users as UsersIcon } from "lucide-react"
import { useMemo } from "react"

/**
 * UsersManagement page component.
 * Pure orchestrator managing user accounts, lockout monitoring, and credential unlock flows.
 */
export default function UsersManagement() {
  const {
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
          count: allUsers?.meta.total || 0,
          icon: UsersIcon,
        },
        {
          id: "locked",
          label: "Tài khoản bị khóa",
          count: lockedUsers?.length || 0,
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
      toolbarActions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Hoạt động</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert size={12} className="text-rose-500" />
            <span>Bị khóa</span>
          </div>
        </div>
      }
      emptyState={{
        icon: UsersIcon,
        title: "Không có người dùng nào",
        description: "Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.",
      }}
      pagination={
        total > 0
          ? {
              currentPage: query.page || 1,
              totalPages,
              totalItems: total,
              itemsPerPage: query.limit || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT,
              onPageChange: (p) => {
                setQuery((prev) => ({ ...prev, page: p }))
              },
              onItemsPerPageChange: (limit) => {
                setQuery((prev) => ({ ...prev, limit, page: 1 }))
              },
            }
          : undefined
      }
    />
  )
}
