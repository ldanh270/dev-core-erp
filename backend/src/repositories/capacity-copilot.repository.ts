/**
 * Read-only Prisma adapter for Capacity Copilot inputs.
 * It aggregates Project, Attendance, and Spent Time data without mutating Project Task records.
 */
import { PART_TIME_AVAILABILITY_STATUS } from "@/configs/entities/part-time-availability.config.ts"
import {
  PROJECT_STATUS,
  SPENT_TIME_STATUS,
  TASK_STATUS,
} from "@/configs/entities/project.config.ts"
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"
import {
  CapacityAvailabilityRow,
  CapacityDeliveryHistoryRow,
  CapacityProjectMemberRow,
  CapacityProjectRow,
  CapacityVelocityRow,
  ICapacityCopilotRepository,
} from "@/types/capacity-copilot.types.ts"

import { PrismaClient } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

export class PrismaCapacityCopilotRepository
  extends BaseRepository
  implements ICapacityCopilotRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /** Distinguishes a missing project (`undefined`) from a project without a deal target (`null`). */
  async getProjectDealTargetPercent(projectId: string): Promise<number | null | undefined> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { dealTargetPercent: true },
    })
    return project?.dealTargetPercent
  }

  /** Lists active projects eligible for the scheduled cross-project capacity board. */
  async listProjectsWithDealTarget(): Promise<CapacityProjectRow[]> {
    // Weekly cron/board only forecasts live projects that have a committed deal target.
    const projects = await this.prisma.project.findMany({
      where: {
        dealTargetPercent: { not: null },
        status: { notIn: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED] },
      },
      select: {
        id: true,
        name: true,
        dealTargetPercent: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return projects
      .filter((project): project is CapacityProjectRow => project.dealTargetPercent !== null)
      .map((project) => ({
        id: project.id,
        name: project.name,
        dealTargetPercent: project.dealTargetPercent,
      }))
  }

  /** Limits an availability-triggered refresh to active projects containing that employee. */
  async listProjectsByEmployeeWithDealTarget(employeeId: string): Promise<CapacityProjectRow[]> {
    // Availability update jobs refresh only projects touched by that employee's new free-time slots.
    const members = await this.prisma.projectMember.findMany({
      where: {
        employeeId,
        removedAt: null,
        project: {
          dealTargetPercent: { not: null },
          status: { notIn: [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED] },
        },
      },
      select: {
        project: {
          select: {
            id: true,
            name: true,
            dealTargetPercent: true,
          },
        },
      },
    })

    return members
      .map((member) => member.project)
      .filter((project): project is CapacityProjectRow => project.dealTargetPercent !== null)
      .map((project) => ({
        id: project.id,
        name: project.name,
        dealTargetPercent: project.dealTargetPercent,
      }))
  }

  /** Loads active members and resolves their project role with employee-position fallback. */
  async listProjectMembers(projectId: string): Promise<CapacityProjectMemberRow[]> {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId, removedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            workScheduleType: true,
          },
        },
        role: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    })

    return members.map((member) => ({
      employeeId: member.employeeId,
      fullName: member.employee.fullName,
      workScheduleType: member.employee.workScheduleType,
      roleCode:
        member.role?.code || member.employee.position || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_CODE,
      roleName:
        member.role?.name || member.employee.position || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_NAME,
    }))
  }

  /** Loads submitted/approved free-time slots used to calculate part-time available hours. */
  async listWeeklyAvailabilities(weekStart: Date): Promise<CapacityAvailabilityRow[]> {
    // Submitted rows count as usable forecast input; Admin assignment approval is not required for capacity planning.
    const records = await this.prisma.partTimeWeeklyAvailability.findMany({
      where: {
        weekStart,
        status: {
          in: [PART_TIME_AVAILABILITY_STATUS.SUBMITTED, PART_TIME_AVAILABILITY_STATUS.APPROVED],
        },
      },
      include: {
        days: {
          include: {
            slots: {
              select: {
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    })

    return records.map((record) => ({
      employeeId: record.employeeId,
      status: record.status,
      days: record.days.map((day) => ({
        isBusyAllDay: day.isBusyAllDay,
        slots: day.slots,
      })),
    }))
  }

  /** Aggregates recent completed-task estimates and accepted logged hours for personal velocity. */
  async getEmployeeVelocity(employeeId: string): Promise<CapacityVelocityRow> {
    // Velocity uses completed tasks plus non-rejected spent time; rejected logs are excluded from productivity.
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: employeeId,
        status: TASK_STATUS.DONE,
        estimatedTime: { gt: 0 },
      },
      // Recent completed tasks are enough for stable demo velocity without over-querying old history.
      take: CAPACITY_COPILOT_RULES.VELOCITY_SAMPLE_TASK_LIMIT,
      orderBy: { completedAt: "desc" },
      select: {
        id: true,
        estimatedTime: true,
        spentTimes: {
          where: {
            status: { not: SPENT_TIME_STATUS.REJECTED },
          },
          select: {
            hours: true,
          },
        },
      },
    })

    return tasks.reduce<CapacityVelocityRow>(
      (sum, task) => {
        const spentHours = task.spentTimes.reduce((total, spentTime) => total + spentTime.hours, 0)
        if (!task.estimatedTime || spentHours <= 0) return sum

        return {
          estimatedHours: sum.estimatedHours + task.estimatedTime,
          spentHours: sum.spentHours + spentHours,
        }
      },
      { estimatedHours: 0, spentHours: 0 },
    )
  }

  /**
   * Builds weekly delivery observations before the forecast week.
   * Completion percentage uses completed estimated hours divided by the project's total estimate,
   * while spent hours provide the denominator for historical productivity.
   */
  async listDeliveryHistory(
    projectId: string,
    beforeWeekStart: Date,
    lookbackWeeks: number,
  ): Promise<CapacityDeliveryHistoryRow[]> {
    // Completed estimate / total estimate gives a simple historical delivery percentage.
    // This repository reads history only; it does not modify Project Task assignment or task estimates.
    const totalEstimateResult = await this.prisma.task.aggregate({
      where: {
        projectId,
        estimatedTime: { gt: 0 },
      },
      _sum: { estimatedTime: true },
    })
    const totalEstimatedHours = totalEstimateResult._sum.estimatedTime ?? 0
    if (totalEstimatedHours <= 0) return []

    const weeks = Array.from({ length: lookbackWeeks }, (_, index) => {
      const end = new Date(beforeWeekStart)
      end.setDate(end.getDate() - index * CAPACITY_COPILOT_RULES.DAYS_PER_WEEK)
      const start = new Date(end)
      start.setDate(start.getDate() - CAPACITY_COPILOT_RULES.DAYS_PER_WEEK)
      return { start, end }
    }).reverse()

    const rows: CapacityDeliveryHistoryRow[] = []
    for (const week of weeks) {
      const [spentResult, completedResult] = await Promise.all([
        this.prisma.spentTime.aggregate({
          where: {
            status: { not: SPENT_TIME_STATUS.REJECTED },
            date: { gte: week.start, lt: week.end },
            task: { projectId },
          },
          _sum: { hours: true },
        }),
        this.prisma.task.aggregate({
          where: {
            projectId,
            status: TASK_STATUS.DONE,
            completedAt: { gte: week.start, lt: week.end },
            estimatedTime: { gt: 0 },
          },
          _sum: { estimatedTime: true },
        }),
      ])

      rows.push({
        weekStart: week.start.toISOString().slice(0, 10),
        spentHours: spentResult._sum.hours ?? 0,
        completedPercent: ((completedResult._sum.estimatedTime ?? 0) / totalEstimatedHours) * 100,
      })
    }

    return rows
  }
}
