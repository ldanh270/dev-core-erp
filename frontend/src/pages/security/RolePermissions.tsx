import { AppDrawer, PageCard, PageContainer, PageHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import {
  useRoles,
  useRolePermissions,
  useUpdateRolePermissions,
  usePermissions,
} from "@/hooks/security/queries/use-security-query"
import { useState, useMemo } from "react"
import type { Role, Permission } from "@/types/security.types"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FolderLock,
} from "lucide-react"
import { toast } from "sonner"

/**
 * RolePermissions Component.
 * Renders a list of system roles and allows configuring their permissions.
 * Includes a sidebar drawer with custom checkboxes, using a local state buffer 
 * to speed up interaction and save all permission changes in a single batch request.
 */
export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Queries
  const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles, refetch: refetchRoles } = useRoles()
  const { data: allPermissions } = usePermissions({ limit: 100 })

  // Fetch permissions of the selected role
  const { data: rolePermissions, isLoading: isLoadingRolePerms } = useRolePermissions(selectedRole?.id || "")

  const handleOpenRoleDetail = (role: Role) => {
    setSelectedRole(role)
  }

  const handleCloseDrawer = () => {
    setSelectedRole(null)
  }

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Cấu hình Quyền hạn"
        description="Xem danh sách các vai trò hệ thống và cấu hình chi tiết các quyền hạn tương ứng."
      />

      {/* Main Content */}
      {isLoadingRoles ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="h-9 w-9 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-4 font-medium">Đang tải danh sách vai trò...</p>
        </div>
      ) : isErrorRoles ? (
        <div className="py-12 max-w-md mx-auto text-center border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-6">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">Không thể lấy dữ liệu</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
            Hệ thống gặp sự cố khi tải thông tin vai trò. Vui lòng kiểm tra lại kết nối.
          </p>
          <Button variant="outline" size="sm" className="mt-4 h-8 text-xs font-semibold" onClick={() => { refetchRoles(); }}>
            Tải lại trang
          </Button>
        </div>
      ) : rolesData?.data.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl p-8 max-w-lg mx-auto">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">Không tìm thấy vai trò</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
            Không có vai trò nào được đăng ký trên hệ thống.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rolesData?.data.map((role: Role) => {
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
                      <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/30 font-mono">
                        SYSTEM
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground mb-1.5">
                    {ROLE_LABELS[role.name] || role.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                    {role.description || "Không có mô tả cho vai trò này."}
                  </p>
                </div>

                <div className="bg-muted/10 border-t border-border/60 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Có {role.permissionsCount ?? 0} quyền được gán
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full px-3 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5"
                    onClick={() => { handleOpenRoleDetail(role); }}
                  >
                    Cấu hình quyền
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </PageCard>
            )
          })}
        </div>
      )}

      {/* AppDrawer for Role Permissions */}
      <AppDrawer isOpen={!!selectedRole} onClose={handleCloseDrawer} widthClassName="w-full sm:max-w-[32rem]">
        {selectedRole && (
          isLoadingRolePerms ? (
            <div className="p-6 py-12 flex flex-col items-center justify-center">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-3">Đang tải cấu hình quyền...</p>
            </div>
          ) : (
            <RolePermissionsDrawerContent
              key={selectedRole.id}
              selectedRole={selectedRole}
              onClose={handleCloseDrawer}
              rolePermissions={rolePermissions || []}
              allPermissions={allPermissions?.data || []}
            />
          )
        )}
      </AppDrawer>
    </PageContainer>
  )
}

interface RolePermissionsDrawerContentProps {
  selectedRole: Role
  onClose: () => void
  rolePermissions: Permission[]
  allPermissions: Permission[]
}

/**
 * Subcomponent to render the drawer contents and manage local buffered permission changes.
 * Mounted with a unique 'key' prop to naturally reset state when switching roles.
 */
function RolePermissionsDrawerContent({
  selectedRole,
  onClose,
  rolePermissions,
  allPermissions,
}: RolePermissionsDrawerContentProps) {
  // Initialize state directly from props since key changing forces remount
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(() =>
    rolePermissions.map((rp) => rp.id)
  )
  const [prevRolePermissions, setPrevRolePermissions] = useState<Permission[]>(rolePermissions)

  // Sync state if background fetch loads newer rolePermissions
  if (rolePermissions !== prevRolePermissions) {
    setPrevRolePermissions(rolePermissions)
    setSelectedPermissionIds(rolePermissions.map((rp) => rp.id))
  }

  const updateRolePermissionsMutation = useUpdateRolePermissions()

  // Track if there are unsaved changes
  const hasChanges = useMemo(() => {
    const initialIds = rolePermissions.map((rp) => rp.id).sort()
    const currentIds = [...selectedPermissionIds].sort()
    return JSON.stringify(initialIds) !== JSON.stringify(currentIds)
  }, [rolePermissions, selectedPermissionIds])

  // Toggle permission mapping handler locally
  const handleTogglePermission = (permissionId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissionIds((prev) => prev.filter((id) => id !== permissionId))
    } else {
      setSelectedPermissionIds((prev) => [...prev, permissionId])
    }
  }

  // Batch save permissions
  const handleSavePermissions = async () => {
    try {
      await updateRolePermissionsMutation.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: selectedPermissionIds,
      })
      toast.success("Cập nhật quyền thành công")
      onClose()
    } catch {
      toast.error("Không thể cập nhật quyền")
    }
  }

  // Group all permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    allPermissions.forEach((p) => {
      const mod = p.module || "other"
      if (!groups[mod]) groups[mod] = []
      groups[mod].push(p)
    })
    return groups
  }, [allPermissions])

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <FolderLock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Cấu hình quyền: {ROLE_LABELS[selectedRole.name] || selectedRole.name}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            {selectedRole.description || "Không có mô tả."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 focus-visible:outline-none pr-1">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
              <div key={moduleName} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1 font-mono">
                  {moduleName}
                </h3>
                <div className="space-y-2.5">
                  {perms.map((p) => {
                    const isChecked = selectedPermissionIds.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/5"
                      >
                        <div className="flex flex-col pr-4">
                          <span className="text-xs font-bold text-foreground leading-snug">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {p.description || p.code}
                          </span>
                        </div>
                        <Switch
                          checked={!!isChecked}
                          disabled={selectedRole.isSystem && selectedRole.name === "admin"} // Disable changing admin permissions
                          onCheckedChange={() => handleTogglePermission(p.id, !!isChecked)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 pt-4 mt-6 flex items-center justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={updateRolePermissionsMutation.isPending}
            className="rounded-full text-xs font-semibold"
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSavePermissions}
            disabled={
              updateRolePermissionsMutation.isPending ||
              !hasChanges ||
              (selectedRole.isSystem && selectedRole.name === "admin")
            }
            className="rounded-full text-xs font-semibold"
          >
            {updateRolePermissionsMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  )
}
