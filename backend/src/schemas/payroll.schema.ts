import { z } from "zod"

export const assignSalaryConfigSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  effectiveFrom: z.coerce.date(),
  note: z.string().optional(),
})

export const bulkAssignSalaryTemplateSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1, "At least one employee is required"),
  templateId: z.string().min(1, "Template ID is required"),
  defaultBaseSalary: z.number().min(0, "Default base salary must be non-negative"),
  effectiveFrom: z.coerce.date(),
  note: z.string().optional(),
})

export type AssignSalaryConfigSchemaType = z.infer<typeof assignSalaryConfigSchema>
export type BulkAssignSalaryTemplateSchemaType = z.infer<typeof bulkAssignSalaryTemplateSchema>
