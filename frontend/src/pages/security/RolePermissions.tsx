import { PageContainer, PageHeader } from "@/components/common"
import { RolePermissionsDrawer } from "@/components/features/security/RolePermissionsDrawer"
import { RolePermissionsGrid } from "@/components/features/security/RolePermissionsGrid"
import { useRolePermissionsManagement } from "@/hooks/security/use-role-permissions-management"

/**
 * RolePermissions page component.
 * Pure orchestrator managing role permissions configuration and drawer state.
 */
export default function RolePermissions() {
  const {
    selectedRole,
    roles,
    isLoadingRoles,
    isErrorRoles,
    refetchRoles,
    allPermissions,
    rolePermissions,
    isLoadingRolePerms,
    handleOpenRoleDetail,
    handleCloseDrawer,
  } = useRolePermissionsManagement()

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Cấu hình Quyền hạn"
        description="Xem danh sách các vai trò hệ thống và cấu hình chi tiết các quyền hạn tương ứng."
      />

      <RolePermissionsGrid
        roles={roles}
        isLoading={isLoadingRoles}
        isError={isErrorRoles}
        onRetry={() => {
          void refetchRoles()
        }}
        onOpenRoleDetail={handleOpenRoleDetail}
      />

      <RolePermissionsDrawer
        selectedRole={selectedRole}
        onClose={handleCloseDrawer}
        rolePermissions={rolePermissions}
        allPermissions={allPermissions}
        isLoadingRolePerms={isLoadingRolePerms}
      />
    </PageContainer>
  )
}
