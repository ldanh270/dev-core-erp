import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import {
  IAttendanceMetricsDTO,
  IAttendanceRecordDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IGpsScanDTO,
  IRealShiftUpsertDTO,
} from "@/types/attendance.types.ts"
import {
  getAttendanceClockMinutes,
  getAttendanceDateOnly,
} from "@/utils/attendance/attendance-time-zone.util.ts"
import { AppError } from "@/utils/error.util.ts"

import { AttendanceStatus, Prisma, PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Repository implementation for attendance-related data using Prisma.
 */
export class PrismaAttendanceRepository extends BaseRepository implements IAttendanceRepository {
  /**
   * Creates a new PrismaAttendanceRepository instance.
   * @param prisma - The PrismaClient instance.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Records a check-in for an employee.
   * @param employeeId - The employee ID.
   * @param location - The GPS location of the check-in.
   * @param employeeShiftId - The associated employee shift ID.
   * @returns The created or updated attendance record.
   */
  async checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    employeeShiftId: string,
    metrics: IAttendanceMetricsDTO = {},
  ): Promise<IAttendanceRecordDTO> {
    const checkInAt = new Date()
    const today = getAttendanceDateOnly(checkInAt)
    const existingRecord = await this.prisma.attendanceRecord.findUnique({
      where: { employeeShiftId },
      select: { id: true, checkOutAt: true },
    })

    // Do not upsert over a completed attendance row. A new scan after checkout must use
    // another EmployeeShift, otherwise check-in coordinates/time would corrupt history.
    if (existingRecord?.checkOutAt) {
      throw new AppError(
        ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_OUT,
        HttpStatusCode.CONFLICT,
        ATTENDANCE_LAYERS.REPOSITORY,
      )
    }

    // employeeShiftId is unique, so repeated check-in requests for the same open shift
    // update only the open record instead of creating duplicate attendance rows.
    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeShiftId },
      update: {
        checkInAt,
        checkInLat: location.lat,
        checkInLng: location.lng,
        ...metrics,
      },
      create: {
        employeeId,
        employeeShiftId,
        date: today,
        checkInAt,
        checkInLat: location.lat,
        checkInLng: location.lng,
        status: metrics.status ?? AttendanceStatus.absent,
        lateMinutes: metrics.lateMinutes,
        earlyLeaveMinutes: metrics.earlyLeaveMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        totalWorkMinutes: metrics.totalWorkMinutes,
      },
    })

    // RealShift mirrors the actual clock window for payroll/matrix matching.
    const persistedCheckInAt = record.checkInAt ?? checkInAt
    await this.prisma.realShift.upsert({
      where: { attendanceRecordId: record.id },
      update: {
        actualStartTime: getAttendanceClockMinutes(persistedCheckInAt),
        actualEndTime: null,
        isMatched: false,
      },
      create: {
        employeeId,
        attendanceRecordId: record.id,
        date: today,
        actualStartTime: getAttendanceClockMinutes(persistedCheckInAt),
        isMatched: false,
      },
    })

    return record
  }

  /**
   * Records a check-out for an employee.
   * @param recordId - The attendance record ID.
   * @param location - The GPS location of the check-out.
   * @param metrics - Optional attendance metrics.
   * @returns The updated attendance record.
   */
  async checkOut(
    recordId: string,
    location: IGpsScanDTO,
    metrics: IAttendanceMetricsDTO = {},
    realShift: IRealShiftUpsertDTO = {},
  ): Promise<IAttendanceRecordDTO> {
    const checkOutAt = new Date()

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.attendanceRecord.update({
        where: { id: recordId },
        data: {
          checkOutAt,
          checkOutLat: location.lat,
          checkOutLng: location.lng,
          ...metrics,
        },
      })

      if (realShift.actualEndTime != null) {
        const checkInAt = record.checkInAt ?? checkOutAt
        // Upsert: onsite PT may check out without a pre-created RealShift row from template shift.
        await tx.realShift.upsert({
          where: { attendanceRecordId: recordId },
          update: {
            actualEndTime: realShift.actualEndTime,
            isMatched: realShift.isMatched ?? false,
          },
          create: {
            employeeId: record.employeeId,
            attendanceRecordId: recordId,
            date: record.date,
            actualStartTime: getAttendanceClockMinutes(checkInAt),
            actualEndTime: realShift.actualEndTime,
            isMatched: realShift.isMatched ?? false,
          },
        })
      }

      return record
    })
  }

  /**
   * Finds an attendance record by employee ID and date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The attendance record or null if not found.
   */
  async findByEmployeeAndDate(
    employeeId: string,
    date: string | Date,
  ): Promise<IAttendanceRecordDTO | null> {
    const targetDate = getAttendanceDateOnly(date)

    return this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate },
      include: {
        employeeShift: {
          include: {
            shift: true,
          },
        },
        realShift: true,
      },
    })
  }

  async findOpenByEmployeeAndDate(
    employeeId: string,
    date: string | Date,
  ): Promise<IAttendanceRecordDTO | null> {
    const targetDate = getAttendanceDateOnly(date)

    // Scanner toggle depends on the open session, not merely "any record today".
    // A checked-out record would make the UI show Checkout forever.
    return this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate, checkInAt: { not: null }, checkOutAt: null },
      include: {
        employeeShift: {
          include: {
            shift: true,
          },
        },
        realShift: true,
      },
    })
  }

  /**
   * Queries attendance records based on filters.
   * @param query - The query parameters.
   * @returns An array of matching attendance records.
   */
  async queryRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]> {
    const where: Prisma.AttendanceRecordWhereInput = {}

    // Batch employee filtering takes precedence for workforce insights; legacy callers use employeeId.
    if (query.employeeIds && query.employeeIds.length > 0) {
      where.employeeId = { in: query.employeeIds }
    } else if (query.employeeId) {
      where.employeeId = query.employeeId
    }
    if (query.status) where.status = query.status as AttendanceStatus

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) {
        const startDate = getAttendanceDateOnly(query.startDate)
        if (!Number.isNaN(startDate.getTime())) where.date.gte = startDate
      }
      if (query.endDate) {
        const endDate = getAttendanceDateOnly(query.endDate)
        if (!Number.isNaN(endDate.getTime())) where.date.lte = endDate
      }
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            email: true,
          },
        },
        employeeShift: {
          include: {
            shift: true,
          },
        },
        realShift: true,
        correctedByApplication: {
          include: {
            forgotCardDetail: true,
          },
        },
      },
      orderBy: { date: "desc" },
    })
  }
}
