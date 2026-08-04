import { ATTENDANCE_STATUS, IAttendanceStatus } from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { PAYROLL_DEMO } from "@/scripts/seeders/payroll-demo.config.ts"

const RULES = {
  ABSENCE_INTERVAL: 17,
  LATE_INTERVAL: 5,
  EARLY_INTERVAL: 7,
  OVERTIME_INTERVAL: 11,
  LATE_MINUTES: 15,
  EARLY_LEAVE_MINUTES: 20,
  OVERTIME_MINUTES: 120,
  SUNDAY: 0,
  SATURDAY: 6,
} as const

export interface IPayrollDemoAttendanceScenario {
  status: IAttendanceStatus
  checkInVariance: number
  checkOutVariance: number
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
}

const ON_TIME_SCENARIO: IPayrollDemoAttendanceScenario = {
  status: ATTENDANCE_STATUS.ON_TIME,
  checkInVariance: 0,
  checkOutVariance: 0,
  lateMinutes: 0,
  earlyLeaveMinutes: 0,
  overtimeMinutes: 0,
}

export function getPayrollDemoBusinessDates(): Date[] {
  const dates: Date[] = []
  for (
    let time = PAYROLL_DEMO.ATTENDANCE_START.getTime();
    time <= PAYROLL_DEMO.ATTENDANCE_END.getTime();
    time += ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY
  ) {
    const date = new Date(time)
    const weekday = date.getUTCDay()
    if (weekday !== RULES.SUNDAY && weekday !== RULES.SATURDAY) dates.push(date)
  }
  return dates
}

export function getPayrollDemoScenario(
  username: string,
  assignedDate: Date,
): IPayrollDemoAttendanceScenario {
  const employeeIndex = PAYROLL_DEMO.DETAILED_EMPLOYEE_USERNAMES.indexOf(username as never)
  if (employeeIndex < 0) return ON_TIME_SCENARIO

  const dayIndex = Math.round(
    (assignedDate.getTime() - PAYROLL_DEMO.ATTENDANCE_START.getTime()) /
      ATTENDANCE_TIME_RULES.MILLISECONDS_PER_DAY,
  )
  const sequence = dayIndex + employeeIndex
  if (sequence % RULES.ABSENCE_INTERVAL === 0)
    return { ...ON_TIME_SCENARIO, status: ATTENDANCE_STATUS.ABSENT }
  if (sequence % RULES.OVERTIME_INTERVAL === 0)
    return {
      ...ON_TIME_SCENARIO,
      status: ATTENDANCE_STATUS.OVERTIME,
      checkOutVariance: RULES.OVERTIME_MINUTES,
      overtimeMinutes: RULES.OVERTIME_MINUTES,
    }
  if (sequence % RULES.EARLY_INTERVAL === 0)
    return {
      ...ON_TIME_SCENARIO,
      status: ATTENDANCE_STATUS.EARLY_LEAVE,
      checkOutVariance: -RULES.EARLY_LEAVE_MINUTES,
      earlyLeaveMinutes: RULES.EARLY_LEAVE_MINUTES,
    }
  if (sequence % RULES.LATE_INTERVAL === 0)
    return {
      ...ON_TIME_SCENARIO,
      status: ATTENDANCE_STATUS.LATE,
      checkInVariance: RULES.LATE_MINUTES,
      lateMinutes: RULES.LATE_MINUTES,
    }
  return ON_TIME_SCENARIO
}

export function getPayrollDemoShiftDuration(startTime: number, endTime: number): number {
  return endTime >= startTime
    ? endTime - startTime
    : endTime + ATTENDANCE_TIME_RULES.MINUTES_PER_DAY - startTime
}
