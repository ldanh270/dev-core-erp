import { SYSTEM_CONFIG } from "@/config/system.config"
import {
  usePermissions,
  useRolePermissions,
  useRoles,
} from "@/hooks/security/queries/use-security-query"
import type { Role } from "@/types/security.types"

import { useState } from "react"

/**
 * Custom hook orchestrating role permission queries, drawer visibility, and selected role state.
 */
export function useRolePermissionsManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const {
    data: rolesData,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    refetch: refetchRoles,
  } = useRoles()

  const { data: allPermissions } = usePermissions({
    limit: SYSTEM_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS[3] ?? 100,
  })

  const { data: rolePermissions, isLoading: isLoadingRolePerms } = useRolePermissions(
    selectedRole?.id || "",
  )

  const handleOpenRoleDetail = (role: Role) => {
    setSelectedRole(role)
  }

  const handleCloseDrawer = () => {
    setSelectedRole(null)
  }

  return {
    selectedRole,
    roles: rolesData?.data,
    isLoadingRoles,
    isErrorRoles,
    refetchRoles,
    allPermissions: allPermissions?.data || [],
    rolePermissions: rolePermissions || [],
    isLoadingRolePerms,
    handleOpenRoleDetail,
    handleCloseDrawer,
  }
}
