import { SORT_ORDER_VALUES } from "@/configs/system/db.config.ts"

import { z } from "zod"

/**
 * Zod validation schema for creating a new Permission.
 */
export const createPermissionSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(100, "Code too long")
      .regex(
        /^[a-z]+(\.[a-z_]+)+$/,
        "Code must follow lowercase 'module.action' format (e.g. employee.read)",
      ),
    module: z
      .string()
      .min(2, "Module must be at least 2 characters")
      .max(50, "Module too long")
      .trim(),
    description: z.string().max(255, "Description too long").optional().nullable(),
  })
  .strict()

export type CreatePermissionSchemaType = z.infer<typeof createPermissionSchema>

/**
 * Zod validation schema for updating an existing Permission.
 */
export const updatePermissionSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long")
      .trim()
      .optional(),
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(100, "Code too long")
      .regex(/^[a-z]+(\.[a-z_]+)+$/, "Code must follow lowercase 'module.action' format")
      .optional(),
    module: z
      .string()
      .min(2, "Module must be at least 2 characters")
      .max(50, "Module too long")
      .trim()
      .optional(),
    description: z.string().max(255, "Description too long").optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .strict()

export type UpdatePermissionSchemaType = z.infer<typeof updatePermissionSchema>

/**
 * Zod validation schema for query parameters when listing permissions.
 */
export const listPermissionsQuerySchema = z.object({
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
  module: z.string().optional(),
  sortBy: z.enum(["name", "code", "module", "createdAt"]).optional(),
  sortOrder: z.enum(SORT_ORDER_VALUES).optional(),
})

export type ListPermissionsQuerySchemaType = z.infer<typeof listPermissionsQuerySchema>
