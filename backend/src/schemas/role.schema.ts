import { SORT_ORDER_VALUES } from "@/configs/system/db.config.ts"

import { z } from "zod"

/**
 * Zod validation schema for creating a new AppRole.
 */
export const createRoleSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
    description: z.string().max(255, "Description too long").optional().nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict()

export type CreateRoleSchemaType = z.infer<typeof createRoleSchema>

/**
 * Zod validation schema for updating an existing AppRole.
 */
export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long")
      .trim()
      .optional(),
    description: z.string().max(255, "Description too long").optional().nullable(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()

export type UpdateRoleSchemaType = z.infer<typeof updateRoleSchema>

/**
 * Zod validation schema for query parameters when listing roles.
 */
export const listRolesQuerySchema = z.object({
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
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  sortBy: z.enum(["name", "isActive", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).optional(),
})

export type ListRolesQuerySchemaType = z.infer<typeof listRolesQuerySchema>
