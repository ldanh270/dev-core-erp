export const SALARY_COMPONENT_TYPES = ["addition", "deduction"] as const
export type SalaryComponentType = (typeof SALARY_COMPONENT_TYPES)[number]

export const COMPONENT_TYPE = { ADDITION: "addition", DEDUCTION: "deduction" } as const

export const PAYROLL_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const

export const PAYROLL_STATUSES = [
  PAYROLL_STATUS.DRAFT,
  PAYROLL_STATUS.PENDING_APPROVAL,
  PAYROLL_STATUS.APPROVED,
  PAYROLL_STATUS.REJECTED,
  PAYROLL_STATUS.PAID,
] as const
export type PayrollStatusType = (typeof PAYROLL_STATUSES)[number]

/** Permissions required by the payroll approval endpoints. */
export const PAYROLL_APPROVAL_PERMISSIONS = {
  READ: "payroll.read",
  APPROVE: "payroll.approve",
} as const

/** Payroll inbox copy and links to the matching employee and approver screens. */
export const PAYROLL_NOTIFICATION = {
  PAYROLL_ID_PARAM: "payrollId",
  APPROVAL: {
    PATH: "/payroll/list",
    TITLE: "Có kỳ lương cần duyệt",
    /**
     * Formats the payroll review alert.
     * @param {string} period - Display label for the payroll period.
     * @returns {string} Notification body.
     */
    message: (period: string) => `Kỳ lương ${period} đã được tạo và đang chờ duyệt.`,
  },
  PAYSLIP: {
    PATH: "/payroll/my-payslips",
    TITLE: "Phiếu lương đã có",
    /**
     * Formats the employee payslip alert.
     * @param {string} period - Display label for the payroll period.
     * @returns {string} Notification body.
     */
    message: (period: string) => `Bạn có thể kiểm tra phiếu lương kỳ ${period}.`,
  },
} as const

// Formula context variable names (documentation / validation)
export const FORMULA_CONTEXT_VARS = [
  "baseSalary",
  "mealAllowance",
  "transportAllowance",
  "housingAllowance",
  "phoneAllowance",
  "responsibilityAllowance",
  "seniorityAllowance",
  "standardDays",
  "workingDays",
  "absentDays",
  "overtimeMinutes",
  "lateMinutes",
  "holidayDays",
] as const

// Helper functions
export const generateDefaultPayrollName = (month: number, year: number): string => {
  return `Bảng lương tháng ${month}/${year}`
}
