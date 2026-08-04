/** Fixed payroll demo period. Keep historical payroll data deterministic for presentations. */
export const PAYROLL_DEMO = {
  YEAR: 2026,
  PAYROLL_MONTHS: [5, 6],
  ATTENDANCE_START: new Date("2026-05-01T00:00:00.000Z"),
  ATTENDANCE_END: new Date("2026-07-31T00:00:00.000Z"),
  ATTENDANCE_NOTE: "Demo payroll attendance 01/05-31/07/2026",
  LEGACY_ATTENDANCE_NOTES: [
    "Demo attendance week 13-19/07/2026",
    "Demo attendance 01/06-18/07/2026",
    "Demo attendance 01/06-02/08/2026",
  ],
  DETAILED_EMPLOYEE_USERNAMES: [
    "hr_manager",
    "general_manager",
    "team_leader",
    "employee",
  ],
  STANDARD_WORKING_DAYS: 22,
  SYMBOLIC_WORKING_DAYS: 22,
} as const

export function isPayrollDemoAttendanceDate(date: Date): boolean {
  return date >= PAYROLL_DEMO.ATTENDANCE_START && date <= PAYROLL_DEMO.ATTENDANCE_END
}
