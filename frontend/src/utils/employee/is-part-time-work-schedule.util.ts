import {
  EMPLOYEE_TYPE,
  type IEmployeeType,
  type IWorkScheduleType,
  WORK_SCHEDULE_TYPE,
} from "@/config/entities/employee.config"

type EmployeeScheduleFields = {
  workScheduleType?: IWorkScheduleType | null
  employeeType?: IEmployeeType | null
}

export function isPartTimeWorkSchedule(employee: EmployeeScheduleFields): boolean {
  // Prefer workScheduleType; fall back to legacy employeeType for older records.
  return (
    employee.workScheduleType === WORK_SCHEDULE_TYPE.PART_TIME ||
    employee.employeeType === EMPLOYEE_TYPE.PART_TIME
  )
}

export function resolveWorkScheduleType(
  employee: EmployeeScheduleFields,
): typeof WORK_SCHEDULE_TYPE.FULL_TIME | typeof WORK_SCHEDULE_TYPE.PART_TIME {
  // Single source for nav/routing when only legacy employeeType is set.
  return isPartTimeWorkSchedule(employee)
    ? WORK_SCHEDULE_TYPE.PART_TIME
    : WORK_SCHEDULE_TYPE.FULL_TIME
}
