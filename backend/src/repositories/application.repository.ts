import { APPLICATION_TYPES, PAID_LEAVE_TYPES } from "@/configs/entities/attendance.config.ts"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import {
  IApplicationEntity,
  IApplicationListResultDTO,
  IApplicationRepository,
  IAttendanceMetricsDTO,
  ILeaveType,
  IListApplicationsQueryDTO,
  ISubmitApplicationDTO,
} from "@/types/attendance.types.ts"
import { computeAttendanceMetrics } from "@/utils/attendance/attendance-metrics.util.ts"
import {
  getMinutesFromDateTime,
  getShiftDateTimes,
  isActualShiftMatched,
} from "@/utils/attendance/attendance-shift.util.ts"

import {
  ApplicationStatus,
  ApplicationType,
  AttendanceStatus,
  LeaveType,
  PrismaClient,
} from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

// Shared include shape — returns all detail relations + employee info
const APPLICATION_INCLUDE = {
  employee: {
    select: { id: true, fullName: true, email: true, position: true, avatarUrl: true },
  },
  assignedTo: { select: { id: true, fullName: true } },
  approvedBy: { select: { id: true, fullName: true } },
  leaveDetail: true,
  overtimeDetail: { include: { employeeShift: { include: { shift: true } } } },
  workFromHomeDetail: true,
  shiftSwapDetail: {
    include: {
      employeeShift: { include: { shift: true } },
      workingShift: true,
      swapWithEmployee: { select: { id: true, fullName: true } },
      swapWithShift: { include: { shift: true } },
    },
  },
  businessTripDetail: true,
  lateEarlyDetail: { include: { employeeShift: { include: { shift: true } } } },
  regimeDetail: { include: { regimeCategory: true } },
  forgotCardDetail: { include: { employeeShift: { include: { shift: true } } } },
  recruitmentDetail: true,
} as const

const APPLICATION_LIST_SELECT = {
  id: true,
  employeeId: true,
  type: true,
  status: true,
  createdAt: true,
  employee: { select: { id: true, fullName: true } },
  assignedTo: { select: { id: true, fullName: true } },
  approvedBy: { select: { id: true, fullName: true } },
} as const

export class PrismaApplicationRepository extends BaseRepository implements IApplicationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Creates and submits a new application with the correct detail relation in a single query.
   *
   * @param data - The application details and parameters.
   * @returns A promise that resolves to the newly created application with all included relations.
   */
  async submit(data: ISubmitApplicationDTO): Promise<IApplicationEntity> {
    const { employeeId, type, startDate, endDate, reason, note, assignedToId, detail } = data

    // shift_swap starts at partner_pending — the swap partner must confirm first
    const isShiftSwap = type === ApplicationType.shift_swap
    const initialStatus = isShiftSwap
      ? ApplicationStatus.partner_pending
      : ApplicationStatus.pending

    return this.prisma.application.create({
      data: {
        employeeId,
        type: type as ApplicationType,
        status: initialStatus,
        startDate: new Date(startDate),
        endDate: new Date(endDate ?? startDate),
        reason,
        note,
        assignedToId: assignedToId ?? null,
        ...this._buildDetailCreate(data),
      },
      include: APPLICATION_INCLUDE,
    })
  }

  /**
   * Creates and submits multiple applications in a single transaction.
   *
   * @param data - Array of application details.
   * @returns A promise that resolves to an array of created applications.
   */
  async submitBulk(data: ISubmitApplicationDTO[]): Promise<IApplicationEntity[]> {
    const creates = data.map((item) => {
      const { employeeId, type, startDate, endDate, reason, note, assignedToId } = item

      const isShiftSwap = type === ApplicationType.shift_swap
      const initialStatus = isShiftSwap
        ? ApplicationStatus.partner_pending
        : ApplicationStatus.pending

      return this.prisma.application.create({
        data: {
          employeeId,
          type: type as ApplicationType,
          status: initialStatus,
          startDate: new Date(startDate),
          endDate: new Date(endDate ?? startDate),
          reason,
          note,
          assignedToId: assignedToId ?? null,
          ...this._buildDetailCreate(item),
        },
        include: APPLICATION_INCLUDE,
      })
    })

    return this.prisma.$transaction(creates)
  }

  /**
   * Finds a single application by its unique identifier.
   *
   * @param id - The application ID.
   * @returns A promise that resolves to the application details or null if not found.
   */
  async findById(id: string): Promise<IApplicationEntity | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: APPLICATION_INCLUDE,
    })
  }

  /**
   * Retrieves a paginated list of applications for a specific employee.
   *
   * @param employeeId - The employee's ID.
   * @param query - The pagination and filter parameters.
   * @returns A promise that resolves to the matching applications and total count.
   */
  async findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO> {
    const where = this._buildWhere({ ...query, employeeId })
    const statsWhere = this._buildWhere({ ...query, status: undefined, employeeId })
    return this._paginate(where, statsWhere, query)
  }

  /**
   * Retrieves a paginated list of all applications in the database, with filters.
   *
   * @param query - The pagination and filter parameters.
   * @returns A promise that resolves to the matching applications and total count.
   */
  async findAll(query: IListApplicationsQueryDTO): Promise<IApplicationListResultDTO> {
    const where = this._buildWhere(query)
    const statsWhere = this._buildWhere({ ...query, status: undefined })
    return this._paginate(where, statsWhere, query)
  }

  /**
   * Retrieves a paginated list of applications that the specified approver can approve.
   */
  async findApprovals(
    approverId: string,
    managedEmployeeIds: string[],
    isGlobalApprover: boolean,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO> {
    const baseWhere = this._buildWhere(query)

    // Swap partner condition: partner_pending shift_swap where approverId is the swap target
    const partnerPendingCondition = {
      status: ApplicationStatus.partner_pending,
      shiftSwapDetail: { swapWithEmployeeId: approverId },
    }

    const assignedOrManaged = [
      { assignedToId: approverId },
      ...(managedEmployeeIds.length > 0 ? [{ employeeId: { in: managedEmployeeIds } }] : []),
    ]

    let where: Record<string, unknown> = {}

    if (query.status === ApplicationStatus.pending) {
      const { status, ...restWhere } = baseWhere
      where = {
        ...restWhere,
        OR: [
          {
            status: ApplicationStatus.pending,
            OR: assignedOrManaged,
          },
          partnerPendingCondition,
        ],
      }
    } else {
      where = {
        ...baseWhere,
        OR: assignedOrManaged,
      }
    }

    const statsWhere = {
      ...this._buildWhere({ ...query, status: undefined }),
      OR: [
        ...assignedOrManaged,
        {
          status: ApplicationStatus.partner_pending,
          shiftSwapDetail: { swapWithEmployeeId: approverId },
        },
      ],
    }
    return this._paginate(where, statsWhere, query)
  }

  /**
   * Cancels a pending application if it belongs to the specified employee.
   *
   * @param id - The application ID.
   * @param employeeId - The ID of the employee owning the application.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async cancel(id: string, employeeId: string): Promise<IApplicationEntity | null> {
    try {
      return await this.prisma.application.update({
        where: {
          id,
          employeeId,
          status: ApplicationStatus.pending, // DB-level guard
        },
        data: { status: ApplicationStatus.cancelled },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null // record not found or status guard failed
    }
  }

  /**
   * Approves a pending application and records the approving processor.
   * Also executes necessary side-effects (like swapping shifts).
   *
   * @param id - The application ID.
   * @param approvedBy - The ID of the processor approving the application.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async approve(id: string, approvedBy: string): Promise<IApplicationEntity | null> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // 1. Fetch application to check type and details
          const app = await tx.application.findUnique({
            where: { id, status: ApplicationStatus.pending },
            include: APPLICATION_INCLUDE,
          })

          if (!app) return null

          // 2. Execute side-effects
          if (app.type === ApplicationType.shift_swap && app.shiftSwapDetail) {
            const detail = app.shiftSwapDetail
            if (detail.swapWithShiftId && detail.swapWithEmployeeId) {
              // Swapping two existing employee shifts
              const shift1 = await tx.employeeShift.findUnique({
                where: { id: detail.employeeShiftId },
              })
              const shift2 = await tx.employeeShift.findUnique({
                where: { id: detail.swapWithShiftId },
              })

              if (shift1 && shift2) {
                const tempDate = new Date(Date.now() + 1000000 + (Date.now() % 100000))
                // Step 1: Move shift1 to a temp date to avoid unique constraint violations [employeeId, assignedDate]
                await tx.employeeShift.update({
                  where: { id: shift1.id },
                  data: { assignedDate: tempDate },
                })
                // Step 2: Update shift2 with shift1's original shiftId and date
                await tx.employeeShift.update({
                  where: { id: shift2.id },
                  data: { shiftId: shift1.shiftId, assignedDate: shift1.assignedDate },
                })
                // Step 3: Update shift1 with shift2's original shiftId and date
                await tx.employeeShift.update({
                  where: { id: shift1.id },
                  data: { shiftId: shift2.shiftId, assignedDate: shift2.assignedDate },
                })
              }
            } else if (detail.workingShiftId) {
              // Swapping to a different working shift on the same day
              await tx.employeeShift.update({
                where: { id: detail.employeeShiftId },
                data: { shiftId: detail.workingShiftId },
              })
            }
          } else if (app.type === ApplicationType.overtime && app.overtimeDetail) {
            const detail = app.overtimeDetail
            const start = new Date(app.startDate).getTime()
            const end = new Date(app.endDate).getTime()
            const minutes = Math.max(
              0,
              Math.round((end - start) / ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE),
            )

            if (minutes > 0) {
              const shift = await tx.employeeShift.findUnique({
                where: { id: detail.employeeShiftId },
              })
              if (shift) {
                await tx.attendanceRecord.upsert({
                  where: { employeeShiftId: shift.id },
                  create: {
                    employeeId: shift.employeeId,
                    employeeShiftId: shift.id,
                    date: shift.assignedDate,
                    status: AttendanceStatus.overtime,
                    overtimeMinutes: minutes,
                  },
                  update: {
                    overtimeMinutes: { increment: minutes },
                  },
                })
              }
            }
          } else if (app.type === ApplicationType.forgot_card && app.forgotCardDetail) {
            const detail = app.forgotCardDetail
            const shift = await tx.employeeShift.findUnique({
              where: { id: detail.employeeShiftId },
              include: { shift: true },
            })
            if (shift) {
              const existingRecord = await tx.attendanceRecord.findUnique({
                where: { employeeShiftId: shift.id },
              })

              const newCheckInAt = detail.checkInAt
                ? new Date(detail.checkInAt)
                : (existingRecord?.checkInAt ?? null)
              const newCheckOutAt = detail.checkOutAt
                ? new Date(detail.checkOutAt)
                : (existingRecord?.checkOutAt ?? null)

              let metrics: IAttendanceMetricsDTO = {
                status: AttendanceStatus.on_time,
                lateMinutes: 0,
                earlyLeaveMinutes: 0,
                overtimeMinutes: 0,
                totalWorkMinutes: 0,
              }

              if (newCheckInAt && newCheckOutAt) {
                const tempRecord = {
                  checkInAt: newCheckInAt,
                  date: shift.assignedDate,
                }
                metrics = computeAttendanceMetrics(tempRecord, shift.shift, newCheckOutAt)
              } else if (newCheckInAt && !newCheckOutAt) {
                const gracePeriod = shift.shift.gracePeriodMinutes ?? 0
                const { start: scheduledStart } = getShiftDateTimes(
                  new Date(shift.assignedDate),
                  shift.shift,
                )
                const minutesLate = Math.max(
                  0,
                  Math.round(
                    (newCheckInAt.getTime() - scheduledStart.getTime()) /
                      ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
                  ) - gracePeriod,
                )
                metrics = {
                  status: minutesLate > 0 ? AttendanceStatus.late : AttendanceStatus.on_time,
                  lateMinutes: minutesLate,
                  earlyLeaveMinutes: 0,
                  overtimeMinutes: 0,
                  totalWorkMinutes: 0,
                }
              }

              const record = await tx.attendanceRecord.upsert({
                where: { employeeShiftId: shift.id },
                create: {
                  employeeId: shift.employeeId,
                  employeeShiftId: shift.id,
                  date: shift.assignedDate,
                  checkInAt: newCheckInAt,
                  checkOutAt: newCheckOutAt,
                  status: metrics.status ?? AttendanceStatus.on_time,
                  lateMinutes: metrics.lateMinutes ?? 0,
                  earlyLeaveMinutes: metrics.earlyLeaveMinutes ?? 0,
                  overtimeMinutes: metrics.overtimeMinutes ?? 0,
                  totalWorkMinutes: metrics.totalWorkMinutes ?? 0,
                  correctedByApplicationId: app.id,
                },
                update: {
                  checkInAt: newCheckInAt,
                  checkOutAt: newCheckOutAt,
                  status: metrics.status ?? AttendanceStatus.on_time,
                  lateMinutes: metrics.lateMinutes ?? 0,
                  earlyLeaveMinutes: metrics.earlyLeaveMinutes ?? 0,
                  overtimeMinutes: metrics.overtimeMinutes ?? 0,
                  totalWorkMinutes: metrics.totalWorkMinutes ?? 0,
                  correctedByApplicationId: app.id,
                },
              })

              if (newCheckInAt && newCheckOutAt) {
                const actualStartTime = getMinutesFromDateTime(newCheckInAt)
                const actualEndTime = getMinutesFromDateTime(newCheckOutAt)
                await tx.realShift.upsert({
                  where: { attendanceRecordId: record.id },
                  update: {
                    actualStartTime: actualStartTime ?? 0,
                    actualEndTime: actualEndTime ?? 0,
                    isMatched: isActualShiftMatched(
                      actualStartTime ?? 0,
                      actualEndTime ?? 0,
                      shift.shift,
                    ),
                  },
                  create: {
                    employeeId: shift.employeeId,
                    attendanceRecordId: record.id,
                    date: shift.assignedDate,
                    actualStartTime: actualStartTime ?? 0,
                    actualEndTime: actualEndTime ?? 0,
                    isMatched: isActualShiftMatched(
                      actualStartTime ?? 0,
                      actualEndTime ?? 0,
                      shift.shift,
                    ),
                  },
                })
              }
            }
          }

          // 3. Update application status
          return await tx.application.update({
            where: { id },
            data: {
              status: ApplicationStatus.approved,
              approvedById: approvedBy,
              approvedAt: new Date(),
              rejectReason: null,
            },
            include: APPLICATION_INCLUDE,
          })
        },
        { timeout: 15000, maxWait: 15000 },
      )
    } catch (err) {
      console.error("[ApplicationRepository.approve] Failed:", err)
      return null
    }
  }

  /**
   * Rejects a pending application, recording the processor and the rejection reason.
   *
   * @param id - The application ID.
   * @param rejectedBy - The ID of the processor rejecting the application.
   * @param rejectReason - The explanation for rejection.
   * @returns A promise that resolves to the updated application, or null if update failed.
   */
  async reject(
    id: string,
    rejectedBy: string,
    rejectReason: string,
  ): Promise<IApplicationEntity | null> {
    try {
      return await this.prisma.application.update({
        where: { id, status: ApplicationStatus.pending },
        data: {
          status: ApplicationStatus.rejected,
          approvedById: rejectedBy,
          approvedAt: new Date(),
          rejectReason,
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  /**
   * Partner (swap target) confirms the shift swap request.
   * Transitions status from partner_pending → pending so the manager can approve.
   */
  async partnerConfirm(id: string, partnerId: string): Promise<IApplicationEntity | null> {
    try {
      return await this.prisma.application.update({
        where: { id, status: ApplicationStatus.partner_pending },
        data: {
          status: ApplicationStatus.pending,
          partnerApprovedById: partnerId,
          partnerApprovedAt: new Date(),
          partnerRejectReason: null,
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  /**
   * Partner (swap target) rejects the shift swap request.
   * Transitions status from partner_pending → rejected.
   */
  async partnerReject(
    id: string,
    partnerId: string,
    rejectReason: string,
  ): Promise<IApplicationEntity | null> {
    try {
      return await this.prisma.application.update({
        where: { id, status: ApplicationStatus.partner_pending },
        data: {
          status: ApplicationStatus.rejected,
          partnerApprovedById: partnerId,
          partnerApprovedAt: new Date(),
          partnerRejectReason: rejectReason,
        },
        include: APPLICATION_INCLUDE,
      })
    } catch {
      return null
    }
  }

  /**
   * Checks if an employee has any pending or approved leave applications overlapping with the specified range.
   *
   * @param employeeId - The employee's ID.
   * @param startDate - The starting date of the range.
   * @param endDate - The ending date of the range.
   * @param excludeId - Optional application ID to exclude from comparison.
   * @returns A promise that resolves to true if an overlap exists, false otherwise.
   */
  async checkLeaveOverlap(
    employeeId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.application.findFirst({
      where: {
        employeeId,
        type: ApplicationType.leave,
        status: { in: [ApplicationStatus.pending, ApplicationStatus.approved] },
        // Overlap: existing.startDate <= endDate AND existing.endDate >= startDate
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
    return existing !== null
  }

  /** Batch-checks which employees have pending or approved leave overlapping [startDate, endDate]. */
  async findLeaveOverlappingEmployees(
    employeeIds: string[],
    startDate: string | Date,
    endDate: string | Date,
  ): Promise<Set<string>> {
    if (employeeIds.length === 0) return new Set()

    const overlapping = await this.prisma.application.findMany({
      where: {
        employeeId: { in: employeeIds },
        type: ApplicationType.leave,
        status: { in: [ApplicationStatus.pending, ApplicationStatus.approved] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
      distinct: ["employeeId"],
      select: { employeeId: true },
    })

    return new Set(overlapping.map((row) => row.employeeId))
  }

  /**
   * Calculates the total number of approved leave days used by an employee for a specific leave type in a given year.
   *
   * @param employeeId - The employee's ID.
   * @param leaveType - The type of leave.
   * @param year - The calendar year.
   * @returns A promise that resolves to the number of used leave days.
   */
  async getUsedLeaveDays(employeeId: string, leaveType: ILeaveType, year: number): Promise<number> {
    // Only count if it's a paid leave type that has a quota
    if (!PAID_LEAVE_TYPES.includes(leaveType)) return 0

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    // Query ApplicationLeaveDetail directly — cleaner than include + type-cast
    const leaveDetails = await this.prisma.applicationLeaveDetail.findMany({
      where: {
        leaveType: leaveType as unknown as LeaveType,
        application: {
          employeeId,
          status: ApplicationStatus.approved,
          startDate: { gte: yearStart },
          endDate: { lte: yearEnd },
        },
      },
      include: { application: { select: { startDate: true, endDate: true } } },
    })

    // Sum calendar days (simplified; can integrate holiday calendar for working-day count)
    return leaveDetails.reduce((total, detail) => {
      const { startDate, endDate } = detail.application
      const diffMs = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
      return total + diffDays
    }, 0)
  }

  /**
   * Constructs the nested detail creation payload for Prisma based on the application type.
   *
   * @param data - The application submission DTO.
   * @returns The Prisma nested write object for details.
   */
  private _buildDetailCreate(data: ISubmitApplicationDTO): Record<string, unknown> {
    switch (data.type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        return {
          leaveDetail: {
            create: {
              leaveType: data.detail.leaveType,
              regimeType: data.detail.regimeType,
              documentUrl: data.detail.documentUrl ?? null,
            },
          },
        }

      case APPLICATION_TYPES.OVERTIME.LABEL:
        return {
          overtimeDetail: {
            create: { employeeShiftId: data.detail.employeeShiftId },
          },
        }

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        return {
          workFromHomeDetail: {
            create: { employeeShiftId: data.detail.employeeShiftId },
          },
        }

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        return {
          shiftSwapDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              workingShiftId: data.detail.workingShiftId ?? null,
              swapWithEmployeeId: data.detail.swapWithEmployeeId ?? null,
              swapWithShiftId: data.detail.swapWithShiftId ?? null,
            },
          },
        }

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        return {
          lateEarlyDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              durationMinutes: data.detail.durationMinutes,
              isLate: data.detail.isLate,
            },
          },
        }

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        return {}

      case APPLICATION_TYPES.FORGOT_CARD.LABEL:
        return {
          forgotCardDetail: {
            create: {
              employeeShiftId: data.detail.employeeShiftId,
              checkInAt: data.detail.checkInAt ? new Date(data.detail.checkInAt) : null,
              checkOutAt: data.detail.checkOutAt ? new Date(data.detail.checkOutAt) : null,
              documentUrl: data.detail.documentUrl ?? null,
            },
          },
        }

      case APPLICATION_TYPES.REGIME.LABEL:
        return {
          regimeDetail: {
            create: {
              regimeCategoryId: data.detail.regimeCategoryId,
              lateMinutes: data.detail.lateMinutes ?? 0,
              earlyMinutes: data.detail.earlyMinutes ?? 0,
              documentUrl: data.detail.documentUrl ?? null,
            },
          },
        }

      case APPLICATION_TYPES.RECRUITMENT.LABEL:
        return {
          recruitmentDetail: {
            create: {
              positionId: data.detail.positionId ?? null,
              positionName: data.detail.positionName,
              quantity: data.detail.quantity ?? 1,
              requirements: data.detail.requirements ?? null,
            },
          },
        }

      default:
        return {}
    }
  }

  /**
   * Constructs the Prisma database filter conditions from query parameters.
   *
   * @param query - The filter parameters.
   * @returns The Prisma filter object.
   */
  private _buildWhere(
    query: IListApplicationsQueryDTO & { employeeId?: string; keyword?: string },
  ) {
    const where: Record<string, unknown> = {}

    if (query.employeeId) where.employeeId = query.employeeId
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.startDate || query.endDate) {
      const startDateFilter: Record<string, Date> = {}
      if (query.startDate) startDateFilter.gte = new Date(query.startDate)
      if (query.endDate) startDateFilter.lte = new Date(query.endDate)
      where.startDate = startDateFilter
    }

    if (query.keyword) {
      const kw = query.keyword
      where.OR = [
        { id: { contains: kw, mode: "insensitive" } },
        { employee: { fullName: { contains: kw, mode: "insensitive" } } },
        { employee: { id: { contains: kw, mode: "insensitive" } } },
        { approvedBy: { fullName: { contains: kw, mode: "insensitive" } } },
      ]
    }

    return where
  }

  /**
   * Executes the page and count queries concurrently without holding a read-only transaction open.
   *
   * @param where - The Prisma filter conditions.
   * @param query - Pagination parameters.
   * @returns A promise that resolves to the matching records and total count.
   */
  private async _paginate(
    where: Record<string, unknown>,
    statsWhere: Record<string, unknown>,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [data, total, groupedStatuses] = await Promise.all([
      this.prisma.application.findMany({
        where,
        select: APPLICATION_LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
      this.prisma.application.groupBy({
        by: ["status"],
        where: statsWhere,
        _count: { _all: true },
      }),
    ])

    const statusCounts = new Map<ApplicationStatus, number>(
      groupedStatuses.map((row) => [
        row.status,
        typeof row._count._all === "number" ? row._count._all : 0,
      ]),
    )
    const stats = {
      pending:
        (statusCounts.get(ApplicationStatus.pending) ?? 0) +
        (statusCounts.get(ApplicationStatus.partner_pending) ?? 0),
      approved: statusCounts.get(ApplicationStatus.approved) ?? 0,
      rejected: statusCounts.get(ApplicationStatus.rejected) ?? 0,
      cancelled: statusCounts.get(ApplicationStatus.cancelled) ?? 0,
      total: groupedStatuses.reduce(
        (sum, row) => sum + (typeof row._count._all === "number" ? row._count._all : 0),
        0,
      ),
    }

    return { data, total, stats }
  }
}
