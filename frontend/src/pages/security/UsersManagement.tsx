import { AppPagination, PageCard, PageContainer, PageHeader, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { useUsersManagementMaster } from "@/hooks/security/use-users-management-master"
import { cn } from "@/lib/utils"

import {
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
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

/**
 * UsersManagement Component.
 * Manages user security status, roles, and account locks with server-side pagination.
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
    isError,
    refetch,
    handleUnlock,
    unlockMutation,
    total,
    totalPages,
  } = useUsersManagementMaster()

  const rows = (displayData ?? []) as UserListItem[]

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải danh sách người dùng...</p>
      </div>
      </PageContainer>
    )
  }

  if (isError || (!displayData && activeTab === "locked")) {
    return (
      <PageContainer variant="default">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải thông tin người dùng. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { refetch(); }}>
            Thử lại
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Quản lý người dùng & Bảo mật"
        description="Giám sát trạng thái tài khoản, vai trò và xử lý khóa truy cập."
      />

      <PageCard className="overflow-hidden" padding="sm">
        {/* Tab Switcher */}
        <nav className="flex items-end gap-0 px-5 border-b border-border">
          <button
            onClick={() => { handleTabChange("all"); }}
            className={cn(
              "relative py-4 px-4 text-[13px] font-medium transition-colors",
              activeTab === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <UsersIcon size={14} />
              Tất cả người dùng
              <span className="bg-muted px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                {allUsers?.meta.total || 0}
              </span>
            </span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
            )}
          </button>
          
          <button
            onClick={() => { handleTabChange("locked"); }}
            className={cn(
              "relative py-4 px-4 text-[13px] font-medium transition-colors",
              activeTab === "locked" ? "text-rose-600" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <Lock size={14} />
              Tài khoản bị khóa
              {lockedUsers && lockedUsers.length > 0 && (
                <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                  {lockedUsers.length}
                </span>
              )}
            </span>
            {activeTab === "locked" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-rose-500" />
            )}
          </button>
        </nav>

        {/* Toolbar */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm người dùng..."
              className="pl-8 rounded-full text-xs"
              value={search}
              onChange={handleSearch}
            />
          </div>
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="h-10 px-5 py-3 text-left">Người dùng</th>
                <th className="h-10 px-5 py-3 text-left">Vai trò</th>
                <th className="h-10 px-5 py-3 text-left">Bảo mật</th>
                <th className="h-10 px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayData?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center text-muted-foreground">
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                rows.map((user) => {
                  const isLocked = activeTab === "locked" || lockedUsers?.some(lu => lu.employeeId === user.id)
                  
                  return (
                    <tr key={user.id || user.employeeId} className="group hover:bg-muted/30 transition-colors">
                      <td className="h-[60px] px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center border transition-all",
                            isLocked ? "bg-rose-50 border-rose-200 text-rose-500" : "bg-muted border-border text-muted-foreground"
                          )}>
                            <User size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-foreground">
                              {user.fullName || user.employeeName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {user.email || user.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="h-[60px] px-5 py-3">
                        <StatusPill 
                          label={(user.role ? (ROLE_LABELS as Record<string, string>)[user.role] : undefined) || "N/A"} 
                          variant="neutral" 
                          className="font-medium"
                        />
                      </td>
                      <td className="h-[60px] px-5 py-3">
                        {isLocked ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px]">
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
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                            <ShieldCheck size={12} />
                            AN TOÀN
                          </div>
                        )}
                      </td>
                      <td className="h-[60px] px-5 py-3 text-right">
                        {isLocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 gap-1.5 text-xs font-semibold rounded-full"
                            onClick={() => {
                              const id = user.id || user.employeeId
                              if (id) handleUnlock(id)
                            }}
                            disabled={unlockMutation.isPending}
                          >
                            <Unlock size={13} />
                            Mở khóa
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="border-t border-border">
            <AppPagination
              currentPage={query.page || 1}
              totalPages={totalPages}
              onPageChange={(p) => { setQuery((prev) => ({ ...prev, page: p })); }}
              totalItems={total}
              itemsPerPage={query.limit || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT}
              onItemsPerPageChange={(limit) => { setQuery((prev) => ({ ...prev, limit, page: 1 })); }}
            />
          </div>
        )}
      </PageCard>
    </PageContainer>
  )
}
