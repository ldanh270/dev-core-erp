import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createSpentTimeSchema,
  rejectSpentTimeSchema,
  spentTimeQuerySchema,
  updateSpentTimeSchema,
} from "@/schemas/spent-time.schema.ts"
import { ApiResponse, ISpentTimeService, SpentTime } from "@/types"

import { Response } from "express"
import { z } from "zod"

export class SpentTimeController {
  constructor(private service: ISpentTimeService) {}

  /** List PT spent-time logs; project leads filter by projectId for approval queue. */
  list = async (req: AuthRequest, res: Response<ApiResponse<SpentTime[]>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const queryParams: Record<string, unknown> = { ...req.query }
      if (req.params.taskId) {
        queryParams.taskId = req.params.taskId
      }

      const query = spentTimeQuerySchema.parse(queryParams)
      const result = await this.service.listSpentTimes(query, req.user.empId)
      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  /** Single log — PT employees see own rows; leads/admins see project queue entries. */
  getOne = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const spentTime = await this.service.getSpentTime(String(req.params.id), req.user.empId)
    if (!spentTime) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: { message: "Spent time log not found", code: "NOT_FOUND" },
      })
    }
    res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
  }

  /** PT employees log hours on tasks; record starts pending until lead approves. */
  create = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const body = { ...req.body }
      if (req.params.taskId) {
        body.taskId = req.params.taskId
      }

      const data = createSpentTimeSchema.parse(body)
      const spentTime = await this.service.createSpentTime(
        { ...data, date: data.date ?? new Date() },
        req.user.empId,
      )
      res.status(HttpStatusCode.CREATED).json({ data: spentTime, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  /** Edit allowed only while pending — approved rows are payroll input and locked. */
  update = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const data = updateSpentTimeSchema.parse(req.body)
      const spentTime = await this.service.updateSpentTime(
        String(req.params.id),
        data,
        req.user.empId,
      )
      if (!spentTime) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          data: null,
          error: { message: "Spent time log not found", code: "NOT_FOUND" },
        })
      }
      res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }

  /** Remove pending/rejected logs; approved logs cannot be deleted (payroll audit trail). */
  delete = async (req: AuthRequest, res: Response<ApiResponse<null>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    await this.service.deleteSpentTime(String(req.params.id), req.user.empId)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  /** Lead approves hours → included in next PT payroll run (rate × hours × OT multiplier). */
  approve = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      })
    }

    const spentTime = await this.service.approveSpentTime(String(req.params.id), req.user.empId)
    res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
  }

  /** Lead rejects with reason; hours excluded from payroll and task spent totals. */
  reject = async (req: AuthRequest, res: Response<ApiResponse<SpentTime>>) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        })
      }

      const { reason } = rejectSpentTimeSchema.parse(req.body)
      const spentTime = await this.service.rejectSpentTime(
        String(req.params.id),
        reason,
        req.user.empId,
      )
      res.status(HttpStatusCode.OK).json({ data: spentTime, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: { message: "Validation error", code: "VALIDATION_ERROR", meta: error.issues },
        })
      }
      throw error
    }
  }
}
