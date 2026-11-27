import { PageContainer, PageHeader } from "@/components/common"
import { RolePermissionsDrawer } from "@/components/features/security/RolePermissionsDrawer"
import { RolePermissionsGrid } from "@/components/features/security/RolePermissionsGrid"
import {
  usePermissions,
  useRolePermissions,
  useRoles,
} from "@/hooks/security/queries/use-security-query"
import type { Role } from "@/types/security.types"
import { useState } from "react"

/**
 * RolePermissions page component.
 * Pure orchestrator managing role permissions configuration and drawer state.
 */
export default function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    refetch: refetchRoles,
  } = useRoles()

  const { data: allPermissions } = usePermissions({ limit: 100 })

  const { data: rolePermissions, isLoading: isLoadingRolePerms } = useRolePermissions(
    selectedRole?.id || "",
  )

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Cấu hình Quyền hạn"
        description="Xem danh sách các vai trò hệ thống và cấu hình chi tiết các quyền hạn tương ứng."
      />

      <RolePermissionsGrid
        roles={rolesData?.data}
        isLoading={isLoadingRoles}
        isError={isErrorRoles}
        onRetry={() => {
          void refetchRoles()
        }}
        onOpenRoleDetail={(role) => {
          setSelectedRole(role)
        }}
      />

      <RolePermissionsDrawer
        selectedRole={selectedRole}
        onClose={() => {
          setSelectedRole(null)
        }}
        rolePermissions={rolePermissions || []}
        allPermissions={allPermissions?.data || []}
        isLoadingRolePerms={isLoadingRolePerms}
      />
    </PageContainer>
  )
}
