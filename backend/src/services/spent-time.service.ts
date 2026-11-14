import { PROJECT_MEMBER_WORK_MODE, SPENT_TIME_STATUS } from "@/configs/entities/project.config.ts"
import { SPENT_TIME_RULES } from "@/configs/rules/project.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import {
  CreateSpentTimeDto,
  IProjectRepository,
  ISpentTimeRepository,
  ISpentTimeService,
  ITaskRepository,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
} from "@/types"
import { IAttendanceRepository } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

const LAYER_NAME = "SpentTimeService"

/**
 * Handles spent-time logging, approval flow, and project-specific PT validation rules.
 * Pending logs may be edited by owners; approval actions are restricted to project leads/admins.
 */
export class SpentTimeService implements ISpentTimeService {
  constructor(
    private repository: ISpentTimeRepository,
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private attendanceRepository: IAttendanceRepository,
  ) {}

  /**
   * Resolves whether the caller can bypass spent-time ownership checks.
   */
  private async isAuthorizedAdminOrGM(userId: string): Promise<boolean> {
    const authContext = await authorizationService.getAuthorizationContext(userId)
    return authContext.permissions.has("project.update")
  }

  /**
   * Ensures the caller is allowed to approve or reject logs for the target project.
   */
  private async assertProjectLeadAccess(projectId: string, userId: string): Promise<void> {
    if (await this.isAuthorizedAdminOrGM(userId)) return

    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    if (project.teamLeaderId !== userId) {
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }
  }

  /**
   * Applies business rules before a log is created or updated.
   * This includes estimate caps and onsite attendance prerequisites.
   */
  private async validateBusinessRules(
    taskId: string,
    employeeId: string,
    hours: number,
    date: Date | string,
    excludeId?: string,
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (SPENT_TIME_RULES.ENFORCE_ESTIMATE_CAP && task.estimatedTime != null) {
      const currentTotal = await this.repository.sumTaskHours(taskId, excludeId)
      if (currentTotal + hours > task.estimatedTime) {
        throw new AppError(
          `Tổng giờ làm (${(currentTotal + hours).toFixed(1)}h) vượt ước tính (${task.estimatedTime}h)`,
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          LAYER_NAME,
        )
      }
    }

    const member = await this.projectRepository.getMember(task.projectId, employeeId)
    if (member?.workMode === PROJECT_MEMBER_WORK_MODE.ONSITE) {
      const attendance = await this.attendanceRepository.findByEmployeeAndDate(employeeId, date)
      if (!attendance?.checkInAt) {
        throw new AppError(
          "Nhân viên onsite phải check-in trước khi ghi Spent Time",
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          LAYER_NAME,
        )
      }
    }
  }

  /**
   * Returns a single spent-time record if the caller owns it or can review the parent project.
   */
  async getSpentTime(id: string, userId: string): Promise<SpentTime | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover && record.employeeId !== userId) {
      const task = await this.taskRepository.findById(record.taskId)
      if (task) {
        const project = await this.projectRepository.findById(task.projectId)
        if (project && project.teamLeaderId === userId) {
          return record
        }
      }
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return record
  }

  /**
   * Lists spent-time rows with automatic scoping for non-admin users.
   */
  async listSpentTimes(query: SpentTimeQuery, userId: string): Promise<SpentTime[]> {
    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      if (query.projectId) {
        const project = await this.projectRepository.findById(query.projectId)
        if (!project) {
          throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const isTL = project.teamLeaderId === userId
        const isMember = await this.projectRepository.isMember(query.projectId, userId)
        if (!isTL && !isMember) {
          throw new AppError(
            "Access denied to this project's logs",
            HttpStatusCode.FORBIDDEN,
            LAYER_NAME,
          )
        }
      } else if (query.taskId) {
        const task = await this.taskRepository.findById(query.taskId)
        if (!task) {
          throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const project = await this.projectRepository.findById(task.projectId)
        if (!project) {
          throw new AppError("Associated project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
        }
        const isTL = project.teamLeaderId === userId
        const isMember = await this.projectRepository.isMember(task.projectId, userId)
        if (!isTL && !isMember) {
          throw new AppError(
            "Access denied to this task's logs",
            HttpStatusCode.FORBIDDEN,
            LAYER_NAME,
          )
        }
      } else {
        query.employeeId = userId
      }
    }

    return this.repository.list(query)
  }

  /**
   * Creates a new spent-time log after membership and business-rule validation.
   */
  async createSpentTime(data: CreateSpentTimeDto, userId: string): Promise<SpentTime> {
    const task = await this.taskRepository.findById(data.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      data.employeeId = userId

      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
      }
      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)
      if (!isTL && !isMember) {
        throw new AppError(
          "Access denied to log time for this project",
          HttpStatusCode.FORBIDDEN,
          LAYER_NAME,
        )
      }
    } else if (!data.employeeId) {
      data.employeeId = userId
    }

    const employeeId = data.employeeId ?? userId
    await this.validateBusinessRules(data.taskId, employeeId, data.hours, data.date)

    return this.repository.create(data)
  }

  /**
   * Updates a pending log owned by the caller or an elevated reviewer.
   */
  async updateSpentTime(
    id: string,
    data: UpdateSpentTimeDto,
    userId: string,
  ): Promise<SpentTime | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Chỉ có thể sửa log đang chờ duyệt", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover && record.employeeId !== userId) {
      throw new AppError("Access denied to update this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    const nextHours = data.hours ?? record.hours
    const nextDate = data.date ?? record.date
    await this.validateBusinessRules(record.taskId, record.employeeId, nextHours, nextDate, id)

    return this.repository.update(id, data)
  }

  /**
   * Deletes a pending spent-time log after access checks succeed.
   */
  async deleteSpentTime(id: string, userId: string): Promise<boolean> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Chỉ có thể xóa log đang chờ duyệt", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover && record.employeeId !== userId) {
      throw new AppError("Access denied to delete this log", HttpStatusCode.FORBIDDEN, LAYER_NAME)
    }

    return this.repository.delete(id)
  }

  /**
   * Approves one pending log and makes it eligible for downstream payroll calculations.
   */
  async approveSpentTime(id: string, userId: string): Promise<SpentTime> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const task = await this.taskRepository.findById(record.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    await this.assertProjectLeadAccess(task.projectId, userId)

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const updated = await this.repository.approve(id, userId)
    if (!updated) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    return updated
  }

  /**
   * Rejects one pending log with a reason supplied by the reviewer.
   */
  async rejectSpentTime(id: string, reason: string, userId: string): Promise<SpentTime> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const task = await this.taskRepository.findById(record.taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    await this.assertProjectLeadAccess(task.projectId, userId)

    if (record.status !== SPENT_TIME_STATUS.PENDING) {
      throw new AppError("Log đã được xử lý", HttpStatusCode.CONFLICT, LAYER_NAME)
    }

    const updated = await this.repository.reject(id, userId, reason)
    if (!updated) {
      throw new AppError("Spent time record not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }
    return updated
  }
}
