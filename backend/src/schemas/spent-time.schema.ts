/** Zod boundary for PT spent-time API — logs start pending; workTimeType affects OT payroll multiplier. */
import {
  SPENT_TIME_ACTIVITIES,
  SPENT_TIME_STATUSES,
  SPENT_TIME_WORK_TIME_TYPES,
} from "@/configs/entities/project.config.ts"

import { z } from "zod"

export const createSpentTimeSchema = z
  .object({
    taskId: z.string().min(1, "Task ID is required"),
    employeeId: z.string().optional(), // Can be set by controller from authenticated user if not provided
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .transform((val) => new Date(val)),
    hours: z
      .number()
      .min(0.01, "Hours must be greater than 0")
      .max(24, "Hours cannot exceed 24 hours per day"),
    comment: z.string().max(255, "Comment too long").trim().optional().nullable(),
    activity: z.enum(SPENT_TIME_ACTIVITIES),
    // working_day = 1× rate; overtime = SPENT_TIME_RULES.OVERTIME_MULTIPLIER in payroll.
    workTimeType: z.enum(SPENT_TIME_WORK_TIME_TYPES).optional().default("working_day"),
  })
  .strict()

export type CreateSpentTimeSchemaType = z.infer<typeof createSpentTimeSchema>

export const updateSpentTimeSchema = z
  .object({
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
      .transform((val) => new Date(val))
      .optional(),
    hours: z
      .number()
      .min(0.01, "Hours must be greater than 0")
      .max(24, "Hours cannot exceed 24 hours per day")
      .optional(),
    comment: z.string().max(255, "Comment too long").trim().optional().nullable(),
    activity: z.enum(SPENT_TIME_ACTIVITIES).optional(),
    workTimeType: z.enum(SPENT_TIME_WORK_TIME_TYPES).optional(),
  })
  .strict()

export type UpdateSpentTimeSchemaType = z.infer<typeof updateSpentTimeSchema>

export const spentTimeQuerySchema = z
  .object({
    taskId: z.string().optional(),
    employeeId: z.string().optional(),
    projectId: z.string().optional(),
    status: z.enum(SPENT_TIME_STATUSES).optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid startDate format" })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate format" })
      .optional(),
  })
  .strict()

export type SpentTimeQuerySchemaType = z.infer<typeof spentTimeQuerySchema>

export const rejectSpentTimeSchema = z
  .object({
    reason: z.string().min(1, "Rejection reason is required").max(500).trim(),
  })
  .strict()

export type RejectSpentTimeSchemaType = z.infer<typeof rejectSpentTimeSchema>
