import { z } from "zod"

export const createPayslipTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().optional(),
  components: z
    .array(
      z.object({
        componentId: z.string().min(1, "Component is required"),
        overrideFormula: z.string().optional(),
      }),
    )
    .min(1, "At least one salary component is required"),
})

export type CreatePayslipTemplateFormData = z.infer<typeof createPayslipTemplateSchema>

/**
 * Validation schema for configuring an employee's salary and assigned payslip template.
 */
export const salaryConfigFormSchema = z.object({
  templateId: z.string().min(1, "Vui lòng chọn mẫu phiếu lương"),
  baseSalary: z.number().min(0, "Lương cơ bản không được âm"),
  effectiveFrom: z.string().min(1, "Vui lòng nhập ngày áp dụng"),
  note: z.string().optional(),
})

export type SalaryConfigFormValues = z.infer<typeof salaryConfigFormSchema>

