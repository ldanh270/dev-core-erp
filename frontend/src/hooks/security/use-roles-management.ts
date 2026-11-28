import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "@/hooks/security/queries/use-security-query"
import type { Role } from "@/types/security.types"

import { useCallback, useState } from "react"

import { toast } from "sonner"

/**
 * Custom hook orchestrating role definitions, create/edit modals, member lists, and deletion mutations.
 */
export function useRolesManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [drawerPage, setDrawerPage] = useState(1)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    refetch: refetchRoles,
  } = useRoles()

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const {
    data: roleUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
    isPlaceholderData,
  } = useEmployees(
    {
      roleId: selectedRole?.id || undefined,
      page: drawerPage,
      limit: 8,
    },
    {
      enabled: !!selectedRole?.id,
    },
  )

  const handleOpenRoleDetail = useCallback((role: Role) => {
    setSelectedRole(role)
    setDrawerPage(1)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedRole(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleCloseCreate = useCallback((open: boolean) => {
    setIsCreateOpen(open)
  }, [])

  const handleOpenEdit = useCallback((role: Role) => {
    setEditingRole(role)
    setIsEditOpen(true)
  }, [])

  const handleCloseEdit = useCallback((open: boolean) => {
    setIsEditOpen(open)
    if (!open) {
      setEditingRole(null)
    }
  }, [])

  const handleCreateRole = useCallback(
    async (payload: { name: string; description: string; isDefault: boolean }) => {
      try {
        await createRoleMutation.mutateAsync({
          name: payload.name.trim().toLowerCase().replace(/\s+/g, "_"),
          description: payload.description.trim(),
          isDefault: payload.isDefault,
        })
        toast.success("Tạo vai trò mới thành công")
        setIsCreateOpen(false)
      } catch {
        toast.error("Không thể tạo vai trò")
      }
    },
    [createRoleMutation],
  )

  const handleUpdateRole = useCallback(
    async (payload: { name: string; description: string; isDefault: boolean }) => {
      if (!editingRole) return
      try {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          data: {
            name: payload.name.trim().toLowerCase().replace(/\s+/g, "_"),
            description: payload.description.trim(),
            isDefault: payload.isDefault,
          },
        })
        toast.success("Cập nhật vai trò thành công")
        setIsEditOpen(false)
        if (selectedRole?.id === editingRole.id) {
          setSelectedRole({
            ...selectedRole,
            name: payload.name,
            description: payload.description,
            isDefault: payload.isDefault,
          })
        }
      } catch {
        toast.error("Không thể cập nhật vai trò")
      }
    },
    [editingRole, selectedRole, updateRoleMutation],
  )

  const handleDeleteRole = useCallback(
    async (id: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.")) {
        return
      }
      try {
        await deleteRoleMutation.mutateAsync(id)
        toast.success("Xóa vai trò thành công")
        if (selectedRole?.id === id) {
          setSelectedRole(null)
        }
      } catch {
        toast.error("Không thể xóa vai trò")
      }
    },
    [deleteRoleMutation, selectedRole],
  )

  const roles = rolesData?.data ?? []
  const roleMembers = roleUsers?.data ?? []
  const totalDrawerPages = roleUsers?.meta.totalPages ?? 0

  return {
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
    isCreatePending: createRoleMutation.isPending,
    isUpdatePending: updateRoleMutation.isPending,
    handleOpenRoleDetail,
    handleCloseDrawer,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenEdit,
    handleCloseEdit,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
  }
}
