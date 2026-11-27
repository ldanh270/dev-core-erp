import { PageContainer, PageHeader } from "@/components/common"
import { RoleCardsGrid } from "@/components/features/security/RoleCardsGrid"
import { RoleFormDialog } from "@/components/features/security/RoleFormDialog"
import { RoleMembersDrawer } from "@/components/features/security/RoleMembersDrawer"
import { Button } from "@/components/ui/button"
import { useRolesManagement } from "@/hooks/security/use-roles-management"
import { Plus } from "lucide-react"

/**
 * RolesManagement page component.
 * Pure orchestrator managing role listings, creation, edits, and member roster inspection.
 */
export default function RolesManagement() {
  const {
    roles,
    isLoadingRoles,
    isErrorRoles,
    refetchRoles,
    selectedRole,
    drawerPage,
    setDrawerPage,
    totalDrawerPages,
    roleMembers,
    isLoadingUsers,
    isErrorUsers,
    refetchUsers,
    isPlaceholderData,
    isCreateOpen,
    isEditOpen,
    editingRole,
    isCreatePending,
    isUpdatePending,
    handleOpenRoleDetail,
    handleCloseDrawer,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenEdit,
    handleCloseEdit,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
  } = useRolesManagement()

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Quản lý Vai trò"
        description="Xem, tạo mới và quản lý các vai trò trong hệ thống."
        actions={
          <Button onClick={handleOpenCreate} className="gap-1.5 rounded-full text-sm font-semibold">
            <Plus size={16} strokeWidth={2.5} />
            Thêm vai trò
          </Button>
        }
      />

      <RoleCardsGrid
        roles={roles}
        isLoading={isLoadingRoles}
        isError={isErrorRoles}
        onRetry={refetchRoles}
        onOpenDetail={handleOpenRoleDetail}
        onOpenEdit={handleOpenEdit}
        onDeleteRole={handleDeleteRole}
      />

      <RoleMembersDrawer
        selectedRole={selectedRole}
        onClose={handleCloseDrawer}
        members={roleMembers}
        isLoading={isLoadingUsers}
        isPlaceholderData={isPlaceholderData}
        isError={isErrorUsers}
        onRetry={refetchUsers}
        currentPage={drawerPage}
        totalPages={totalDrawerPages}
        onPageChange={setDrawerPage}
      />

      <RoleFormDialog
        open={isCreateOpen}
        mode="create"
        onOpenChange={handleCloseCreate}
        onSubmit={handleCreateRole}
        isPending={isCreatePending}
      />

      <RoleFormDialog
        open={isEditOpen}
        mode="edit"
        role={editingRole}
        onOpenChange={handleCloseEdit}
        onSubmit={handleUpdateRole}
        isPending={isUpdatePending}
      />
    </PageContainer>
  )
}
