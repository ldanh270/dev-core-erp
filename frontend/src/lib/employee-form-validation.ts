import type { IEmployeeWizardFormData } from "@/types/employee-wizard.types"

const VIETNAMESE_PHONE_PATTERN = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getBioFieldError(
  field: "fullName" | "phone" | "email",
  value: string,
): string | undefined {
  const trimmedValue = value.trim()

  if (field === "fullName") {
    if (!trimmedValue) return "Vui lòng nhập họ và tên"
    if (trimmedValue.length < 2) return "Họ và tên phải có ít nhất 2 ký tự"
  }

  if (field === "phone") {
    if (!trimmedValue) return "Vui lòng nhập số điện thoại"
    if (!VIETNAMESE_PHONE_PATTERN.test(trimmedValue)) return "Số điện thoại Việt Nam không hợp lệ"
  }

  if (field === "email" && trimmedValue && !EMAIL_PATTERN.test(trimmedValue)) {
    return "Địa chỉ email không hợp lệ"
  }

  return undefined
}

export function getJobFieldError(
  field: "employeeCode" | "workLocation" | "department" | "positionId" | "startDate",
  value: string,
): string | undefined {
  const labels = {
    employeeCode: "mã nhân sự",
    workLocation: "nơi làm việc",
    department: "bộ phận",
    positionId: "vị trí",
    startDate: "ngày vào làm",
  }

  const action = field === "employeeCode" || field === "positionId" ? "nhập" : "chọn"
  return value.trim() ? undefined : `Vui lòng ${action} ${labels[field]}`
}

export function hasRequiredEmployeeFields(data: IEmployeeWizardFormData): boolean {
  return (
    !getBioFieldError("fullName", data.fullName) &&
    !getBioFieldError("phone", data.phone) &&
    !getBioFieldError("email", data.email) &&
    !getJobFieldError("employeeCode", data.employeeCode) &&
    !getJobFieldError("workLocation", data.workLocation) &&
    !getJobFieldError("department", data.department) &&
    !getJobFieldError("positionId", data.positionId) &&
    !getJobFieldError("startDate", data.startDate)
  )
}
