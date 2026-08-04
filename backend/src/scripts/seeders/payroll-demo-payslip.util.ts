import { ATTENDANCE_STATUS, EMPLOYEE_SHIFT_STATUS } from "@/configs/entities/attendance.config.ts"
import { SALARY_COMPONENT_TYPES } from "@/configs/entities/payroll.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { PAYROLL_DEMO } from "@/scripts/seeders/payroll-demo.config.ts"

import { ComponentType, Prisma } from "@prisma/client"
import * as math from "mathjs"

export const payrollDemoSalaryConfigInclude = {
  template: { include: { components: { include: { component: true } } } },
} satisfies Prisma.EmployeeSalaryConfigInclude

export type PayrollDemoSalaryConfig = Prisma.EmployeeSalaryConfigGetPayload<{
  include: typeof payrollDemoSalaryConfigInclude
}>

export type PayrollDemoAttendanceRecord = Prisma.AttendanceRecordGetPayload<{
  include: { realShift: true }
}>

export interface IPayrollDemoAttendanceSummary {
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  totalWorkMinutes: number
  holidayDays: number
}

export interface IPayrollDemoPayslipValues extends IPayrollDemoAttendanceSummary {
  totalAdditions: number
  totalDeductions: number
  netSalary: number
  details: Array<{ componentId: string; name: string; type: ComponentType; value: number }>
}

export function summarizePayrollDemoAttendance(
  records: PayrollDemoAttendanceRecord[],
): IPayrollDemoAttendanceSummary {
  return records.reduce<IPayrollDemoAttendanceSummary>(
    (summary, record) => {
      if (record.status === ATTENDANCE_STATUS.ON_TIME || record.status === ATTENDANCE_STATUS.LATE)
        summary.workingDays += 1
      if (record.status === ATTENDANCE_STATUS.ABSENT) {
        if (record.realShift?.isPaidLeave) summary.workingDays += 1
        else summary.absentDays += 1
      }
      if (record.status === ATTENDANCE_STATUS.OVERTIME) summary.workingDays += 1
      if (record.status === (EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as string)) summary.holidayDays += 1
      summary.overtimeMinutes += record.overtimeMinutes
      summary.lateMinutes += record.lateMinutes
      summary.earlyLeaveMinutes += record.earlyLeaveMinutes
      summary.totalWorkMinutes += record.totalWorkMinutes
      return summary
    },
    {
      workingDays: 0,
      absentDays: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      totalWorkMinutes: 0,
      holidayDays: 0,
    },
  )
}

export function createPayrollDemoPayslipValues(
  config: PayrollDemoSalaryConfig,
  attendance: IPayrollDemoAttendanceSummary,
  variables: Record<string, number>,
): IPayrollDemoPayslipValues {
  const context: Record<string, unknown> = {
    baseSalary: Number(config.baseSalary),
    workingDays: variables.standardWorkingDays ?? PAYROLL_DEMO.STANDARD_WORKING_DAYS,
    actualWorkingDays: attendance.workingDays,
    absentDays: attendance.absentDays,
    overtimeMinutes: attendance.overtimeMinutes,
    lateMinutes: attendance.lateMinutes,
    earlyLeaveMinutes: attendance.earlyLeaveMinutes,
    holidayDays: attendance.holidayDays,
    totalWorkMinutes: attendance.totalWorkMinutes,
    totalWorkHours: attendance.totalWorkMinutes / ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR,
    MAX: Math.max,
    MIN: Math.min,
    ...variables,
  }
  let totalAdditions = new Prisma.Decimal(0)
  let totalDeductions = new Prisma.Decimal(0)
  const details = config.template.components.map((templateComponent) => {
    context.totalAdditions = Number(totalAdditions)
    context.totalDeductions = Number(totalDeductions)
    const formula = templateComponent.overrideFormula ?? templateComponent.component.formula
    const value = new Prisma.Decimal(Math.max(0, Number(math.evaluate(formula, context))))
    if (templateComponent.component.type === SALARY_COMPONENT_TYPES[0])
      totalAdditions = totalAdditions.add(value)
    else totalDeductions = totalDeductions.add(value)
    return {
      componentId: templateComponent.component.id,
      name: templateComponent.component.name,
      type: templateComponent.component.type,
      value: Number(value.toFixed(2)),
    }
  })
  return {
    ...attendance,
    totalAdditions: Number(totalAdditions.toFixed(2)),
    totalDeductions: Number(totalDeductions.toFixed(2)),
    netSalary: Number(totalAdditions.minus(totalDeductions).toFixed(2)),
    details,
  }
}
