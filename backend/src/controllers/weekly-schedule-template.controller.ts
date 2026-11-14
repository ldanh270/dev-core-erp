import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  applyWeeklyScheduleTemplateSchema,
  createWeeklyScheduleTemplateSchema,
  updateWeeklyScheduleTemplateSchema,
} from "@/schemas/weekly-schedule-template.schema.ts"
import { ApiResponse } from "@/types"
import type { IShiftScheduleWithTemplate } from "@/types/shift-schedule.types.ts"
import {
  IWeeklyScheduleTemplateService,
  IWeeklyScheduleTemplateWithWeeks,
} from "@/types/weekly-schedule-template.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for weekly schedule template CRUD and apply operations.
 */
export class WeeklyScheduleTemplateController {
  constructor(private service: IWeeklyScheduleTemplateService) {}

  list = async (_req: Request, res: Response<ApiResponse<IWeeklyScheduleTemplateWithWeeks[]>>) => {
    const templates = await this.service.listTemplates()
    res.status(HttpStatusCode.OK).json({ data: templates, error: null })
  }

  getOne = async (req: Request, res: Response<ApiResponse<IWeeklyScheduleTemplateWithWeeks>>) => {
    const template = await this.service.getTemplate(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: template, error: null })
  }

  create = async (
    req: AuthRequest,
    res: Response<ApiResponse<IWeeklyScheduleTemplateWithWeeks>>,
  ) => {
    try {
      const reqData = createWeeklyScheduleTemplateSchema.parse(req.body)
      const template = await this.service.createTemplate({
        ...reqData,
        createdById: req.user?.empId || "system",
      })
      res.status(HttpStatusCode.CREATED).json({ data: template, error: null })
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

  update = async (req: Request, res: Response<ApiResponse<IWeeklyScheduleTemplateWithWeeks>>) => {
    try {
      const data = updateWeeklyScheduleTemplateSchema.parse(req.body)
      const template = await this.service.updateTemplate(String(req.params.id), data)
      res.status(HttpStatusCode.OK).json({ data: template, error: null })
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

  delete = async (req: Request, res: Response<ApiResponse<null>>) => {
    await this.service.deleteTemplate(String(req.params.id))
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  apply = async (req: AuthRequest, res: Response<ApiResponse<IShiftScheduleWithTemplate[]>>) => {
    try {
      const reqData = applyWeeklyScheduleTemplateSchema.parse(req.body)
      const schedules = await this.service.applyTemplate({
        templateId: String(req.params.id),
        ...reqData,
        createdById: req.user?.empId || "system",
      })
      res.status(HttpStatusCode.CREATED).json({ data: schedules, error: null })
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
