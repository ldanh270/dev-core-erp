import { ATTENDANCE_STATUS } from "@/configs/entities/attendance.config.ts"
import type { IAttendanceRecordDTO, IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import { computeAttendanceMetrics } from "@/utils/attendance/attendance-metrics.util.ts"

function attendanceInstant(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute = 0,
) {
  return new Date(Date.UTC(year, monthIndex, day, hour - 7, minute))
}

const record = {
  id: "attendance-1",
  employeeId: "employee-1",
  employeeShiftId: "employee-shift-1",
  date: new Date(Date.UTC(2026, 6, 16)),
  checkInAt: attendanceInstant(2026, 6, 16, 8),
  status: ATTENDANCE_STATUS.ON_TIME,
  lateMinutes: 0,
  earlyLeaveMinutes: 0,
  overtimeMinutes: 0,
  totalWorkMinutes: 0,
} satisfies IAttendanceRecordDTO

const shift = {
  startTime: 8 * 60,
  endTime: 17 * 60,
  breakStartTime: 12 * 60,
  breakEndTime: 13 * 60,
  gracePeriodMinutes: 0,
} satisfies IAttendanceShiftDTO

describe("computeAttendanceMetrics break deduction", () => {
  it("deducts the full break from an 08:00-17:00 attendance", () => {
    const metrics = computeAttendanceMetrics(record, shift, attendanceInstant(2026, 6, 16, 17))

    expect(metrics.totalWorkMinutes).toBe(8 * 60)
  })

  it("deducts only the attended part of the break", () => {
    // Check-in during lunch deducts only the remaining overlap, not the full configured break.
    const partialRecord = {
      ...record,
      checkInAt: attendanceInstant(2026, 6, 16, 12, 30),
    }

    const metrics = computeAttendanceMetrics(
      partialRecord,
      shift,
      attendanceInstant(2026, 6, 16, 17),
    )

    expect(metrics.totalWorkMinutes).toBe(4 * 60)
  })

  it("keeps legacy gross minutes when a shift has no break", () => {
    const metrics = computeAttendanceMetrics(
      record,
      { ...shift, breakStartTime: null, breakEndTime: null },
      attendanceInstant(2026, 6, 16, 17),
    )

    expect(metrics.totalWorkMinutes).toBe(9 * 60)
  })
})
