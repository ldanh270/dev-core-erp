import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  createHolidaySchema,
  listHolidayQuerySchema,
  updateHolidaySchema,
} from "@/schemas/attendance.schema.ts"
import { ApiResponse } from "@/types"
import { IHolidayCalendarDTO, IHolidayService } from "@/types/attendance.types.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for managing company and scoped holiday calendars.
 */
export class HolidayController {
  constructor(private service: IHolidayService) {}

  list = async (req: Request, res: Response<ApiResponse<IHolidayCalendarDTO[]>>) => {
    const query = listHolidayQuerySchema.parse(req.query)
    const holidays = await this.service.listHolidays(query)
    res.status(HttpStatusCode.OK).json({ data: holidays, error: null })
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<IHolidayCalendarDTO[]>>) => {
    try {
      const data = createHolidaySchema.parse(req.body)
      const createdById = req.user?.empId
      if (!createdById) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED },
        })
      }
      const holidays = await this.service.createHoliday(data, createdById)
      res.status(HttpStatusCode.CREATED).json({ data: holidays, error: null })
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

  update = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<IHolidayCalendarDTO>>,
  ) => {
    const data = updateHolidaySchema.parse(req.body)
    const holiday = await this.service.updateHoliday(req.params.id, data)
    res.status(HttpStatusCode.OK).json({ data: holiday, error: null })
  }

  delete = async (req: Request<{ id: string }>, res: Response<ApiResponse<null>>) => {
    await this.service.deleteHoliday(req.params.id)
    res.status(HttpStatusCode.OK).json({ data: null, error: null })
  }

  checkHoliday = async (req: Request, res: Response<ApiResponse<boolean>>) => {
    const { date } = req.query
    const checkDate = date ? new Date(String(date)) : new Date()
    const isHoliday = await this.service.isHoliday(checkDate)
    res.status(HttpStatusCode.OK).json({ data: isHoliday, error: null })
  }
}
