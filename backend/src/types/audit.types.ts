export const AUDIT_ACTIONS = [
  "ROLE_ASSIGNED",
  "ROLE_REVOKED",
  "ROLE_REPLACED",
  "PERMISSION_ASSIGNED",
  "PERMISSION_REVOKED",
  "PERMISSION_REPLACED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "PERMISSION_CREATED",
  "PERMISSION_UPDATED",
  "PERMISSION_DELETED",
  "EMPLOYEE_DEACTIVATED",
  "EMPLOYEE_DELETED",
  "PART_TIME_SHIFTS_ASSIGNED",
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuthorizationAuditLog {
  id: string
  actorId: string | null
  targetEmployeeId: string | null
  targetRoleId: string | null
  targetPermissionId: string | null
  action: string
  oldValue: any | null
  newValue: any | null
  metadata: any | null
  createdAt: Date
  actor?: { fullName: string } | null
  targetEmployee?: { fullName: string } | null
}

export interface CreateAuditLogDto {
  actorId?: string | null
  targetEmployeeId?: string | null
  targetRoleId?: string | null
  targetPermissionId?: string | null
  action: AuditAction
  oldValue?: any | null
  newValue?: any | null
  metadata?: any | null
}

export interface AuditLogQuery {
  page?: number
  limit?: number
  actorId?: string
  targetEmployeeId?: string
  targetRoleId?: string
  action?: string
  category?: string
}

export interface PaginatedAuditLogsDto {
  data: AuthorizationAuditLog[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface IAuditRepository {
  createLog(data: CreateAuditLogDto): Promise<AuthorizationAuditLog>
  findLogById(id: string): Promise<AuthorizationAuditLog | null>
  listLogsPaginated(query: AuditLogQuery): Promise<PaginatedAuditLogsDto>
  listLogsByEmployeeId(
    employeeId: string,
    query: Omit<AuditLogQuery, "targetEmployeeId">,
  ): Promise<PaginatedAuditLogsDto>
  listLogsByRoleId(
    roleId: string,
    query: Omit<AuditLogQuery, "targetRoleId">,
  ): Promise<PaginatedAuditLogsDto>
}

export interface IAuditService {
  log(event: CreateAuditLogDto): Promise<void>
  getLogById(id: string): Promise<AuthorizationAuditLog | null>
  listLogs(query: AuditLogQuery): Promise<PaginatedAuditLogsDto>
  listLogsByEmployee(
    employeeId: string,
    query: Omit<AuditLogQuery, "targetEmployeeId">,
  ): Promise<PaginatedAuditLogsDto>
  listLogsByRole(
    roleId: string,
    query: Omit<AuditLogQuery, "targetRoleId">,
  ): Promise<PaginatedAuditLogsDto>
}
