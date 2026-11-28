import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Role } from "@/types/security.types"

import {
  AlertTriangle,
  ArrowRight,
  Edit2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from "lucide-react"

/**
 * Props for RoleCardsGrid component.
 */
export interface RoleCardsGridProps {
  roles: Role[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpenDetail: (role: Role) => void
  onOpenEdit: (role: Role) => void
  onDeleteRole: (roleId: string) => void
}

function getRoleIcon(name: string) {
  if (name === "admin") return ShieldAlert
  if (name === "general_manager") return ShieldCheck
  if (name === "hr_manager") return Shield
  if (name === "team_leader") return Users
  if (name === "employee") return User
  return Shield
}

/**
 * Presenter component displaying roles in grid format with edit, delete, and view members actions.
 */
export function RoleCardsGrid({
  roles,
  isLoading,
  isError,
  onRetry,
  onOpenDetail,
  onOpenEdit,
  onDeleteRole,
}: RoleCardsGridProps) {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải danh sách vai trò...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Không thể tải thông tin vai trò. Vui lòng thử lại sau.
        </p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {roles.map((role: Role) => {
        const count = role.employeesCount ?? 0
        const isSystem = role.isSystem
        const IconComponent = getRoleIcon(role.name)

        return (
          <PageCard
            key={role.id}
            className="flex flex-col h-full hover:shadow-md transition-shadow"
          >
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <IconComponent size={20} />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {role.name}
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h3 className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold text-foreground mb-1")}>
                    {ROLE_LABELS[role.name] || role.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {role.isDefault && (
                      <span className="text-xs font-semibold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                    {isSystem && (
                      <span className="text-xs font-semibold bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full">
                        Hệ thống
                      </span>
                    )}
                  </div>
                </div>
                <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "line-clamp-3 mb-4 mt-1")}>
                  {role.description || "Chưa có mô tả cho vai trò này."}
                </p>
              </div>

              <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span
                    className={cn(
                      TYPOGRAPHY.TABLE_HEADER,
                      "text-[10px] uppercase font-bold tracking-wider",
                    )}
                  >
                    Nhân sự
                  </span>
                  <span className="text-lg font-extrabold text-foreground">{count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                      onClick={() => {
                        onOpenEdit(role)
                      }}
                      aria-label={`Chỉnh sửa vai trò ${ROLE_LABELS[role.name] || role.name}`}
                    >
                      <Edit2 size={13} />
                    </Button>
                  )}
                  {!isSystem && role.name !== "admin" && !role.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        onDeleteRole(role.id)
                      }}
                      aria-label={`Xóa vai trò ${ROLE_LABELS[role.name] || role.name}`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2.5 rounded-full text-xs text-primary hover:text-primary hover:bg-primary/5"
                    onClick={() => {
                      onOpenDetail(role)
                    }}
                  >
                    Xem chi tiết
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </PageCard>
        )
      })}
    </div>
  )
}
