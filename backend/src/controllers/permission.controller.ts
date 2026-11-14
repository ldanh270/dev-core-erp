import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  CreatePermissionSchemaType,
  ListPermissionsQuerySchemaType,
  UpdatePermissionSchemaType,
} from "@/schemas/permission.schema.ts"
import { ApiResponse, IPermissionService, PaginatedPermissionsDto, Permission } from "@/types"
import { AppError } from "@/utils/error.util.ts"

import { Response } from "express"

/**
 * Controller class handling HTTP request adapters for the Permission resource.
 * Decouples Express framework from business logic operations.
 */
export class PermissionController {
  /**
   * Initializes the controller with the Permission service dependency.
   * @param service Concrete implementation of IPermissionService.
   */
  constructor(private service: IPermissionService) {}

  /**
   * HTTP GET /permissions
   * Retrieves a paginated list of permissions based on query parameters.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<PaginatedPermissionsDto>>) => {
    const query = req.query as unknown as ListPermissionsQuerySchemaType
    const paginated = await this.service.listPermissions(query)
    res.status(HttpStatusCode.OK).json({ data: paginated, error: null })
  }

  /**
   * HTTP GET /permissions/:id
   * Retrieves a single permission by ID.
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<Permission>>) => {
    const permission = await this.service.getPermission(String(req.params.id))
    if (!permission) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Permission not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: permission, error: null })
  }

  /**
   * HTTP POST /permissions
   * Creates a new permission record.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<Permission>>) => {
    const data = req.body as CreatePermissionSchemaType
    const actorId = req.user?.empId
    if (!actorId) {
      throw new AppError(
        "Unauthorized action: Missing user details",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.CONTROLLER,
      )
    }

    const permission = await this.service.createPermission({
      ...data,
      actorId,
    })
    res.status(HttpStatusCode.CREATED).json({ data: permission, error: null })
  }

  /**
   * HTTP PUT /permissions/:id
   * Fully/Partially updates an existing permission record.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<Permission>>) => {
    const data = req.body as UpdatePermissionSchemaType
    const actorId = req.user?.empId
    if (!actorId) {
      throw new AppError(
        "Unauthorized action: Missing user details",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.CONTROLLER,
      )
    }

    const permission = await this.service.updatePermission(String(req.params.id), {
      ...data,
      actorId,
    })
    if (!permission) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Permission not found", code: ErrorCode.NOT_FOUND },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: permission, error: null })
  }

  /**
   * HTTP DELETE /permissions/:id
   * Soft deletes an existing permission record.
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

    const success = await this.service.deletePermission(String(req.params.id), actorId)
    if (!success) {
      throw new AppError(
        "Permission not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.CONTROLLER,
        ErrorCode.NOT_FOUND,
      )
    }
    res.status(HttpStatusCode.OK).json({ data: true, error: null })
  }
}
