import { AppDrawer } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ROLE_LABELS } from "@/config/entities/employee.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useUpdateRolePermissions } from "@/hooks/security/queries/use-security-query"
import { cn } from "@/lib/utils"
import type { Permission, Role } from "@/types/security.types"

import { useMemo, useState } from "react"

import { FolderLock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

/**
 * Props for RolePermissionsDrawer component.
 */
export interface RolePermissionsDrawerProps {
  selectedRole: Role | null
  onClose: () => void
  rolePermissions?: Permission[]
  allPermissions?: Permission[]
  isLoadingRolePerms?: boolean
}

/**
 * Drawer component with permission switches grouped by resource module for configuring role rights.
 */
export function RolePermissionsDrawer({
  selectedRole,
  onClose,
  rolePermissions = [],
  allPermissions = [],
  isLoadingRolePerms = false,
}: RolePermissionsDrawerProps) {
  return (
    <AppDrawer
      isOpen={Boolean(selectedRole)}
      onClose={onClose}
      widthClassName="w-full sm:max-w-[32rem]"
    >
      {selectedRole &&
        (isLoadingRolePerms ? (
          <div className="p-6 py-12 flex flex-col items-center justify-center">
            <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-3">Đang tải cấu hình quyền...</p>
          </div>
        ) : (
          <RolePermissionsDrawerContent
            key={selectedRole.id}
            selectedRole={selectedRole}
            onClose={onClose}
            rolePermissions={rolePermissions}
            allPermissions={allPermissions}
          />
        ))}
    </AppDrawer>
  )
}

interface RolePermissionsDrawerContentProps {
  selectedRole: Role
  onClose: () => void
  rolePermissions: Permission[]
  allPermissions: Permission[]
}

function RolePermissionsDrawerContent({
  selectedRole,
  onClose,
  rolePermissions,
  allPermissions,
}: RolePermissionsDrawerContentProps) {
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(() =>
    rolePermissions.map((rp) => rp.id),
  )
  const [prevRolePermissions, setPrevRolePermissions] = useState<Permission[]>(rolePermissions)

  if (rolePermissions !== prevRolePermissions) {
    setPrevRolePermissions(rolePermissions)
    setSelectedPermissionIds(rolePermissions.map((rp) => rp.id))
  }

  const updateRolePermissionsMutation = useUpdateRolePermissions()

  const hasChanges = useMemo(() => {
    const initialIds = rolePermissions.map((rp) => rp.id).sort()
    const currentIds = [...selectedPermissionIds].sort()
    return JSON.stringify(initialIds) !== JSON.stringify(currentIds)
  }, [rolePermissions, selectedPermissionIds])

  const handleTogglePermission = (permissionId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissionIds((prev) => prev.filter((id) => id !== permissionId))
    } else {
      setSelectedPermissionIds((prev) => [...prev, permissionId])
    }
  }

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

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, Permission[]>()
    allPermissions.forEach((p) => {
      const mod = p.module || "other"
      const list = map.get(mod) ?? []
      list.push(p)
      map.set(mod, list)
    })
    return Object.fromEntries(map)
  }, [allPermissions])

  return (
    <div className="p-6 h-full flex flex-col justify-between">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-6 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <FolderLock className="h-5 w-5 text-primary" />
            <h2 className={cn(TYPOGRAPHY.MODAL_TITLE, "text-foreground")}>
              Cấu hình quyền: {ROLE_LABELS[selectedRole.name] || selectedRole.name}
            </h2>
          </div>
          <p className={cn(TYPOGRAPHY.MODAL_DESCRIPTION, "mt-1")}>
            {selectedRole.description || "Không có mô tả."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 focus-visible:outline-none pr-1">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
              <div key={moduleName} className="space-y-2">
                <h3
                  className={cn(
                    TYPOGRAPHY.TABLE_HEADER,
                    "text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1 font-mono",
                  )}
                >
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
                          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold leading-snug")}>
                            {p.name}
                          </span>
                          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-0.5")}>
                            {p.description || p.code}
                          </span>
                        </div>
                        <Switch
                          checked={Boolean(isChecked)}
                          disabled={selectedRole.isSystem && selectedRole.name === "admin"}
                          onCheckedChange={() => {
                            handleTogglePermission(p.id, Boolean(isChecked))
                          }}
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
