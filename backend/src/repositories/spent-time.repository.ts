import {
  CreateSpentTimeDto,
  ISpentTimeRepository,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
  SpentTimeActivity,
  SpentTimeWorkTimeType,
  SpentTimeStatus,
  ApprovedSpentTimePayrollRow,
} from "@/types"
import {
  Employee as PrismaEmployee,
  Prisma,
  PrismaClient,
  SpentTime as PrismaSpentTime,
  Task as PrismaTask,
} from "@prisma/client"
import {
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
} from "@/configs/entities/project.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"
import { BaseRepository } from "./base.repository.ts"

type PrismaSpentTimeWithRelations = PrismaSpentTime & {
  task?: (PrismaTask & {
    project?: {
      id: string
      name: string
    } | null
  }) | null
  employee?: Pick<PrismaEmployee, "id" | "fullName" | "email"> | null
  approvedBy?: Pick<PrismaEmployee, "id" | "fullName"> | null
}

/** Persists PT Spent Time rows — create starts pending; approve/reject feed payroll queries. */
export class PrismaSpentTimeRepository extends BaseRepository implements ISpentTimeRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Maps Prisma row + relations to domain — includes task/project for approval UI and estimate cap. */
  protected mapToDomain(spentTime: PrismaSpentTimeWithRelations): SpentTime {
    return {
      id: spentTime.id,
      taskId: spentTime.taskId,
      employeeId: spentTime.employeeId,
      date: spentTime.date,
      hours: spentTime.hours,
      comment: spentTime.comment,
      activity: spentTime.activity as SpentTimeActivity,
      workTimeType: spentTime.workTimeType as SpentTimeWorkTimeType,
      status: spentTime.status as SpentTimeStatus,
      approvedById: spentTime.approvedById,
      approvedAt: spentTime.approvedAt,
      rejectionReason: spentTime.rejectionReason,
      createdAt: spentTime.createdAt,
      updatedAt: spentTime.updatedAt,
      task: spentTime.task
        ? {
            id: spentTime.task.id,
            title: spentTime.task.title,
            projectId: spentTime.task.projectId,
            estimatedTime: spentTime.task.estimatedTime,
            project: spentTime.task.project
              ? {
                  id: spentTime.task.project.id,
                  name: spentTime.task.project.name,
                }
              : undefined,
          }
        : undefined,
      employee: spentTime.employee
        ? {
            id: spentTime.employee.id,
            fullName: spentTime.employee.fullName,
            email: spentTime.employee.email,
          }
        : undefined,
      approvedBy: spentTime.approvedBy
        ? {
            id: spentTime.approvedBy.id,
            fullName: spentTime.approvedBy.fullName,
          }
        : null,
    }
  }

  /** Prisma include graph for list/detail — task, employee, approver for PT approval screens. */
  private spentTimeInclude = {
    task: {
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    employee: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        fullName: true,
      },
    },
  } as const

  /** Loads one Spent Time log by id with task/employee/approver relations. */
  async findById(id: string): Promise<SpentTime | null> {
    const record = await this.prisma.spentTime.findUnique({
      where: { id },
      include: this.spentTimeInclude,
    })
    return record ? this.mapToDomain(record) : null
  }

  /** Lists Spent Time logs by filters — projectId/status power the lead approval queue. */
  async list(query: SpentTimeQuery): Promise<SpentTime[]> {
    const where: Prisma.SpentTimeWhereInput = {}

    if (query.taskId) where.taskId = query.taskId
    if (query.employeeId) where.employeeId = query.employeeId
    if (query.status) where.status = query.status

    if (query.projectId) {
      where.task = { projectId: query.projectId }
    }

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) where.date.gte = new Date(query.startDate)
      if (query.endDate) where.date.lte = new Date(query.endDate)
    }

    const records = await this.prisma.spentTime.findMany({
      where,
      include: this.spentTimeInclude,
      orderBy: { date: SORT_ORDER.DESC },
    })

    return records.map((record) => this.mapToDomain(record))
  }

  /** Creates a PT spent time log — always persisted as pending until lead approves for payroll. */
  async create(data: CreateSpentTimeDto): Promise<SpentTime> {
    if (!data.employeeId) {
      throw new Error("Employee ID is required to create a spent time log")
    }

    const record = await this.prisma.spentTime.create({
      data: {
        taskId: data.taskId,
        employeeId: data.employeeId,
        date: typeof data.date === "string" ? new Date(data.date) : data.date,
        hours: data.hours,
        comment: data.comment,
        activity: data.activity,
        workTimeType: data.workTimeType || SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
        // Every new log awaits lead approval before it counts toward payroll.
        status: SPENT_TIME_STATUS.PENDING,
      },
      include: this.spentTimeInclude,
    })
    return this.mapToDomain(record)
  }

  /** Updates log fields only — status changes go through approve/reject methods. */
  async update(id: string, data: UpdateSpentTimeDto): Promise<SpentTime | null> {
    const updateData: Prisma.SpentTimeUpdateInput = {}
    if (data.date) updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date
    if (data.hours !== undefined) updateData.hours = data.hours
    if (data.comment !== undefined) updateData.comment = data.comment
    if (data.activity) updateData.activity = data.activity
    if (data.workTimeType) updateData.workTimeType = data.workTimeType

    const record = await this.prisma.spentTime.update({
      where: { id },
      data: updateData,
      include: this.spentTimeInclude,
    })
    return this.mapToDomain(record)
  }

  /** Hard-deletes a row — service restricts delete to pending logs only. */
  async delete(id: string): Promise<boolean> {
    await this.prisma.spentTime.delete({ where: { id } })
    return true
  }

  /** Sums task hours for estimate cap — rejected logs are excluded from the total. */
  async sumTaskHours(taskId: string, excludeId?: string): Promise<number> {
    const result = await this.prisma.spentTime.aggregate({
      where: {
        taskId,
        // Rejected hours must not count toward estimate cap or spent totals.
        status: { not: SPENT_TIME_STATUS.REJECTED },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      _sum: { hours: true },
    })
    return result._sum.hours ?? 0
  }

  /** Sums non-rejected hours across multiple tasks in a single groupBy query. */
  async sumHoursByTaskIds(taskIds: string[]): Promise<Map<string, number>> {
    const totals = new Map<string, number>()
    if (taskIds.length === 0) return totals

    const grouped = await this.prisma.spentTime.groupBy({
      by: ["taskId"],
      where: {
        taskId: { in: taskIds },
        status: { not: SPENT_TIME_STATUS.REJECTED },
      },
      _sum: { hours: true },
    })

    for (const row of grouped) {
      totals.set(row.taskId, row._sum.hours ?? 0)
    }
    return totals
  }

  /** Marks log approved — only approved rows are queried by listApprovedForPayroll. */
  async approve(id: string, approverId: string): Promise<SpentTime | null> {
    const record = await this.prisma.spentTime.update({
      where: { id },
      data: {
        status: SPENT_TIME_STATUS.APPROVED,
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      include: this.spentTimeInclude,
    })
    return this.mapToDomain(record)
  }

  /** Rejected logs stay visible for audit but are excluded from payroll and sumTaskHours. */
  async reject(id: string, approverId: string, reason: string): Promise<SpentTime | null> {
    const record = await this.prisma.spentTime.update({
      where: { id },
      data: {
        status: SPENT_TIME_STATUS.REJECTED,
        approvedById: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      include: this.spentTimeInclude,
    })
    return this.mapToDomain(record)
  }

  /** Approved PT hours in pay period — joined with project member hourlyRate. */
  async listApprovedForPayroll(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ApprovedSpentTimePayrollRow[]> {
    // Joins task → project → member hourlyRate for PT payslip lines.
    const records = await this.prisma.spentTime.findMany({
      where: {
        employeeId,
        status: SPENT_TIME_STATUS.APPROVED,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        task: {
          select: {
            projectId: true,
            project: {
              select: {
                members: {
                  where: { employeeId, removedAt: null },
                  select: { hourlyRate: true },
                },
              },
            },
          },
        },
      },
    })

    return records.flatMap((record) => {
      const member = record.task.project.members[0]
      // No hourlyRate on membership → skip line; PayrollService cannot compute PT pay.
      if (!member?.hourlyRate) return []

      return [
        {
          id: record.id,
          employeeId: record.employeeId,
          projectId: record.task.projectId,
          hours: record.hours,
          workTimeType: record.workTimeType as SpentTimeWorkTimeType,
          hourlyRate: Number(member.hourlyRate),
        },
      ]
    })
  }

  /** Batch-loads approved PT spent time rows grouped by employeeId. */
  async listApprovedForPayrollByEmployees(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, ApprovedSpentTimePayrollRow[]>> {
    const grouped = new Map<string, ApprovedSpentTimePayrollRow[]>()
    if (employeeIds.length === 0) return grouped

    const records = await this.prisma.spentTime.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: SPENT_TIME_STATUS.APPROVED,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        task: {
          select: {
            projectId: true,
            project: {
              select: {
                members: {
                  where: { employeeId: { in: employeeIds }, removedAt: null },
                  select: { employeeId: true, hourlyRate: true },
                },
              },
            },
          },
        },
      },
    })

    for (const record of records) {
      const member = record.task.project.members.find((m) => m.employeeId === record.employeeId)
      if (!member?.hourlyRate) continue

      const bucket = grouped.get(record.employeeId) ?? []
      bucket.push({
        id: record.id,
        employeeId: record.employeeId,
        projectId: record.task.projectId,
        hours: record.hours,
        workTimeType: record.workTimeType as SpentTimeWorkTimeType,
        hourlyRate: Number(member.hourlyRate),
      })
      grouped.set(record.employeeId, bucket)
    }

    return grouped
  }
}
