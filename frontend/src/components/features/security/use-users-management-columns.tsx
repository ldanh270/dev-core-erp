import type { DataTableColumn } from "@/components/common"
import { StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { cn } from "@/lib/utils"
import { Lock, ShieldCheck, Unlock, User } from "lucide-react"
import { useMemo } from "react"

/**
 * Data item representing a user in the Users Management table.
 */
export interface UserListItem {
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
 * Options for useUsersManagementColumns hook.
 */
export interface UseUsersManagementColumnsOptions {
  activeTab: "all" | "locked"
  lockedUsers?: Array<{ employeeId?: string }>
  handleUnlock: (id: string) => void
  isUnlockPending: boolean
}

function getRoleLabel(role?: string): string {
  if (!role) return "N/A"
  const match = Object.entries(ROLE_LABELS).find(([key]) => key === role)
  return match ? match[1] : role
}

/**
 * Custom hook constructing table column definitions for the Users & Security Management table.
 */
export function useUsersManagementColumns({
  activeTab,
  lockedUsers,
  handleUnlock,
  isUnlockPending,
}: UseUsersManagementColumnsOptions) {
  return useMemo<DataTableColumn<UserListItem>[]>(
    () => [
      {
        id: "user",
        header: "Người dùng",
        minWidth: getTableColWidthPx("EMPLOYEE"),
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
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
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
        minWidth: getTableColWidthPx("POSITION"),
        cell: (user) => (
          <StatusPill
            label={getRoleLabel(user.role)}
            variant="neutral"
            className="font-medium"
          />
        ),
      },
      {
        id: "security",
        header: "Bảo mật",
        minWidth: getTableColWidthPx("TYPE"),
        cell: (user) => {
          const isLocked =
            activeTab === "locked" || lockedUsers?.some((lu) => lu.employeeId === user.id)

          return isLocked ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-destructive font-bold text-[11px]">
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
            <div className="flex items-center gap-1.5 text-success font-bold text-[11px]">
              <ShieldCheck size={12} />
              AN TOÀN
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        align: "right",
        cell: (user) => {
          const isLocked =
            activeTab === "locked" || lockedUsers?.some((lu) => lu.employeeId === user.id)

          if (!isLocked) return <span className="text-muted-foreground text-xs">—</span>

          return (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive gap-1.5 text-xs font-semibold rounded-full"
              onClick={() => {
                const id = user.id || user.employeeId
                if (id) handleUnlock(id)
              }}
              disabled={isUnlockPending}
            >
              <Unlock size={13} />
              Mở khóa
            </Button>
          )
        },
      },
    ],
    [activeTab, lockedUsers, handleUnlock, isUnlockPending],
  )
}
