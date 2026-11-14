import {
  type ISecurityQueryScope,
  SECURITY_QUERY_KEY,
  SECURITY_QUERY_SCOPE,
} from "@/config/entities/security.config"
import { employeeKeys } from "@/hooks/employees/queries/useEmployeeQuery"
import { securityApi } from "@/lib/api/security.api"
import type { ActivityLogQuery } from "@/types/security.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query-key factory for the security module.
 * Keeps cache invalidation consistent across summary, audit logs, roles, and permissions flows.
 */
export const securityKeys = {
  all: [SECURITY_QUERY_KEY.ROOT] as const,
  summary: (timeRange?: string) =>
    [...securityKeys.all, SECURITY_QUERY_KEY.SUMMARY, timeRange] as const,
  lockedAccounts: () => [...securityKeys.all, SECURITY_QUERY_KEY.LOCKED_ACCOUNTS] as const,
  logs: () => [...securityKeys.all, SECURITY_QUERY_KEY.LOGS] as const,
  logList: (query: ActivityLogQuery) => [...securityKeys.logs(), query] as const,
  myLogList: (query: ActivityLogQuery) =>
    [...securityKeys.logs(), SECURITY_QUERY_SCOPE.ME, query] as const,
  logDetail: (scope: ISecurityQueryScope, id: string) =>
    [...securityKeys.logs(), scope, SECURITY_QUERY_KEY.DETAIL, id] as const,
  roles: () => [...securityKeys.all, SECURITY_QUERY_KEY.ROLES] as const,
  roleList: (params?: { page?: number; limit?: number }) =>
    [...securityKeys.roles(), params] as const,
  roleDetail: (id: string) => [...securityKeys.roles(), SECURITY_QUERY_KEY.DETAIL, id] as const,
  rolePermissions: (roleId: string) =>
    [...securityKeys.roles(), SECURITY_QUERY_KEY.PERMISSIONS, roleId] as const,
  permissions: (params?: { page?: number; limit?: number }) =>
    [...securityKeys.all, SECURITY_QUERY_KEY.PERMISSIONS, params] as const,
  employeeRoles: (employeeId: string) =>
    [
      ...securityKeys.all,
      SECURITY_QUERY_KEY.EMPLOYEES,
      SECURITY_QUERY_KEY.ROLES,
      employeeId,
    ] as const,
}

/**
 * Loads the top-level security dashboard summary.
 */
export function useSecuritySummary(timeRange: string = "today") {
  return useQuery({
    queryKey: securityKeys.summary(timeRange),
    queryFn: () => securityApi.getSummary(timeRange),
  })
}

/**
 * Loads the list of accounts currently locked by security rules.
 */
export function useLockedAccounts() {
  return useQuery({
    queryKey: securityKeys.lockedAccounts(),
    queryFn: securityApi.getLockedAccounts,
  })
}

/**
 * Unlocks one employee account and refreshes related summary/list caches.
 */
export function useUnlockAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: string) => securityApi.unlockAccount(employeeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.summary() })
      void queryClient.invalidateQueries({ queryKey: securityKeys.lockedAccounts() })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Loads paginated activity logs for administrators.
 * Keeps previous data visible while query params change between pages/filters.
 * @param query Query filters and pagination
 */
export function useActivityLogs(query: ActivityLogQuery) {
  return useQuery({
    queryKey: securityKeys.logList(query),
    queryFn: () => securityApi.listLogs(query),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Loads paginated activity logs scoped to the current authenticated user.
 * @param query Query filters and pagination
 */
export function useMyActivityLogs(query: ActivityLogQuery) {
  return useQuery({
    queryKey: securityKeys.myLogList(query),
    queryFn: () => securityApi.listMyLogs(query),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Loads the detail view for one activity log, either from the global scope or "my logs" scope.
 * @param id The log ID
 * @param scope The log visibility scope used to choose the correct endpoint and cache key
 */
export function useActivityLog(id: string, scope: ISecurityQueryScope = SECURITY_QUERY_SCOPE.ALL) {
  return useQuery({
    queryKey: securityKeys.logDetail(scope, id),
    queryFn: () =>
      scope === SECURITY_QUERY_SCOPE.ME
        ? securityApi.getMyLogDetail(id)
        : securityApi.getLogDetail(id),
    enabled: !!id,
  })
}

/**
 * Loads paginated role data for the security/administration screens.
 */
export function useRoles(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: securityKeys.roleList(params),
    queryFn: () => securityApi.listRoles(params),
  })
}

/**
 * Loads one role detail record by ID.
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: securityKeys.roleDetail(id),
    queryFn: () => securityApi.getRole(id),
    enabled: !!id,
  })
}

/**
 * Creates a new role and refreshes cached role lists afterwards.
 */
export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: securityApi.createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
    },
  })
}

/**
 * Updates role metadata and refreshes both list and detail caches for the edited role.
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name: string; description: string; isDefault?: boolean }
    }) => securityApi.updateRole(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
      void queryClient.invalidateQueries({ queryKey: securityKeys.roleDetail(id) })
    },
  })
}

/**
 * Deletes one role and invalidates role-list caches.
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: securityApi.deleteRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.roles() })
    },
  })
}

/**
 * Loads the permission set currently assigned to one role.
 */
export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: securityKeys.rolePermissions(roleId),
    queryFn: () => securityApi.getRolePermissions(roleId),
    enabled: !!roleId,
  })
}

/**
 * Replaces the permission assignments for a role, then refreshes that role-permission cache.
 */
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      securityApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.rolePermissions(roleId) })
    },
  })
}

/**
 * Loads paginated permission records for administration screens.
 */
export function usePermissions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: securityKeys.permissions(params),
    queryFn: () => securityApi.listPermissions(params),
  })
}

/**
 * Loads the active role assignments of one employee.
 */
export function useEmployeeRoles(employeeId: string) {
  return useQuery({
    queryKey: securityKeys.employeeRoles(employeeId),
    queryFn: () => securityApi.getEmployeeRoles(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Replaces the role set of one employee and refreshes both employee-role and employee-list caches.
 */
export function useUpdateEmployeeRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      roleIds,
      version,
    }: {
      employeeId: string
      roleIds: string[]
      version: number
    }) => securityApi.updateEmployeeRoles(employeeId, roleIds, version),
    onSuccess: (_, { employeeId }) => {
      void queryClient.invalidateQueries({ queryKey: securityKeys.employeeRoles(employeeId) })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
