import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createProjectTaskStatusSchema,
  deleteProjectTaskStatusSchema,
  updateProjectTaskStatusSchema,
} from "@/schemas/project-task-status.schema.ts"
import { ApiResponse, IProjectTaskStatusService, ProjectTaskStatus } from "@/types"

import { Response } from "express"
import { z } from "zod"

/**
 * Controller handling HTTP requests for project task custom statuses.
 * Coordinates between routing layer, DTO validation schemas, and service layer.
 */
export class ProjectTaskStatusController {
  constructor(private service: IProjectTaskStatusService) {}

  /**
   * Lists all custom statuses defined for a specific project.
   * Only accessible to project members, project leader, or managers.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const result = await this.service.listStatuses(projectId, req.user.empId)
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
   * Retrieves detail of a single custom status by its unique ID.
   * Performs membership and role permission validation.
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const result = await this.service.getStatus(id, req.user.empId)
      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Status not found", code: ErrorCode.NOT_FOUND },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a new custom task status column for a project.
   * Validates duplicate status names, sets default sorting order, and updates database.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const payload = createProjectTaskStatusSchema.parse({
        ...req.body,
        projectId,
      })

      const result = await this.service.createStatus(payload, req.user.empId)
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
   * Updates properties (name, color, order, default status) of a custom project task status.
   * If status names or completed flags change, corresponding task records are updated.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<ProjectTaskStatus>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const payload = updateProjectTaskStatusSchema.parse(req.body)

      const result = await this.service.updateStatus(id, payload, req.user.empId)
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
   * Deletes a custom task status column from a project.
   * Requires transferring remaining tasks in this column to a fallback status column.
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { id } = req.params as { id: string }
      const { fallbackStatusId } = deleteProjectTaskStatusSchema.parse(req.query)

      const result = await this.service.deleteStatus(id, fallbackStatusId, req.user.empId)
      res.status(HttpStatusCode.OK).json({ data: { success: result }, error: null })
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
