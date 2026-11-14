/**
 * Service layer for converting project staffing data into capacity forecast inputs.
 */
import { WORK_SCHEDULE_TYPE } from "@/configs/entities/employee.config.ts"
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CapacityProjectRow,
  ForecastProjectCapacityDto,
  ICapacityCopilotRepository,
} from "@/types/capacity-copilot.types.ts"
import { formatUtcDateKey, parseUtcDateOnly } from "@/utils/date.util.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  CapacityForecastResult,
  CapacityMemberInput,
  buildCapacityForecast,
} from "@/utils/project-capacity-copilot.util.ts"

export class CapacityCopilotService {
  // Runtime cache stores the latest auto-refreshed snapshots from cron/event jobs.
  // It is advisory only; board requests can recompute and overwrite it without changing project data.
  private forecastCache = new Map<string, CapacityBoardProjectSnapshot>()

  constructor(private repository: ICapacityCopilotRepository) {}

  /**
   * Forecasts one project's delivery percentage for a normalized week.
   * The deal target comes from persisted project data; member availability and velocity are
   * converted into pure formula inputs without changing membership or task assignment.
   */
  async forecastProjectCapacity(
    projectId: string,
    input: ForecastProjectCapacityDto,
  ): Promise<CapacityForecastResult> {
    const dealTargetPercent = await this.repository.getProjectDealTargetPercent(projectId)
    if (dealTargetPercent === undefined) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    if (dealTargetPercent == null) {
      throw new AppError(
        "Project chưa có target % trong deal",
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        ErrorLayer.SERVICE,
      )
    }

    const weekStart = this.normalizeWeekStart(input.weekStart)

    const [members, availabilities] = await Promise.all([
      this.repository.listProjectMembers(projectId),
      this.repository.listWeeklyAvailabilities(weekStart),
    ])
    // The target is fixed by the project deal; runtime input only controls the forecast week/window.
    const history = await this.repository.listDeliveryHistory(
      projectId,
      weekStart,
      input.lookbackWeeks ?? CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
    )
    const availabilityByEmployeeId = new Map(
      availabilities.map((availability) => [availability.employeeId, availability]),
    )

    const memberInputs: CapacityMemberInput[] = []
    for (const member of members) {
      const velocity = await this.repository.getEmployeeVelocity(member.employeeId)

      memberInputs.push({
        employeeId: member.employeeId,
        fullName: member.fullName,
        roleCode: member.roleCode,
        roleName: member.roleName,
        availableHours: this.getAvailableHours(
          member.workScheduleType,
          availabilityByEmployeeId.get(member.employeeId),
        ),
        estimatedHours: velocity.estimatedHours,
        spentHours: velocity.spentHours,
        skillMatchFactor: CAPACITY_COPILOT_RULES.DEFAULT_SKILL_MATCH_FACTOR,
      })
    }

    return buildCapacityForecast(memberInputs, dealTargetPercent, history)
  }

  /** Forecasts every eligible project independently so Admin/PM can compare shortages and surplus. */
  async forecastCapacityBoard(
    input: ForecastProjectCapacityDto,
  ): Promise<CapacityBoardForecastResult> {
    const weekStart = this.normalizeWeekStart(input.weekStart)
    const weekStartKey = formatUtcDateKey(weekStart)
    const projects = await this.repository.listProjectsWithDealTarget()
    // Board forecast isolates failures per project so one bad project does not hide other capacity signals.
    const snapshots = await Promise.all(
      projects.map((project) => {
        const forecastInput = {
          weekStart: weekStartKey,
          lookbackWeeks: input.lookbackWeeks,
        }
        return this.safeForecastBoardProject(project, forecastInput)
      }),
    )

    return {
      weekStart: weekStartKey,
      generatedAt: new Date().toISOString(),
      projects: snapshots,
    }
  }

  /**
   * Fire-and-forget event job after an employee submits availability.
   * This makes the copilot proactive without changing Project Task assignment behavior.
   */
  runAvailabilityUpdatedJob(employeeId: string, weekStartValue: string | Date): void {
    const weekStart = this.normalizeWeekStart(
      weekStartValue instanceof Date ? weekStartValue.toISOString() : weekStartValue,
    )

    void this.refreshEmployeeProjectForecasts(employeeId, weekStart).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "unknown error"
      console.error("[CapacityCopilotJob] availability refresh failed:", message)
    })
  }

  private async refreshEmployeeProjectForecasts(
    employeeId: string,
    weekStart: Date,
  ): Promise<void> {
    const projects = await this.repository.listProjectsByEmployeeWithDealTarget(employeeId)
    // Availability changes affect only projects where the employee is an active member.
    await Promise.allSettled(
      projects.map((project) =>
        this.forecastAndCacheProjectCapacity(project, {
          weekStart: formatUtcDateKey(weekStart),
          lookbackWeeks: CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
        }),
      ),
    )
  }

  /** Converts one project failure into an error snapshot instead of failing the entire board. */
  private async safeForecastBoardProject(
    project: CapacityProjectRow,
    input: ForecastProjectCapacityDto,
  ): Promise<CapacityBoardProjectSnapshot> {
    try {
      return await this.forecastAndCacheProjectCapacity(project, input)
    } catch (error: unknown) {
      return {
        projectId: project.id,
        projectName: project.name,
        forecast: null,
        generatedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : "Forecast failed",
      }
    }
  }

  /** Computes and stores the latest advisory snapshot under a week/lookback-specific key. */
  private async forecastAndCacheProjectCapacity(
    project: CapacityProjectRow,
    input: ForecastProjectCapacityDto,
  ): Promise<CapacityBoardProjectSnapshot> {
    const projectId = project.id
    const forecast = await this.forecastProjectCapacity(projectId, input)
    const snapshot: CapacityBoardProjectSnapshot = {
      projectId,
      projectName: project.name,
      forecast,
      generatedAt: new Date().toISOString(),
      errorMessage: null,
    }
    this.forecastCache.set(
      this.buildCacheKey(projectId, input.weekStart, input.lookbackWeeks),
      snapshot,
    )
    return snapshot
  }

  /** Separates snapshots for the same project when week or history window changes. */
  private buildCacheKey(projectId: string, weekStart: string, lookbackWeeks?: number): string {
    const lookback = lookbackWeeks ?? CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS
    return `${projectId}:${formatUtcDateKey(this.normalizeWeekStart(weekStart))}:${lookback}`
  }

  /**
   * Converts work schedule data to raw available hours.
   * Full-time uses the configured standard week; part-time requires submitted availability slots.
   */
  private getAvailableHours(
    workScheduleType: string,
    availability:
      | Awaited<ReturnType<ICapacityCopilotRepository["listWeeklyAvailabilities"]>>[number]
      | undefined,
  ): number {
    // Full-time members contribute standard weekly capacity; part-time members contribute submitted availability.
    if (workScheduleType === WORK_SCHEDULE_TYPE.FULL_TIME) {
      return CAPACITY_COPILOT_RULES.FULL_TIME_WEEKLY_HOURS
    }
    if (!availability) return 0

    return availability.days.reduce((weekTotal, day) => {
      if (day.isBusyAllDay) return weekTotal
      const dayMinutes = day.slots.reduce(
        (sum, slot) => sum + Math.max(0, slot.endTime - slot.startTime),
        0,
      )
      return weekTotal + dayMinutes / CAPACITY_COPILOT_RULES.MINUTES_PER_HOUR
    }, 0)
  }

  /** Uses UTC date-only parsing to prevent browser/server timezone shifts, then anchors to Monday. */
  private normalizeWeekStart(value: string): Date {
    const date = parseUtcDateOnly(value)
    const day = date.getUTCDay()
    const diff = day === 0 ? -CAPACITY_COPILOT_RULES.DAYS_PER_WEEK + 1 : 1 - day
    date.setUTCDate(date.getUTCDate() + diff)
    date.setUTCHours(0, 0, 0, 0)
    return date
  }
}

export interface CapacityBoardProjectSnapshot {
  projectId: string
  projectName: string
  forecast: CapacityForecastResult | null
  generatedAt: string
  errorMessage: string | null
}

export interface CapacityBoardForecastResult {
  weekStart: string
  generatedAt: string
  projects: CapacityBoardProjectSnapshot[]
}
