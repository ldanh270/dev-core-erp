import { z } from "zod"

export const createProjectTaskStatusSchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),
    name: z.string().min(1, "Name is required").max(50, "Name too long").trim(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Invalid HEX color format")
      .optional(),
    order: z.number().int().optional(),
    isDefault: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
  })
  .strict()

export type CreateProjectTaskStatusSchemaType = z.infer<typeof createProjectTaskStatusSchema>

export const updateProjectTaskStatusSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").max(50, "Name too long").trim().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Invalid HEX color format")
      .optional(),
    order: z.number().int().optional(),
    isDefault: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
  })
  .strict()

export type UpdateProjectTaskStatusSchemaType = z.infer<typeof updateProjectTaskStatusSchema>

export const deleteProjectTaskStatusSchema = z
  .object({
    fallbackStatusId: z.string().optional(),
  })
  .strict()

export type DeleteProjectTaskStatusSchemaType = z.infer<typeof deleteProjectTaskStatusSchema>
