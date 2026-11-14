/** Seeds deterministic attendance demo records without modifying real employee attendance. */
import { ATTENDANCE_STATUS, EMPLOYEE_SHIFT_STATUS } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  buildDemoShiftSelections,
  demoAssignmentKey,
} from "@/scripts/attendance-demo-assignment.util.ts"
import {
  getPayrollDemoBusinessDates,
  getPayrollDemoScenario,
  getPayrollDemoShiftDuration,
} from "@/scripts/seeders/payroll-demo-attendance.util.ts"
import { PAYROLL_DEMO } from "@/scripts/seeders/payroll-demo.config.ts"
import {
  getAttendanceClockMinutes,
  toAttendanceInstant,
} from "@/utils/attendance/attendance-time-zone.util.ts"

import { SeedContext, createEmptyContext } from "./seed-context.ts"
import { ISeeder } from "./seeder.interface.ts"
import { registry } from "./seeder.registry.ts"

export class AttendanceDemoWeekSeeder implements ISeeder {
  readonly name = "AttendanceDemoWeek"
  readonly order = 12.5

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    const [employees, fallbackShift] = await Promise.all([
      prisma.employee.findMany({
        where: { deletedAt: null, status: EMPLOYEE_STATUS.ACTIVE },
        orderBy: { fullName: "asc" },
      }),
      prisma.workingShift.findFirst({ where: { isActive: true }, orderBy: { startTime: "asc" } }),
    ])
    if (!fallbackShift || employees.length === 0) {
      throw new Error("Active employee or working shift missing")
    }

    const creator = employees.find((employee) => employee.username === "admin") ?? employees[0]
    const dates = getPayrollDemoBusinessDates()
    const schedules = await prisma.shiftSchedule.findMany({
      where: {
        employeeId: { in: employees.map((employee) => employee.id) },
        validFrom: { lte: PAYROLL_DEMO.ATTENDANCE_END },
        OR: [{ validTo: null }, { validTo: { gte: PAYROLL_DEMO.ATTENDANCE_START } }],
      },
      include: { days: { include: { shift: true } } },
      orderBy: { validFrom: "desc" },
    })
    const desiredAssignments = buildDemoShiftSelections(
      employees,
      schedules,
      dates,
      fallbackShift.id,
    ).map((selection) => ({
      ...selection,
      status: EMPLOYEE_SHIFT_STATUS.CONFIRMED,
      createdById: creator.id,
    }))
    const desiredAssignmentKeys = new Set(
      desiredAssignments.map((assignment) =>
        demoAssignmentKey(assignment.employeeId, assignment.assignedDate, assignment.shiftId),
      ),
    )

    // Remove only rows owned by this demo script, including an older timezone-shifted run.
    await prisma.employeeShift.deleteMany({
      where: {
        attendanceRecord: {
          is: {
            note: {
              in: [...PAYROLL_DEMO.LEGACY_ATTENDANCE_NOTES, PAYROLL_DEMO.ATTENDANCE_NOTE],
            },
          },
        },
      },
    })

    await prisma.employeeShift.createMany({
      data: desiredAssignments,
      skipDuplicates: true,
    })

    const assignedShifts = (
      await prisma.employeeShift.findMany({
        where: {
          employeeId: { in: employees.map((employee) => employee.id) },
          assignedDate: { in: dates },
        },
        include: { shift: true },
      })
    ).filter((employeeShift) =>
      desiredAssignmentKeys.has(
        demoAssignmentKey(
          employeeShift.employeeId,
          employeeShift.assignedDate,
          employeeShift.shiftId,
        ),
      ),
    )
    const employeeUsernames = new Map<string, string>(
      employees.map((employee): [string, string] => [employee.id, employee.username]),
    )

    await prisma.attendanceRecord.createMany({
      data: assignedShifts.map((employeeShift) => {
        const scenario = getPayrollDemoScenario(
          employeeUsernames.get(employeeShift.employeeId) ?? "",
          employeeShift.assignedDate,
        )
        const isAbsent = scenario.status === ATTENDANCE_STATUS.ABSENT
        const shiftDuration = getPayrollDemoShiftDuration(
          employeeShift.shift.startTime,
          employeeShift.shift.endTime,
        )

        return {
          employeeId: employeeShift.employeeId,
          employeeShiftId: employeeShift.id,
          date: employeeShift.assignedDate,
          checkInAt: isAbsent
            ? null
            : toAttendanceInstant(
                employeeShift.assignedDate,
                employeeShift.shift.startTime + scenario.checkInVariance,
              ),
          checkOutAt: isAbsent
            ? null
            : toAttendanceInstant(
                employeeShift.assignedDate,
                employeeShift.shift.endTime + scenario.checkOutVariance,
              ),
          status: scenario.status,
          lateMinutes: scenario.lateMinutes,
          earlyLeaveMinutes: scenario.earlyLeaveMinutes,
          overtimeMinutes: scenario.overtimeMinutes,
          totalWorkMinutes: isAbsent
            ? 0
            : shiftDuration -
              scenario.lateMinutes -
              scenario.earlyLeaveMinutes +
              scenario.overtimeMinutes,
          note: PAYROLL_DEMO.ATTENDANCE_NOTE,
        }
      }),
      skipDuplicates: true,
    })

    const records = await prisma.attendanceRecord.findMany({
      where: { note: PAYROLL_DEMO.ATTENDANCE_NOTE, checkInAt: { not: null } },
    })
    await prisma.realShift.createMany({
      data: records.flatMap((record) => {
        const checkInAt = record.checkInAt
        if (!checkInAt) return []

        return [
          {
            employeeId: record.employeeId,
            attendanceRecordId: record.id,
            date: record.date,
            actualStartTime: getAttendanceClockMinutes(checkInAt),
            actualEndTime: record.checkOutAt ? getAttendanceClockMinutes(record.checkOutAt) : null,
            isMatched: record.lateMinutes === 0,
          },
        ]
      }),
      skipDuplicates: true,
    })

    console.log(
      `Payroll demo attendance ready: ${assignedShifts.length} employee-days, 01/05-31/07/2026`,
    )
    return {}
  }
}

registry.register(new AttendanceDemoWeekSeeder())

if (import.meta.main) {
  const seeder = new AttendanceDemoWeekSeeder()
  await seeder.run(createEmptyContext())
  await prisma.$disconnect()
}
