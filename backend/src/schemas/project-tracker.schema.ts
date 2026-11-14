import { z } from "zod"

/**
 * Zod validation schema for creating a project-scoped custom task tracker.
 */
export const createProjectTrackerSchema = z.object({
  name: z
    .string()
    .min(1, "Tên loại yêu cầu không được để trống")
    .max(50, "Tên loại yêu cầu quá dài")
    .trim(),
  isActive: z.boolean().optional(),
})

/**
 * Zod validation schema for updating a project-scoped custom task tracker.
 */
export const updateProjectTrackerSchema = z.object({
  name: z
    .string()
    .min(1, "Tên loại yêu cầu không được để trống")
    .max(50, "Tên loại yêu cầu quá dài")
    .trim()
    .optional(),
  isActive: z.boolean().optional(),
})
