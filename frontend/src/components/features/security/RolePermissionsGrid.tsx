import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Role } from "@/types/security.types"

import { AlertTriangle, ArrowRight, Inbox, RefreshCw, Shield, ShieldCheck } from "lucide-react"

/**
 * Props for RolePermissionsGrid component.
 */
export interface RolePermissionsGridProps {
  roles?: Role[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpenRoleDetail: (role: Role) => void
}

/**
 * Presenter component displaying roles in grid format with permission configuration triggers.
 */
export function RolePermissionsGrid({
  roles = [],
  isLoading,
  isError,
  onRetry,
  onOpenRoleDetail,
}: RolePermissionsGridProps) {
  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-4 font-medium">
          Đang tải danh sách vai trò...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12 max-w-md mx-auto text-center border border-destructive/20 bg-destructive/10 rounded-xl p-6">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-bold text-destructive">Không thể lấy dữ liệu</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
          Hệ thống gặp sự cố khi tải thông tin vai trò. Vui lòng kiểm tra lại kết nối.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 h-8 rounded-full text-xs font-semibold"
          onClick={onRetry}
        >
          Tải lại trang
        </Button>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="py-24 text-center border border-dashed border-border rounded-xl p-8 max-w-lg mx-auto flex flex-col items-center justify-center">
        <div className="rounded-full bg-secondary p-3 mb-4 text-muted-foreground">
          <Inbox className="size-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Không tìm thấy vai trò</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
          Không có vai trò nào được đăng ký trên hệ thống.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {roles.map((role) => {
        const isSystemAdmin = role.isSystem && role.name === "admin"
        return (
          <PageCard
            key={role.id}
            className="overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isSystemAdmin ? <ShieldCheck size={20} /> : <Shield size={20} />}
                </div>
                {role.isSystem && (
                  <span className="text-[10px] font-semibold bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full font-mono">
                    SYSTEM
                  </span>
                )}
              </div>

              <h3 className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold text-foreground mb-1.5")}>
                {ROLE_LABELS[role.name] || role.name}
              </h3>
              <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "leading-normal line-clamp-2")}>
                {role.description || "Không có mô tả cho vai trò này."}
              </p>
            </div>

            <div className="bg-muted/10 border-t border-border/60 px-5 py-3.5 flex items-center justify-between">
              <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "font-medium")}>
                Có {role.permissionsCount ?? 0} quyền được gán
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full px-3 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => onOpenRoleDetail(role)}
              >
                Cấu hình quyền
                <ArrowRight size={13} />
              </Button>
            </div>
          </PageCard>
        )
      })}
    </div>
  )
}
