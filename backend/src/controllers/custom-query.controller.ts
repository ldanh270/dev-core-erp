import { CUSTOM_QUERY_TYPE } from "@/configs/entities/project.config.ts"
import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import { ApiResponse } from "@/types"
import { CustomQuery, CustomQueryType, ICustomQueryService } from "@/types/custom-query.types.ts"

import { Request, Response } from "express"

export class CustomQueryController {
  constructor(private service: ICustomQueryService) {}

  list = async (req: AuthRequest, res: Response<ApiResponse<CustomQuery[]>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Chưa đăng nhập", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const projectId = (req.query.projectId as string) || null
      const type = (req.query.type as CustomQueryType) || CUSTOM_QUERY_TYPE.GANTT

      const queries = await this.service.getQueries(employeeId, projectId, type)
      res.status(HttpStatusCode.OK).json({ data: queries, error: null })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Lỗi máy chủ"
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        data: null,
        error: { message, code: ErrorCode.INTERNAL_SERVER_ERROR },
      })
    }
  }

  create = async (req: AuthRequest, res: Response<ApiResponse<CustomQuery | null>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: { message: "Chưa đăng nhập", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const { name, type, projectId, queryData } = req.body
      const newQuery = await this.service.saveQuery(
        { name, type, projectId, queryData },
        employeeId,
      )

      res.status(HttpStatusCode.CREATED).json({ data: newQuery, error: null })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Lỗi máy chủ"
      const statusCode =
        (error as { statusCode?: number }).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
      res.status(statusCode).json({
        data: null,
        error: { message, code: ErrorCode.BAD_REQUEST },
      })
    }
  }

  delete = async (req: AuthRequest, res: Response<ApiResponse<boolean>>) => {
    try {
      const employeeId = req.user?.empId
      if (!employeeId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: false,
          error: { message: "Chưa đăng nhập", code: ErrorCode.UNAUTHORIZED },
        })
      }

      const id = req.params.id as string
      const success = await this.service.deleteQuery(id, employeeId)

      res.status(HttpStatusCode.OK).json({ data: success, error: null })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Lỗi máy chủ"
      const statusCode =
        (error as { statusCode?: number }).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
      res.status(statusCode).json({
        data: false,
        error: { message, code: ErrorCode.BAD_REQUEST },
      })
    }
  }
}
