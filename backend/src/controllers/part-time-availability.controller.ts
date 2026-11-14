/**
 * HTTP boundary for employee free-time submissions and Admin assignment actions.
 * Suggestion endpoints are read-only; only assign-shifts persists a proposed roster.
 */
import { PART_TIME_AVAILABILITY_QUERY_PARAMS } from "@/configs/entities/part-time-availability.config.ts"
import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  assignPartTimeShiftsSchema,
  suggestPartTimeShiftsSchema,
  upsertPartTimeAvailabilitySchema,
  weekStartQuerySchema,
} from "@/schemas/part-time-availability.schema.ts"
import { PartTimeAvailabilityService } from "@/services/part-time-availability.service.ts"
import { ApiResponse } from "@/types"
import {
  IPartTimeAvailabilityService,
  IPartTimeWeeklyAvailability,
  IPtShiftSuggestionService,
  ISuggestPartTimeShiftsResult,
} from "@/types/part-time-availability.types.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * Part-time weekly availability: employees declare free/busy windows; admins assign shifts from submissions.
 * Approval workflow is optional — assign is allowed once status is submitted (or legacy approved).
 */
export class PartTimeAvailabilityController {
  constructor(
    private service: IPartTimeAvailabilityService,
    private suggestionService: IPtShiftSuggestionService,
  ) {}

  /** Employee self-service: map auth account to HR employee record before week lookup. */
  getMine = async (
    req: AuthRequest,
    res: Response<ApiResponse<IPartTimeWeeklyAvailability | null>>,
  ) => {
    const accountId = req.user?.empId
    // JWT may be valid before HR links account → employee; fail closed instead of 500 on lookup.
    if (!accountId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: {
          message: "Unauthorized",
          code: ErrorCode.UNAUTHORIZED,
        },
      })
    }

    const { weekStart } = weekStartQuerySchema.parse(req.query)
    const employeeId = await resolvePersonalEmployeeId(accountId)
    const availability = await this.service.getMine(employeeId, weekStart)
    res.status(HttpStatusCode.OK).json({ data: availability, error: null })
  }

  /** Employee submits weekly availability; service forces submitted status, PT-only, future weeks, and slot rules. */
  upsertMine = async (
    req: AuthRequest,
    res: Response<ApiResponse<IPartTimeWeeklyAvailability>>,
  ) => {
    const accountId = req.user?.empId
    // Same guard as getMine — upsert must not run without a resolvable employee id.
    if (!accountId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: {
          message: "Unauthorized",
          code: ErrorCode.UNAUTHORIZED,
        },
      })
    }

    try {
      const payload = upsertPartTimeAvailabilitySchema.parse(req.body)
      const availability = await this.service.upsertMine(accountId, {
        weekStart: payload.weekStart,
        note: payload.note,
        status: payload.status,
        days: PartTimeAvailabilityService.mapPayloadDays(payload.days),
      })
      res.status(HttpStatusCode.OK).json({ data: availability, error: null })
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

  /** Admin roster: all PT availability submissions for a given weekStart. */
  listForWeek = async (req: Request, res: Response<ApiResponse<IPartTimeWeeklyAvailability[]>>) => {
    const { weekStart } = weekStartQuerySchema.parse(req.query)
    const items = await this.service.listForWeek(weekStart)
    res.status(HttpStatusCode.OK).json({ data: items, error: null })
  }

  /** Admin drill-down: one employee's availability for shift assignment UI. */
  getByEmployee = async (
    req: Request,
    res: Response<ApiResponse<IPartTimeWeeklyAvailability | null>>,
  ) => {
    const { weekStart } = weekStartQuerySchema.parse(req.query)
    const availability = await this.service.getByEmployee(String(req.params.employeeId), weekStart)
    res.status(HttpStatusCode.OK).json({ data: availability, error: null })
  }

  /** Read-only greedy suggestions — does not persist; admin confirms via assign-shifts. */
  suggest = async (req: Request, res: Response<ApiResponse<ISuggestPartTimeShiftsResult>>) => {
    const input = suggestPartTimeShiftsSchema.parse(req.body)
    const result = await this.suggestionService.suggest(input)
    res.status(HttpStatusCode.OK).json({ data: result, error: null })
  }

  /** Creates EmployeeShift overrides from submitted free slots; createdById tracks assigning admin. */
  assignShifts = async (
    req: AuthRequest,
    res: Response<ApiResponse<{ assigned: number; skipped: number }>>,
  ) => {
    try {
      const payload = assignPartTimeShiftsSchema.parse(req.body)
      const result = await this.service.assignShifts({
        availabilityId: String(req.params.id),
        assignments: payload.assignments,
        createdById: req.user?.empId || "system",
        suggestionDecision: payload.suggestionDecision,
      })
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
}

export { PART_TIME_AVAILABILITY_QUERY_PARAMS }
