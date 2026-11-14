import { APP_ROLE } from "@/configs/entities/employee.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ATTENDANCE_ERROR_CODES,
  ATTENDANCE_REPORT_HEADERS,
} from "@/constants/attendance.constants.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  attendanceMatrixQuerySchema,
  attendanceRecordQuerySchema,
  checkInSchema,
  checkOutSchema,
} from "@/schemas/attendance.schema.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import { ApiResponse } from "@/types"
import {
  IAttendanceMatrixDTO,
  IAttendanceRecordDTO,
  IAttendanceService,
} from "@/types/attendance.types.ts"
import { formatAttendanceClockTime } from "@/utils/attendance/attendance-time-zone.util.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for handling attendance-related requests.
 */
export class AttendanceController {
  /**
   * Creates a new AttendanceController instance.
   * @param service - The attendance service implementation.
   */
  constructor(private service: IAttendanceService) {}

  /**
   * Handles check-in requests.
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  checkIn = async (req: AuthRequest, res: Response<ApiResponse<IAttendanceRecordDTO>>) => {
    try {
      const accountId = req.user?.empId
      if (!accountId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const employeeId = await resolvePersonalEmployeeId(accountId)
      const { location } = checkInSchema.parse(req.body)
      const record = await this.service.checkIn(employeeId, location, accountId)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles check-out requests.
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  checkOut = async (req: AuthRequest, res: Response<ApiResponse<IAttendanceRecordDTO>>) => {
    try {
      const accountId = req.user?.empId
      if (!accountId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const employeeId = await resolvePersonalEmployeeId(accountId)
      const { location } = checkOutSchema.parse(req.body)

      const record = await this.service.checkOut(employeeId, location)
      res.status(HttpStatusCode.OK).json({ data: record, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles scan requests (either check-in or check-out depending on today's status).
   * @param req - The authenticated request.
   * @param res - The API response.
   */
  scan = async (req: AuthRequest, res: Response<ApiResponse<IAttendanceRecordDTO>>) => {
    try {
      const accountId = req.user?.empId
      if (!accountId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const employeeId = await resolvePersonalEmployeeId(accountId)
      const { location } = checkInSchema.parse(req.body)
      const result = await this.service.scan(employeeId, location, accountId)

      res.status(HttpStatusCode.OK).json({ data: result, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Queries attendance records based on provided filters.
   * @param req - The authenticated request.
   * @param res - The API response with an array of records.
   */
  queryRecords = async (req: AuthRequest, res: Response<ApiResponse<IAttendanceRecordDTO[]>>) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const userId = req.user?.empId

      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.UNAUTHORIZED,
            code: ATTENDANCE_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const authContext = await authorizationService.getAuthorizationContext(userId)
      // attendance.read belongs to regular employees for personal records; only the
      // explicit admin role may remove the employee scope and query workforce history.
      const canViewAll = authContext.isDynamicAdmin || authContext.roles.has(APP_ROLE.ADMIN)

      if (query.personalOnly) {
        query.employeeId = await resolvePersonalEmployeeId(userId)
      } else if (!canViewAll) {
        query.employeeId = await resolvePersonalEmployeeId(userId)
      }

      const { personalOnly: _personalOnly, ...recordQuery } = query
      const records = await this.service.getAttendanceRecords(recordQuery)
      res.status(HttpStatusCode.OK).json({ data: records, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /** Returns workforce attendance grouped for weekly/monthly matrix rendering. */
  queryMatrix = async (req: Request, res: Response<ApiResponse<IAttendanceMatrixDTO>>) => {
    try {
      const query = attendanceMatrixQuerySchema.parse(req.query)
      const matrix = await this.service.getAttendanceMatrix(query)
      res.status(HttpStatusCode.OK).json({ data: matrix, error: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Exports attendance report as CSV.
   * @param req - The authenticated request.
   * @param res - The response object to send the CSV file.
   */
  exportReport = async (req: AuthRequest, res: Response) => {
    try {
      const query = attendanceRecordQuerySchema.parse(req.query)
      const records = await this.service.getAttendanceRecords(query)

      const csvRows = [ATTENDANCE_REPORT_HEADERS.join(",")]

      for (const record of records) {
        const dateStr = record.date ? new Date(record.date).toISOString().split("T")[0] : "N/A"
        const shift = record.employeeShift?.shift
        const shiftName = shift?.name || "N/A"
        let scheduledHours = "N/A"
        if (shift) {
          const startHours = Math.floor(shift.startTime / 60)
            .toString()
            .padStart(2, "0")
          const startMins = (shift.startTime % 60).toString().padStart(2, "0")
          const endHours = Math.floor(shift.endTime / 60)
            .toString()
            .padStart(2, "0")
          const endMins = (shift.endTime % 60).toString().padStart(2, "0")
          scheduledHours = `${startHours}:${startMins} - ${endHours}:${endMins}`
        }

        const checkInStr = record.checkInAt ? formatAttendanceClockTime(record.checkInAt) : ""
        const checkOutStr = record.checkOutAt ? formatAttendanceClockTime(record.checkOutAt) : ""

        const row = [
          dateStr,
          `"${(record.employee?.fullName || "").replace(/"/g, '""')}"`,
          record.employeeId || "",
          record.employee?.email || "",
          `"${shiftName.replace(/"/g, '""')}"`,
          scheduledHours,
          checkInStr,
          checkOutStr,
          record.status || "N/A",
          record.lateMinutes ?? 0,
          record.earlyLeaveMinutes ?? 0,
          record.overtimeMinutes ?? 0,
          record.totalWorkMinutes ?? 0,
        ]
        csvRows.push(row.join(","))
      }

      const csvContent = csvRows.join("\n")
      const filename = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`

      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      res.status(HttpStatusCode.OK).send("\uFEFF" + csvContent)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: ATTENDANCE_ERROR_MESSAGES.VALIDATION_ERROR,
            code: ATTENDANCE_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }
}
