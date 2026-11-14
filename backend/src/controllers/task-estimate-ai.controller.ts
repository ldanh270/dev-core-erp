import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  GeneratedTaskSuggestion,
  TaskEstimateAiService,
  TaskEstimateAiSuggestion,
} from "@/services/task-estimate-ai.service.ts"
import { ApiResponse } from "@/types"

import { Response } from "express"

export class TaskEstimateAiController {
  constructor(private service: TaskEstimateAiService) {}

  /**
   * Retrieves assignee recommendations for a task
   * Endpoint: GET /api/task-estimate-ai/tasks/:id/suggestions
   */
  getSuggestions = async (
    req: AuthRequest,
    res: Response<ApiResponse<TaskEstimateAiSuggestion[]>>,
  ) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const taskId = String(req.params.id)
    try {
      const suggestions = await this.service.getAssigneeSuggestions(taskId)
      return res.status(HttpStatusCode.OK).json({
        data: suggestions,
        error: null,
      })
    } catch (err) {
      const error = err as Error
      console.error("Suggestions generation failed:", error)
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        data: null,
        error: {
          message: error.message || "Lỗi xử lý AI gợi ý",
          code: ErrorCode.INTERNAL_SERVER_ERROR,
        },
      })
    }
  }

  /**
   * Generates task recommendations for a project
   * Endpoint: POST /api/task-estimate-ai/projects/:projectId/generate-tasks
   */
  generateTasks = async (
    req: AuthRequest,
    res: Response<ApiResponse<GeneratedTaskSuggestion[]>>,
  ) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
      })
    }

    const projectId = String(req.params.projectId)
    try {
      const generatedTasks = await this.service.generateProjectTasks(projectId)
      return res.status(HttpStatusCode.OK).json({
        data: generatedTasks,
        error: null,
      })
    } catch (err) {
      const error = err as Error
      console.error("Tasks generation failed:", error)
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        data: null,
        error: {
          message: error.message || "Lỗi xử lý AI phân rã task",
          code: ErrorCode.INTERNAL_SERVER_ERROR,
        },
      })
    }
  }
}
