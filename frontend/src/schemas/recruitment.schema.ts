import { EMPLOYEE_TYPES } from "@/config/entities/employee.config"
import { REQUISITION_PRIORITIES, REQUISITION_PRIORITY } from "@/config/entities/recruitment.config"
import type { RecruitmentFormField } from "@/types/recruitment.types"

import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().positive().optional(),
)

export const requisitionFormSchema = z
  .object({
    title: z.string().trim().min(1, "Vui lòng nhập vị trí cần tuyển").max(255),
    department: optionalText,
    positionLevel: optionalText,
    employmentType: z.enum(EMPLOYEE_TYPES),
    headcount: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
    priority: z.enum(REQUISITION_PRIORITIES),
    salaryMin: optionalPositiveNumber,
    salaryMax: optionalPositiveNumber,
    reason: optionalText,
    targetHireDate: optionalText,
    targetCloseDate: optionalText,
    approverId: z.string().min(1, "Vui lòng chọn người duyệt"),
  })
  .refine(({ salaryMin, salaryMax }) => !salaryMin || !salaryMax || salaryMin <= salaryMax, {
    message: "Lương tối thiểu không được lớn hơn lương tối đa",
    path: ["salaryMax"],
  })

export type RequisitionFormValues = z.input<typeof requisitionFormSchema>

export const defaultRequisitionValues: RequisitionFormValues = {
  title: "",
  department: "",
  positionLevel: "",
  employmentType: EMPLOYEE_TYPES[0],
  headcount: 1,
  priority: REQUISITION_PRIORITY.MEDIUM,
  salaryMin: undefined,
  salaryMax: undefined,
  reason: "",
  targetHireDate: "",
  targetCloseDate: "",
  approverId: "",
}

export const defaultCandidateSchema: RecruitmentFormField[] = [
  { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
  { key: "email", label: "Email", type: "short_text", required: true },
  { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
  { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
]

export const isEmployeeType = (value: string): value is RequisitionFormValues["employmentType"] =>
  (EMPLOYEE_TYPES as readonly string[]).includes(value)

export const isRequisitionPriority = (value: string): value is RequisitionFormValues["priority"] =>
  (REQUISITION_PRIORITIES as readonly string[]).includes(value)
