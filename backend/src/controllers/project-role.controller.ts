import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { createProjectRoleSchema, updateProjectRoleSchema } from "@/schemas/project-role.schema.ts"
import { ApiResponse, IProjectRoleService, ProjectRole } from "@/types"

import { Response } from "express"
import { z } from "zod"

/**
 * Controller handling HTTP requests for project-scoped member roles.
 */
export class ProjectRoleController {
  constructor(private service: IProjectRoleService) {}

  /**
   * Lists all roles for a given project.
   * @param req - Express auth request containing projectId param.
   * @param res - Express response containing the array of project roles.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<ProjectRole[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const result = await this.service.list(projectId)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Creates a new custom project role.
   * @param req - Express auth request with role details in body and projectId in params.
   * @param res - Express response containing the created project role.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<ProjectRole>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const data = createProjectRoleSchema.parse(req.body)
      const result = await this.service.create(projectId, data)
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Updates an existing custom project role.
   * @param req - Express auth request with updated role details in body.
   * @param res - Express response containing the updated project role.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<ProjectRole>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId, id } = req.params as { projectId: string; id: string }
      const data = updateProjectRoleSchema.parse(req.body)
      const result = await this.service.update(projectId, id, data)
      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Vai trò không tồn tại", code: ErrorCode.NOT_FOUND },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Deletes a custom project role.
   * @param req - Express auth request with role id and projectId.
   * @param res - Express response with empty content (204).
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<void>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId, id } = req.params as { projectId: string; id: string }
      await this.service.delete(projectId, id)
      res.status(HttpStatusCode.NO_CONTENT).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Validation error",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
