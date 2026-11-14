import {
  EMPLOYEE_TYPE,
  type IEmployeeType,
  type IWorkScheduleType,
  WORK_SCHEDULE_TYPE,
} from "@/configs/entities/employee.config.ts"

type EmployeeScheduleFields = {
  workScheduleType?: IWorkScheduleType | null
  employeeType?: IEmployeeType | null
}

/** True when employee works part-time hours (Spent Time, availability, etc.).
 *  Checks both fields: legacy rows may only have employeeType=part_time before migration. */
export function isPartTimeWorkSchedule(employee: EmployeeScheduleFields): boolean {
  return (
    employee.workScheduleType === WORK_SCHEDULE_TYPE.PART_TIME ||
    employee.employeeType === EMPLOYEE_TYPE.PART_TIME
  )
}

/** Canonical schedule for new code paths — prefer over raw employeeType. */
export function resolveWorkScheduleType(
  employee: EmployeeScheduleFields,
): typeof WORK_SCHEDULE_TYPE.FULL_TIME | typeof WORK_SCHEDULE_TYPE.PART_TIME {
  return isPartTimeWorkSchedule(employee)
    ? WORK_SCHEDULE_TYPE.PART_TIME
    : WORK_SCHEDULE_TYPE.FULL_TIME
}
