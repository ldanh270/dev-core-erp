import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  CreateRoleSchemaType,
  ListRolesQuerySchemaType,
  UpdateRoleSchemaType,
} from "@/schemas/role.schema.ts"
import { ApiResponse, AppRole, IRoleService, PaginatedRolesDto } from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { Response } from "express"

/**
 * Controller class handling HTTP request adapters for the AppRole resource.
 */
export class RoleController {
  /**
   * Initializes the controller with the Role service dependency.
   * @param service Concrete implementation of IRoleService.
   */
  constructor(private service: IRoleService) {}

  /**
   * HTTP GET /roles
   * Retrieves a paginated list of roles based on query parameters.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedRolesDto>>) => {
    const query = req.query as unknown as ListRolesQuerySchemaType
    const paginated = await this.service.listRoles(query)
    res.status(HttpStatusCode.OK).json({ data: paginated, error: null })
  }

  /**
   * HTTP GET /roles/:id
   * Retrieves a single role by ID.
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<AppRole>>) => {
    const role = await this.service.getRole(String(req.params.id))
    if (!role) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Role not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: role, error: null })
  }

  /**
   * HTTP POST /roles
   * Creates a new role record.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<AppRole>>) => {
    const data = req.body as CreateRoleSchemaType
    const actorId = req.user?.empId
    if (!actorId) {
      throw new AppError(
        "Unauthorized action: Missing user details",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.CONTROLLER,
      )
    }

    const role = await this.service.createRole({
      ...data,
      actorId,
    })
    res.status(HttpStatusCode.CREATED).json({ data: role, error: null })
  }

  /**
   * HTTP PUT /roles/:id
   * Updates an existing role record.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<AppRole>>) => {
    const data = req.body as UpdateRoleSchemaType
    const actorId = req.user?.empId
    if (!actorId) {
      throw new AppError(
        "Unauthorized action: Missing user details",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.CONTROLLER,
      )
    }

    const role = await this.service.updateRole(String(req.params.id), {
      ...data,
      actorId,
    })
    if (!role) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Role not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: role, error: null })
  }

  /**
   * HTTP DELETE /roles/:id
   * Soft deletes an existing role record.
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    const actorId = req.user?.empId
    if (!actorId) {
      throw new AppError(
        "Unauthorized action: Missing user details",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.CONTROLLER,
      )
    }

    const success = await this.service.deleteRole(String(req.params.id), actorId)
    if (!success) {
      throw new AppError(
        "Role not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.CONTROLLER,
        ErrorCode.NOT_FOUND,
      )
    }
    res.status(HttpStatusCode.OK).json({ data: true, error: null })
  }
}
