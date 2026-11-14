import { SCHEDULE_VALIDATION_MESSAGES } from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_ERROR_CODES } from "@/constants/attendance.constants.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  assignShiftScheduleSchema,
  generateShiftsSchema,
  overrideEmployeeShiftSchema,
} from "@/schemas/shift.schema.ts"
import { ApiResponse } from "@/types"
import { IPlannedWeek, IScheduleService } from "@/types/shift.types.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Controller for handling schedule-related requests.
 */
export class ScheduleController {
  /**
   * Creates a new ScheduleController instance.
   * @param service - The schedule service implementation.
   */
  constructor(private service: IScheduleService) {}

  /**
   * Assigns a shift schedule to an employee or a group of employees.
   * @param req - Authenticated request with schedule data in body.
   * @param res - API response with the created schedule.
   */
  assignSchedule = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const reqData = assignShiftScheduleSchema.parse(req.body)
      const data = { ...reqData, createdById: req.user?.empId || "system" }
      const schedule = await this.service.assignSchedule(data)
      res.status(HttpStatusCode.CREATED).json({ data: schedule, error: null })
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
   * Gets the schedule for the authenticated employee for a specific date or today.
   * @param req - Authenticated request.
   * @param res - API response with the employee's schedule.
   */
  getEmployeeSchedule = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
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
    const dateQuery = req.query.date as string | undefined
    const scheduleDate = dateQuery ? new Date(dateQuery) : new Date()

    const schedule = await this.service.getScheduleForEmployee(employeeId, scheduleDate)
    res.status(HttpStatusCode.OK).json({ data: schedule, error: null })
  }

  /**
   * Lists all schedules for the authenticated employee.
   * @param req - Authenticated request.
   * @param res - API response with a list of schedules.
   */
  listEmployeeSchedules = async (req: AuthRequest, res: Response<ApiResponse<unknown[]>>) => {
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
    const schedules = await this.service.listSchedulesForEmployee(employeeId)
    res.status(HttpStatusCode.OK).json({ data: schedules, error: null })
  }

  /** Planned week — merges EmployeeShift overrides with template for calendar display. */
  getEmployeePlannedWeek = async (req: AuthRequest, res: Response<ApiResponse<IPlannedWeek>>) => {
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

    const weekStart = String(req.query.weekStart ?? "")
    if (!weekStart) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        data: null,
        error: {
          message: SCHEDULE_VALIDATION_MESSAGES.WEEK_START_REQUIRED,
          code: ErrorCode.VALIDATION_ERROR,
        },
      })
    }

    const employeeId = await resolvePersonalEmployeeId(accountId)
    const plannedWeek = await this.service.getPlannedWeekForEmployee(employeeId, weekStart)
    res.status(HttpStatusCode.OK).json({ data: plannedWeek, error: null })
  }

  /**
   * Gets specific employee shifts within a date range for the current user.
   */
  getMyShifts = async (req: AuthRequest, res: Response<ApiResponse<unknown[]>>) => {
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

    const startDateQuery = req.query.startDate as string | undefined
    const endDateQuery = req.query.endDate as string | undefined

    if (!startDateQuery || !endDateQuery) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        data: null,
        error: { message: "startDate and endDate are required", code: ErrorCode.VALIDATION_ERROR },
      })
    }

    // We need to fetch EmployeeShifts directly, but service only has previewGeneratedShifts...
    // Actually, I should add a method to ScheduleService for this!
    const shifts = await this.service.getEmployeeShifts(
      employeeId,
      new Date(startDateQuery),
      new Date(endDateQuery),
    )
    res.status(HttpStatusCode.OK).json({ data: shifts, error: null })
  }

  /**
   * Retrieves schedule for a specific employee on a given date (admin view).
   * @param req - Request with employeeId in params and optional date query.
   * @param res - API response with the employee's schedule for that date.
   */
  getEmployeeScheduleById = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<unknown>>,
  ) => {
    const { employeeId } = req.params
    const dateQuery = req.query.date as string | undefined
    const scheduleDate = dateQuery ? new Date(dateQuery) : new Date()

    const schedule = await this.service.getScheduleForEmployee(employeeId, scheduleDate)
    res.status(HttpStatusCode.OK).json({ data: schedule, error: null })
  }

  /**
   * Gets EmployeeShifts for a specific employee within a date range (used by shift-swap form).
   */
  getShiftsByEmployee = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<unknown[]>>,
  ) => {
    const { employeeId } = req.params
    const startDateQuery = req.query.startDate as string | undefined
    const endDateQuery = req.query.endDate as string | undefined

    if (!startDateQuery || !endDateQuery) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        data: null,
        error: { message: "startDate and endDate are required", code: ErrorCode.VALIDATION_ERROR },
      })
    }

    const shifts = await this.service.getEmployeeShifts(
      employeeId,
      new Date(startDateQuery),
      new Date(endDateQuery),
    )
    res.status(HttpStatusCode.OK).json({ data: shifts, error: null })
  }

  /**
   * Lists all weekly schedules assigned to a specific employee (admin view).
   * @param req - Request with employeeId in params.
   * @param res - API response with the employee's schedule list.
   */
  listEmployeeSchedulesById = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<unknown[]>>,
  ) => {
    const { employeeId } = req.params
    const schedules = await this.service.listSchedulesForEmployee(employeeId)

    res.status(HttpStatusCode.OK).json({ data: schedules, error: null })
  }

  /** Admin: planned week for one employee (PT assign form + roster summary). */
  getEmployeePlannedWeekById = async (
    req: Request<{ employeeId: string }>,
    res: Response<ApiResponse<IPlannedWeek>>,
  ) => {
    const weekStart = String(req.query.weekStart ?? "")
    if (!weekStart) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        data: null,
        error: {
          message: SCHEDULE_VALIDATION_MESSAGES.WEEK_START_REQUIRED,
          code: ErrorCode.VALIDATION_ERROR,
        },
      })
    }

    const plannedWeek = await this.service.getPlannedWeekForEmployee(
      req.params.employeeId,
      weekStart,
    )
    res.status(HttpStatusCode.OK).json({ data: plannedWeek, error: null })
  }

  /**
   * Overrides an employee's shift for a specific date.
   * @param req - Authenticated request with override data in body.
   * @param res - API response with the created override.
   */
  overrideShift = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const data = overrideEmployeeShiftSchema.parse(req.body)
      const override = await this.service.overrideEmployeeShift(data)
      res.status(HttpStatusCode.CREATED).json({ data: override, error: null })
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

  previewGeneratedShifts = async (req: AuthRequest, res: Response<ApiResponse<unknown[]>>) => {
    try {
      const data = generateShiftsSchema.parse(req.body)
      const preview = await this.service.previewGeneratedShifts(data)
      res.status(HttpStatusCode.OK).json({ data: preview, error: null })
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

  generateShifts = async (req: AuthRequest, res: Response<ApiResponse<unknown>>) => {
    try {
      const data = generateShiftsSchema.parse(req.body)
      const result = await this.service.generateShifts({
        ...data,
        createdById: req.user?.empId || "system",
      })
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
}
