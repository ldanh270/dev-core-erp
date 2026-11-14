import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { ListAuditQuerySchemaType } from "@/schemas/audit.schema.ts"
import { ApiResponse, AuthorizationAuditLog, IAuditService, PaginatedAuditLogsDto } from "@/types"

import { Response } from "express"

/**
 * Controller class for audit logging resources.
 */
export class AuditController {
  constructor(private service: IAuditService) {}

  /**
   * GET /api/audit
   * Lists all audit logs.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedAuditLogsDto>>) => {
    const query = req.query as unknown as ListAuditQuerySchemaType
    const paginated = await this.service.listLogs(query)
    res.status(HttpStatusCode.OK).json({ data: paginated, error: null })
  }

  /**
   * GET /api/audit/:id
   * Retrieves details of a specific audit log by ID.
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<AuthorizationAuditLog>>) => {
    const log = await this.service.getLogById(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: log, error: null })
  }

  /**
   * GET /api/employees/:id/audit
   * Lists audit logs targetting a specific employee.
   */
  listByEmployee = async (req: AuthRequest, res: Response<ApiResponse<PaginatedAuditLogsDto>>) => {
    const query = req.query as unknown as Omit<ListAuditQuerySchemaType, "targetEmployeeId">
    const employeeId = String(req.params.id)
    const paginated = await this.service.listLogsByEmployee(employeeId, query)
    res.status(HttpStatusCode.OK).json({ data: paginated, error: null })
  }

  /**
   * GET /api/roles/:id/audit
   * Lists audit logs targetting a specific role.
   */
  listByRole = async (req: AuthRequest, res: Response<ApiResponse<PaginatedAuditLogsDto>>) => {
    const query = req.query as unknown as Omit<ListAuditQuerySchemaType, "targetRoleId">
    const roleId = String(req.params.id)
    const paginated = await this.service.listLogsByRole(roleId, query)
    res.status(HttpStatusCode.OK).json({ data: paginated, error: null })
  }
}
