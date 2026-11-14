import { EMPLOYEE_TYPE, WORK_SCHEDULE_TYPE } from "@/config/entities/employee.config"
import type { Employee } from "@/types/employee.types"

import type { EmployeeEditFormValues } from "./employee-edit-form.schema"

/** Normalizes API date strings to HTML date input format (YYYY-MM-DD). */
export function formatDateForEmployeeEditInput(date: string | Date | null | undefined) {
  if (!date) return undefined
  if (typeof date === "string") return date.split("T")[0]
  return date.toISOString().split("T")[0]
}

/** Maps Employee entity to react-hook-form default values — legacy PT category → workScheduleType. */
export function buildEmployeeEditFormValues(employee: Employee): EmployeeEditFormValues {
  return {
    fullName: employee.fullName,
    email: employee.email,
    username: employee.username,
    password: "",
    phone: employee.phone || undefined,
    position: employee.position || undefined,
    positionId: employee.positionId || undefined,
    employeeType:
      employee.employeeType === EMPLOYEE_TYPE.PART_TIME
        ? EMPLOYEE_TYPE.FULL_TIME
        : employee.employeeType,
    workScheduleType:
      employee.workScheduleType ??
      (employee.employeeType === EMPLOYEE_TYPE.PART_TIME
        ? WORK_SCHEDULE_TYPE.PART_TIME
        : WORK_SCHEDULE_TYPE.FULL_TIME),
    status: employee.status,
    dateOfBirth: formatDateForEmployeeEditInput(employee.dateOfBirth),
    nationalId: employee.nationalId || undefined,
    address: employee.address || undefined,
    startDate: formatDateForEmployeeEditInput(employee.startDate),
    endDate: formatDateForEmployeeEditInput(employee.endDate),
  }
}
