import { z } from "zod"

/**
 * Zod validation schema for creating a project-scoped custom role.
 */
export const createProjectRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Tên vai trò không được để trống")
    .max(50, "Tên vai trò không được quá 50 ký tự"),
  allowedTaskTrackers: z.array(z.string()).optional(),
})

/**
 * Zod validation schema for updating a project-scoped custom role.
 */
export const updateProjectRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Tên vai trò không được để trống")
    .max(50, "Tên vai trò không được quá 50 ký tự")
    .optional(),
  allowedTaskTrackers: z.array(z.string()).optional(),
})
