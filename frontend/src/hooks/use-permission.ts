import { useAuthStore } from "@/store/auth-store"

import { useCallback, useMemo } from "react"

/**
 * Custom hook providing RBAC role and permission checks for the authenticated user.
 * Reads permissions and roles directly from the global authentication Zustand store.
 *
 * @returns Object containing check functions (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `hasRole`) and arrays
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user)
  const userPermissions = useMemo(() => user?.permissions || [], [user?.permissions])
  const userRoles = useMemo(() => user?.roles || [], [user?.roles])

  const hasPermission = useCallback(
    (permission: string) => {
      return userPermissions.includes(permission)
    },
    [userPermissions],
  )

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some((p) => userPermissions.includes(p))
    },
    [userPermissions],
  )

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every((p) => userPermissions.includes(p))
    },
    [userPermissions],
  )

  const hasRole = useCallback(
    (role: string) => {
      return userRoles.includes(role)
    },
    [userRoles],
  )

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    permissions: userPermissions,
    roles: userRoles,
  }
}
