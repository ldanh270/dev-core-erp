import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createPositionSchema,
  saveProjectPositionRulesSchema,
  updatePositionSchema,
} from "@/schemas/position.schema.ts"
import { ApiResponse, IPositionService, Position, ProjectPositionRule } from "@/types"

import { Response } from "express"
import { z } from "zod"

/**
 * Controller handling HTTP requests for Positions and Project Position Rules.
 */
export class PositionController {
  constructor(private service: IPositionService) {}

  /**
   * Retrieves all positions from the database.
   * @param req - Express auth request.
   * @param res - Express response containing the array of positions.
   */
  list = async (req: AuthRequest, res: Response<ApiResponse<Position[]>>) => {
    try {
      const result = await this.service.getAllPositions()
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Retrieves a single position by its unique identifier.
   * @param req - Express auth request with id parameter.
   * @param res - Express response containing the position.
   */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const result = await this.service.getPositionById(id)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a new position. Validates input schema.
   * @param req - Express auth request with position details in body.
   * @param res - Express response containing the created position.
   */
  create = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const body = createPositionSchema.parse(req.body) as any
      const result = await this.service.createPosition(body)
      res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Updates an existing position. Validates input schema.
   * @param req - Express auth request with updated position details in body.
   * @param res - Express response containing the updated position.
   */
  update = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const body = updatePositionSchema.parse(req.body) as any
      const result = await this.service.updatePosition(id, body)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Deletes a position by its unique identifier.
   * @param req - Express auth request with id parameter.
   * @param res - Express response containing the deleted position metadata.
   */
  delete = async (req: AuthRequest, res: Response<ApiResponse<Position>>) => {
    try {
      const { id } = req.params as { id: string }
      const result = await this.service.deletePosition(id)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Lists allowed task trackers configured for all positions in a specific project.
   * @param req - Express auth request with projectId parameter.
   * @param res - Express response containing project position rules.
   */
  listProjectRules = async (
    req: AuthRequest,
    res: Response<ApiResponse<ProjectPositionRule[]>>,
  ) => {
    try {
      const { projectId } = req.params as { projectId: string }
      const result = await this.service.getProjectRules(projectId)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      throw error
    }
  }

  /**
   * Saves/updates task tracker allowances for positions in a specific project.
   * @param req - Express auth request with projectId parameter and rules array in body.
   * @param res - Express response containing the updated project rules.
   */
  saveProjectRules = async (
    req: AuthRequest,
    res: Response<ApiResponse<ProjectPositionRule[]>>,
  ) => {
    try {
      const { projectId } = req.params as { projectId: string }
      const body = saveProjectPositionRulesSchema.parse(req.body) as any
      const result = await this.service.saveProjectRules(projectId, body.rules)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: "Dữ liệu đầu vào không hợp lệ",
            code: ErrorCode.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
