import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { useUsersManagementMaster } from "@/hooks/security/use-users-management-master"
import { cn } from "@/lib/utils"

import { useMemo } from "react"

import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  User,
  Users as UsersIcon,
} from "lucide-react"

interface UserListItem {
  id?: string
  employeeId?: string
  fullName?: string
  employeeName?: string
  email?: string
  username?: string
  role?: string
  lockedUntil?: string | null
}

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

  const columns: DataTableColumn<UserListItem>[] = useMemo(
    () => [
      {
        id: "user",
        header: "Người dùng",
        minWidth: "260px",
        sticky: true,
        cell: (user) => {
          const isLocked =
            activeTab === "locked" || lockedUsers?.some((lu) => lu.employeeId === user.id)

          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center border transition-all shrink-0",
                  isLocked
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    : "bg-muted border-border text-muted-foreground",
                )}
              >
                <User size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-foreground truncate">
                  {user.fullName || user.employeeName}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user.email || user.username}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: "role",
        header: "Vai trò",
        minWidth: "140px",
        cell: (user) => (
          <StatusPill
            label={
              (user.role ? (ROLE_LABELS as Record<string, string>)[user.role] : undefined) || "N/A"
            }
            variant="neutral"
            className="font-medium"
          />
        ),
      },
      {
        id: "security",
        header: "Bảo mật",
        minWidth: "160px",
        cell: (user) => {
          const isLocked =
            activeTab === "locked" || lockedUsers?.some((lu) => lu.employeeId === user.id)

          return isLocked ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                <Lock size={12} />
                ĐÃ KHÓA
              </div>
              {user.lockedUntil && (
                <span className="text-[10px] text-muted-foreground">
                  Đến: {new Date(user.lockedUntil).toLocaleString("vi-VN")}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <ShieldCheck size={12} />
              AN TOÀN
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "",
        width: "120px",
        align: "right",
        cell: (user) => {
          const isLocked =
            activeTab === "locked" || lockedUsers?.some((lu) => lu.employeeId === user.id)

          if (!isLocked) return <span className="text-muted-foreground text-xs">—</span>

          return (
            <Button
              variant="outline"
              size="sm"
              className="border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 gap-1.5 text-xs font-semibold rounded-full"
              onClick={() => {
                const id = user.id || user.employeeId
                if (id) handleUnlock(id)
              }}
              disabled={unlockMutation.isPending}
            >
              <Unlock size={13} />
              Mở khóa
            </Button>
          )
        },
      },
    ],
    [activeTab, lockedUsers, handleUnlock, unlockMutation.isPending],
  )

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
