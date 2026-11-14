import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createProjectTrackerSchema,
  updateProjectTrackerSchema,
} from "@/schemas/project-tracker.schema.ts"
import { ApiResponse, IProjectTrackerService, ProjectTracker } from "@/types"

import { Response } from "express"
import { z } from "zod"

/**
 * Controller handling HTTP requests for project-scoped task trackers.
 */
export class ProjectTrackerController {
  constructor(private service: IProjectTrackerService) {}

  /**
   * Lists all task trackers configured for a specific project.
   * @param req - Express auth request with projectId in parameters.
   * @param res - Express response containing the array of trackers.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<ProjectTracker[]>>) => {
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
   * Creates a new task tracker in a project.
   * @param req - Express auth request containing tracker details in body and projectId in params.
   * @param res - Express response containing the created tracker.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<ProjectTracker>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId } = req.params as { projectId: string }
      const data = createProjectTrackerSchema.parse(req.body)
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
   * Updates an existing project task tracker.
   * @param req - Express auth request with updated tracker details in body.
   * @param res - Express response containing the updated tracker.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<ProjectTracker>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId, id } = req.params as { projectId: string; id: string }
      const data = updateProjectTrackerSchema.parse(req.body)
      const result = await this.service.update(projectId, id, data)
      if (!result) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Loại yêu cầu không tồn tại", code: ErrorCode.NOT_FOUND },
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
   * Deletes a project task tracker.
   * @param req - Express auth request containing tracker id and projectId.
   * @param res - Express response containing empty data.
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { projectId, id } = req.params as { projectId: string; id: string }
      await this.service.delete(projectId, id)
      res.status(HttpStatusCode.OK).json({ data: null, error: null })
    } catch (error) {
      throw error
    }
  }
}
