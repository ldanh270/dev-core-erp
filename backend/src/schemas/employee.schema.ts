import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_TYPES,
  WORK_SCHEDULE_TYPES,
} from "@/configs/entities/employee.config.ts"
import { SORT_ORDER_VALUES } from "@/configs/system/db.config.ts"

import { z } from "zod"

/**
 * Zod validation schema for creating a new Employee.
 * Enforces field validations, data types, and value constraints.
 */
const emptyToNull = (val: unknown) => (val === "" ? null : val)

export const createEmployeeSchema = z
  .object({
    fullName: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Full name is required" : "Full name must be a string",
      })
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim(),

    username: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Username is required" : "Username must be a string",
      })
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username too long")
      .trim()
      .toLowerCase(),

    email: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Email is required" : "Email must be a string",
      })
      .email("Invalid email format")
      .trim()
      .toLowerCase(),

    password: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Password is required" : "Password must be a string",
      })
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase, one lowercase, one number and one special character",
      ),

    role: z.string().optional(),

    employeeType: z.enum(EMPLOYEE_TYPES).optional(),

    // Separate from employeeType — a contractor can still work part-time hours.
    workScheduleType: z.enum(WORK_SCHEDULE_TYPES).optional(),

    phone: z.preprocess(
      emptyToNull,
      z
        .string()
        .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format")
        .optional()
        .nullable(),
    ),

    position: z.preprocess(
      emptyToNull,
      z.string().max(100, "Position too long").trim().optional().nullable(),
    ),

    positionId: z.preprocess(emptyToNull, z.string().optional().nullable()),

    status: z.enum(EMPLOYEE_STATUSES).optional(),

    dateOfBirth: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    nationalId: z.preprocess(
      emptyToNull,
      z
        .string()
        .min(9, "National ID must be at least 9 characters")
        .max(20, "National ID too long")
        .optional()
        .nullable(),
    ),

    address: z.preprocess(
      emptyToNull,
      z.string().max(500, "Address too long").trim().optional().nullable(),
    ),

    startDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),
  })
  .strict()

/**
 * Type inferred from createEmployeeSchema.
 */
export type CreateEmployeeSchemaType = z.infer<typeof createEmployeeSchema>

/**
 * Zod validation schema for updating an existing Employee.
 * All fields are optional to support partial updates.
 */
export const updateEmployeeSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim()
      .optional(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username too long")
      .trim()
      .toLowerCase()
      .optional(),

    email: z.string().email("Invalid email format").trim().toLowerCase().optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase, one lowercase, one number and one special character",
      )
      .optional(),

    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone number format")
      .optional()
      .nullable(),

    position: z.preprocess(
      emptyToNull,
      z.string().max(100, "Position too long").trim().optional().nullable(),
    ),

    positionId: z.preprocess(emptyToNull, z.string().optional().nullable()),

    employeeType: z.enum(EMPLOYEE_TYPES).optional(),

    // Separate from employeeType — a contractor can still work part-time hours.
    workScheduleType: z.enum(WORK_SCHEDULE_TYPES).optional(),

    status: z.enum(EMPLOYEE_STATUSES).optional(),

    dateOfBirth: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    nationalId: z.preprocess(
      emptyToNull,
      z
        .string()
        .min(9, "National ID must be at least 9 characters")
        .max(20, "National ID too long")
        .optional()
        .nullable(),
    ),

    address: z.preprocess(
      emptyToNull,
      z.string().max(500, "Address too long").trim().optional().nullable(),
    ),

    startDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),

    endDate: z.preprocess(
      emptyToNull,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .optional()
        .nullable(),
    ),
  })
  .strict()

/**
 * Type inferred from updateEmployeeSchema.
 */
export type UpdateEmployeeSchemaType = z.infer<typeof updateEmployeeSchema>

/**
 * Zod validation schema for updating an employee's status.
 */
export const updateEmployeeStatusSchema = z
  .object({
    status: z.enum(EMPLOYEE_STATUSES),
  })
  .strict()

/**
 * Type inferred from updateEmployeeStatusSchema.
 */
export type UpdateEmployeeStatusSchemaType = z.infer<typeof updateEmployeeStatusSchema>

/**
 * Zod validation schema for query parameters in list endpoint.
 * Coerces and validates parameters such as pagination, search criteria, sorting field, and order.
 */
export const listEmployeesQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val >= 1, { message: "Page must be at least 1" })
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val >= 1, { message: "Limit must be at least 1" })
    .optional(),
  search: z.string().optional(),
  status: z.enum([...EMPLOYEE_STATUSES, "locked"] as const).optional(),
  type: z.enum(EMPLOYEE_TYPES).optional(),
  workSchedule: z.enum(WORK_SCHEDULE_TYPES).optional(),
  roleId: z.string().optional(),
  sortBy: z
    .enum([
      "id",
      "fullName",
      "username",
      "email",
      "phone",
      "dateOfBirth",
      "position",
      "employeeType",
      "workScheduleType",
      "status",
      "startDate",
      "endDate",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).optional(),
})

/**
 * Type inferred from listEmployeesQuerySchema.
 */
export type ListEmployeesQuerySchemaType = z.infer<typeof listEmployeesQuerySchema>
