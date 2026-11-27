import { AppDrawer, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { EMPLOYEE_STATUS_VARIANTS, ROLE_LABELS } from "@/config/entities/employee.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"
import type { Role } from "@/types/security.types"
import { AlertTriangle, FolderLock, Inbox, RefreshCw, User } from "lucide-react"

/**
 * Props for RoleMembersDrawer component.
 */
export interface RoleMembersDrawerProps {
  selectedRole: Role | null
  onClose: () => void
  members: Employee[]
  isLoading: boolean
  isPlaceholderData?: boolean
  isError: boolean
  onRetry: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Drawer presenting paginated list of employees assigned to a specific role.
 */
export function RoleMembersDrawer({
  selectedRole,
  onClose,
  members,
  isLoading,
  isPlaceholderData,
  isError,
  onRetry,
  currentPage,
  totalPages,
  onPageChange,
}: RoleMembersDrawerProps) {
  return (
    <AppDrawer isOpen={!!selectedRole} onClose={onClose} widthClassName="w-full sm:max-w-[32rem]">
      <div className="p-6 h-full flex flex-col justify-between">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-6 pt-6">
            <div className="flex items-center gap-2 mb-1">
              <FolderLock className="h-5 w-5 text-primary" />
              <h2 className={cn(TYPOGRAPHY.MODAL_TITLE, "text-foreground")}>
                Nhân sự: {selectedRole ? ROLE_LABELS[selectedRole.name] || selectedRole.name : ""}
              </h2>
            </div>
            <p className={cn(TYPOGRAPHY.MODAL_DESCRIPTION, "mt-1")}>
              {selectedRole?.description || "Không có mô tả."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 focus-visible:outline-none">
            {isLoading || isPlaceholderData ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-3">Đang tải danh sách nhân sự...</p>
              </div>
            ) : isError ? (
              <div className="py-12 text-center bg-destructive/10 border border-destructive/20 rounded-xl p-5">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <h4 className="text-sm font-bold text-destructive">Không thể tải dữ liệu</h4>
                <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1")}>
                  Đã có lỗi xảy ra khi truy xuất thông tin.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 text-xs rounded-full"
                  onClick={onRetry}
                >
                  Thử lại
                </Button>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
                  <Inbox className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Trống</h4>
                <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1")}>
                  Không có nhân sự nào giữ vai trò này.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-3.5 border border-border/80 rounded-xl bg-muted/5 flex items-center justify-between hover:bg-muted/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 border border-border">
                        {employee.avatar?.url ? (
                          <img
                            src={employee.avatar.url}
                            alt={employee.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={15} strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground leading-snug">
                          {employee.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono leading-none">
                          {employee.username}
                        </span>
                      </div>
                    </div>

                    <StatusPill
                      label={
                        employee.status === "active"
                          ? "Đang làm việc"
                          : employee.status === "inactive"
                            ? "Tạm nghỉ"
                            : employee.status === "on_leave"
                              ? "Nghỉ phép"
                              : "Đã nghỉ"
                      }
                      variant={EMPLOYEE_STATUS_VARIANTS[employee.status] ?? "neutral"}
                      className="text-[10px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Trang <span className="text-foreground font-semibold">{currentPage}</span> /{" "}
              {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3 text-[11px] font-semibold"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3 text-[11px] font-semibold"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppDrawer>
  )
}
