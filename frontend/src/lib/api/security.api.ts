import { API_ENDPOINTS } from "@/config/api.config"
import {
  SECURITY_ACTIVITY_CATEGORY,
  SECURITY_AUDIT_ACTION_PREFIX,
} from "@/config/entities/security.config"
import apiClient from "@/lib/api-client"
import type {
  ActivityLogItem,
  ActivityLogQuery,
  LockedAccountItem,
  PaginatedActivityLogsDto,
  Permission,
  Role,
  SecuritySummaryDto,
} from "@/types/security.types"

import type { AxiosRequestConfig } from "axios"

interface ApiResponse<T> {
  status: string
  data: T
  message?: string
}

interface BackendAuditLog {
  id: string
  action: string
  actorId?: string | null
  actor?: { fullName: string } | null
  targetEmployeeId?: string | null
  targetEmployee?: { fullName: string } | null
  targetRoleId?: string | null
  targetPermissionId?: string | null
  oldValue?: unknown
  newValue?: unknown
  metadata?: Record<string, unknown> | null
  createdAt: string
}

interface PaginatedLogs {
  data: BackendAuditLog[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Helper function for mapAuditToActivity.
 */
function mapAuditToActivity(log: BackendAuditLog): ActivityLogItem {
  let category: string = SECURITY_ACTIVITY_CATEGORY.SECURITY
  const action = log.action || ""
  if (action.startsWith(SECURITY_AUDIT_ACTION_PREFIX.ROLE)) {
    category = SECURITY_ACTIVITY_CATEGORY.ROLE
  } else if (action.startsWith(SECURITY_AUDIT_ACTION_PREFIX.PERMISSION)) {
    category = SECURITY_ACTIVITY_CATEGORY.PERMISSION
  } else if (action.startsWith(SECURITY_AUDIT_ACTION_PREFIX.EMPLOYEE)) {
    category = SECURITY_ACTIVITY_CATEGORY.EMPLOYEE
  }

  const ipAddress = (log.metadata?.ipAddress as string) || (log.metadata?.ip as string) || null

  const detailObj = {
    action: log.action,
    actorId: log.actorId,
    actorName: log.actor?.fullName || null,
    targetEmployeeId: log.targetEmployeeId,
    targetEmployeeName: log.targetEmployee?.fullName || null,
    targetRoleId: log.targetRoleId,
    targetPermissionId: log.targetPermissionId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    metadata: log.metadata,
  }

  return {
    id: log.id,
    employeeId: log.actorId || undefined,
    employeeName: log.actor?.fullName || null,
    category,
    actionType: log.action,
    ipAddress,
    details: JSON.stringify(detailObj, null, 2),
    createdAt: log.createdAt,
  }
}

export const securityApi = {
  getSummary: async (timeRange: string = "today"): Promise<SecuritySummaryDto> => {
    const response = await apiClient.get<ApiResponse<SecuritySummaryDto>>("/security/dashboard", {
      params: { timeRange },
    })
    return response.data.data
  },

  getLockedAccounts: async (): Promise<LockedAccountItem[]> => {
    const response = await apiClient.get<ApiResponse<LockedAccountItem[]>>(
      API_ENDPOINTS.SECURITY.LOCKED_ACCOUNTS,
    )
    return response.data.data
  },

  unlockAccount: async (employeeId: string): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.SECURITY.UNLOCK(employeeId))
  },

  listLogs: async (
    query?: ActivityLogQuery,
    config?: AxiosRequestConfig,
  ): Promise<PaginatedActivityLogsDto> => {
    const backendQuery: Record<string, unknown> = {
      page: query?.page,
      limit: query?.limit,
      actorId: query?.employeeId,
      category: query?.category,
      actionType: query?.actionType,
      fromDate: query?.fromDate,
      toDate: query?.toDate,
    }

    const response = await apiClient.get<ApiResponse<PaginatedLogs>>(
      API_ENDPOINTS.SECURITY.ACTIVITY_LOGS,
      { params: backendQuery, ...config },
    )

    const paginated = response.data.data
    return {
      data: (paginated.data || []).map(mapAuditToActivity),
      meta: paginated.meta,
    }
  },

  listMyLogs: async (
    query?: ActivityLogQuery,
    config?: AxiosRequestConfig,
  ): Promise<PaginatedActivityLogsDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedLogs>>(
      API_ENDPOINTS.SECURITY.MY_ACTIVITY_LOGS,
      { params: query, ...config },
    )
    const paginated = response.data.data
    return {
      data: (paginated.data || []).map(mapAuditToActivity),
      meta: paginated.meta,
    }
  },

  getLogDetail: async (id: string): Promise<ActivityLogItem> => {
    const response = await apiClient.get<ApiResponse<BackendAuditLog>>(
      API_ENDPOINTS.SECURITY.ACTIVITY_LOG_DETAIL(id),
    )
    return mapAuditToActivity(response.data.data)
  },

  getMyLogDetail: async (id: string): Promise<ActivityLogItem> => {
    const response = await apiClient.get<ApiResponse<BackendAuditLog>>(
      API_ENDPOINTS.SECURITY.MY_ACTIVITY_LOG_DETAIL(id),
    )
    return mapAuditToActivity(response.data.data)
  },

  listRoles: async (params?: {
    page?: number
    limit?: number
  }): Promise<{
    data: Role[]
    meta: { total: number; page: number; limit: number; totalPages: number }
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        data: Role[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }>
    >(API_ENDPOINTS.ROLES.BASE, { params })
    return response.data.data
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await apiClient.get<ApiResponse<Role>>(API_ENDPOINTS.ROLES.DETAIL(id))
    return response.data.data
  },

  createRole: async (data: {
    name: string
    description: string
    isDefault?: boolean
  }): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>(API_ENDPOINTS.ROLES.BASE, data)
    return response.data.data
  },

  updateRole: async (
    id: string,
    data: { name: string; description: string; isDefault?: boolean },
  ): Promise<Role> => {
    const response = await apiClient.put<ApiResponse<Role>>(API_ENDPOINTS.ROLES.DETAIL(id), data)
    return response.data.data
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ROLES.DETAIL(id))
  },

  getRolePermissions: async (roleId: string): Promise<Permission[]> => {
    const response = await apiClient.get<ApiResponse<Permission[]>>(
      API_ENDPOINTS.ROLES.PERMISSIONS(roleId),
    )
    return response.data.data
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<unknown> => {
    const response = await apiClient.put<ApiResponse<unknown>>(
      API_ENDPOINTS.ROLES.PERMISSIONS(roleId),
      { permissionIds },
    )
    return response.data.data
  },

  assignPermission: async (roleId: string, permissionId: string): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      API_ENDPOINTS.ROLES.PERMISSION_DETAIL(roleId, permissionId),
    )
    return response.data.data
  },

  revokePermission: async (roleId: string, permissionId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ROLES.PERMISSION_DETAIL(roleId, permissionId))
  },

  listPermissions: async (params?: {
    page?: number
    limit?: number
  }): Promise<{
    data: Permission[]
    meta: { total: number; page: number; limit: number; totalPages: number }
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        data: Permission[]
        meta: { total: number; page: number; limit: number; totalPages: number }
      }>
    >(API_ENDPOINTS.PERMISSIONS.BASE, { params })
    return response.data.data
  },

  getEmployeeRoles: async (employeeId: string): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>(
      API_ENDPOINTS.EMPLOYEES.ROLES(employeeId),
    )
    return response.data.data
  },

  updateEmployeeRoles: async (
    employeeId: string,
    roleIds: string[],
    version: number,
  ): Promise<unknown> => {
    const response = await apiClient.put<ApiResponse<unknown>>(
      API_ENDPOINTS.EMPLOYEES.ROLES(employeeId),
      { roleIds, version },
    )
    return response.data.data
  },

  assignEmployeeRole: async (employeeId: string, roleId: string): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      API_ENDPOINTS.EMPLOYEES.ROLE_DETAIL(employeeId, roleId),
    )
    return response.data.data
  },

  revokeEmployeeRole: async (employeeId: string, roleId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.EMPLOYEES.ROLE_DETAIL(employeeId, roleId))
  },
}
