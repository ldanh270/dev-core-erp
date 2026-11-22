export const PAYROLL_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const
export type PayrollStatus = (typeof PAYROLL_STATUS)[keyof typeof PAYROLL_STATUS]

/** Search parameter used by payroll notification links to open the matching detail. */
export const PAYROLL_DETAIL_SEARCH_PARAM = "payrollId"

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: "Bản nháp",
  pending_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  paid: "Đã thanh toán",
}

// Maps to shadcn Badge variant
export const PAYROLL_STATUS_BADGE: Record<
  PayrollStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  pending_approval: "default",
  approved: "outline", // will override with success token via className
  rejected: "destructive",
  paid: "outline",
}

export const PAYSLIP_RECEIPT_STATUS = {
  NOT_RECEIVED: "not_received",
  RECEIVED: "received",
} as const
export type PayslipReceiptStatus =
  (typeof PAYSLIP_RECEIPT_STATUS)[keyof typeof PAYSLIP_RECEIPT_STATUS]

export const PAYSLIP_RECEIPT_STATUS_LABELS: Record<PayslipReceiptStatus, string> = {
  not_received: "Chưa nhận",
  received: "Đã nhận",
}

export const SALARY_COMPONENT_TYPES = ["addition", "deduction"] as const

export const COMPONENT_TYPE = { ADDITION: "addition", DEDUCTION: "deduction" } as const
export type ComponentType = (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE]

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  addition: "Cộng vào",
  deduction: "Khấu trừ",
}

export const SALARY_COMPONENT_VALUE_TYPES = ["currency", "number", "percentage"] as const

export const COMPONENT_VALUE_TYPE = {
  CURRENCY: "currency",
  NUMBER: "number",
  PERCENTAGE: "percentage",
} as const
export type ComponentValueType = (typeof COMPONENT_VALUE_TYPE)[keyof typeof COMPONENT_VALUE_TYPE]

export const COMPONENT_VALUE_TYPE_LABELS: Record<ComponentValueType, string> = {
  currency: "Tiền tệ",
  number: "Số",
  percentage: "Phần trăm",
}

export const FORMULA_VALIDATION_STATUS = {
  IDLE: "idle",
  VALIDATING: "validating",
  VALID: "valid",
  INVALID: "invalid",
} as const
export type FormulaValidationStatus =
  (typeof FORMULA_VALIDATION_STATUS)[keyof typeof FORMULA_VALIDATION_STATUS]

export const PAYROLL_SETTINGS_FIELDS = [
  "triggerDay",
  "triggerHour",
  "triggerMinute",
  "approvalDay",
  "approvalHour",
  "approvalMinute",
] as const

export const PAYROLL_QUERY_KEYS = {
  SETTINGS: ["payroll-settings"] as const,
  EMPLOYEE_SALARY_CONFIG: ["employee-salary-config"] as const,
  PAYSLIP_TEMPLATES: ["payslip-templates"] as const,
  MY_PAYSLIPS: ["my-payslips"] as const,
  PAYROLLS: ["payrolls"] as const,
  PAYROLL_DETAILS: ["payrollDetails"] as const,
  PAYSLIPS_HISTORY: ["payslips-history"] as const,
  PAYSLIP: ["payslip"] as const,
  SALARY_COMPONENTS: ["salary-components"] as const,
  SALARY_VARIABLES: ["salary-variables"] as const,
} as const
