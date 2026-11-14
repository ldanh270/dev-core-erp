import { REGEX } from "@/configs/auth/auth.config.ts"

import { z } from "zod"

/**
 * Zod schema for login request body validation
 * Supports either username or email format
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Identifier must be at least 3 characters")
    .max(50, "Identifier must not exceed 50 characters")
    .trim()
    .toLowerCase()
    .refine(
      (value) => REGEX.USERNAME.test(value) || REGEX.EMAIL.test(value),
      "Invalid login identifier. Must be a valid username or email.",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      REGEX.PASSWORD,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
})

/**
 * Type inferred from the login schema
 */
export type LoginSchemaType = z.infer<typeof loginSchema>

/**
 * Zod schema for forgot password request body validation
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
})

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>

/**
 * Zod schema for change password request body validation
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        REGEX.PASSWORD,
        "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>

/**
 * Zod schema for token validation request body
 */
export const validateResetTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

export type ValidateResetTokenSchemaType = z.infer<typeof validateResetTokenSchema>

/**
 * Zod schema for reset password request body validation
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(
      REGEX.PASSWORD,
      "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
})

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>

/**
 * Zod schema for activity log query validation
 */
export const activityLogQuerySchema = z.object({
  employeeId: z.string().optional(),
  category: z.string().optional(),
  actionType: z.string().optional(),
  fromDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  toDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
})

export type ActivityLogQuerySchemaType = z.infer<typeof activityLogQuerySchema>
