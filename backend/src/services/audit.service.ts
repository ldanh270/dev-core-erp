import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  AuditLogQuery,
  AuthorizationAuditLog,
  CreateAuditLogDto,
  IAuditRepository,
  IAuditService,
  PaginatedAuditLogsDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { prisma } from "../libs/database.ts"
import { PrismaAuditRepository } from "../repositories/audit.repository.ts"

/**
 * Service implementation for managing audit logs, ensuring mutations are logged asynchronously.
 */
export class AuditService implements IAuditService {
  /**
   * Initializes the audit service with its repository dependency.
   */
  constructor(private auditRepository: IAuditRepository) {}

  /**
   * Log an audit event. Non-blocking, best effort, never breaks business transactions.
   */
  async log(event: CreateAuditLogDto): Promise<void> {
    setImmediate(() => {
      this.auditRepository.createLog(event).catch((err) => {
        console.error("[AuditService] Non-blocking audit logging failed:", err)
      })
    })
  }

  /**
   * Retrieves a single audit log by its identifier.
   */
  async getLogById(id: string): Promise<AuthorizationAuditLog | null> {
    const log = await this.auditRepository.findLogById(id)
    if (!log) {
      throw new AppError("Audit log not found", HttpStatusCode.NOT_FOUND, "AuditService")
    }
    return log
  }

  /**
   * Lists audit logs using pagination and filter criteria.
   */
  async listLogs(query: AuditLogQuery): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsPaginated(query)
  }

  /**
   * Lists audit logs associated with a specific employee.
   */
  async listLogsByEmployee(
    employeeId: string,
    query: Omit<AuditLogQuery, "targetEmployeeId">,
  ): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsByEmployeeId(employeeId, query)
  }

  /**
   * Lists audit logs associated with a specific role.
   */
  async listLogsByRole(
    roleId: string,
    query: Omit<AuditLogQuery, "targetRoleId">,
  ): Promise<PaginatedAuditLogsDto> {
    return this.auditRepository.listLogsByRoleId(roleId, query)
  }
}

export const auditService = new AuditService(new PrismaAuditRepository(prisma))
