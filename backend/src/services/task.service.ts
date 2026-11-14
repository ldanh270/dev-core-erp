import { TASK_CREATION_POLICY, TASK_STATUS } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import {
  CreateTaskDto,
  IEmployeeRepository,
  IPositionService,
  IProjectRepository,
  IProjectTaskStatusRepository,
  ITaskRepository,
  ITaskService,
  PaginatedTasksDto,
  Task,
  TaskListQuery,
  UpdateTaskDto,
} from "@/types"
import { AppError } from "@/utils/error.util.ts"
import { mapStatusNameToEnum } from "@/utils/status-mapping.util.ts"

const LAYER_NAME = "TaskService"

/**
 * Handles task access control, validation, and status transitions within a project.
 */
export class TaskService implements ITaskService {
  constructor(
    private repository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private statusRepository?: IProjectTaskStatusRepository,
    private positionService?: IPositionService,
  ) {}

  /**
   * Performs operations for isAuthorizedAdminOrGM.
   */
  private async isAuthorizedAdminOrGM(userId: string): Promise<boolean> {
    const authContext = await authorizationService.getAuthorizationContext(userId)
    return authContext.permissions.has("project.update")
  }

  /**
   * Returns one task after verifying the caller can access the parent project.
   * @param id The task ID
   * @param userId The authenticated user ID
   */
  async getTask(id: string, userId: string): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      const project = await this.projectRepository.findById(task.projectId)
      if (!project) {
        throw new AppError(
          "Associated project not found",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(task.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError(
          "Access denied to this project's tasks",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }
    }

    return task
  }

  /**
   * Lists tasks with project-level access checks for non-admin users.
   * @param query Task filters and pagination options
   * @param userId The authenticated user ID
   */
  async listTasks(query: TaskListQuery, userId: string): Promise<PaginatedTasksDto> {
    const isGlobalApprover = await this.isAuthorizedAdminOrGM(userId)
    if (!isGlobalApprover) {
      if (!query.projectId) {
        throw new AppError(
          "Project ID is required to view tasks",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }

      const project = await this.projectRepository.findById(query.projectId)
      if (!project) {
        throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }

      const isTL = project.teamLeaderId === userId
      const isMember = await this.projectRepository.isMember(query.projectId, userId)

      if (!isTL && !isMember) {
        throw new AppError(
          "Access denied to this project's tasks",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }
    }

    return this.repository.listTasks(query)
  }

  /**
   * Creates a task after validating project membership, assignee eligibility, and status defaults.
   * @param data The task payload to create
   * @param userId The authenticated user ID
   */
  async createTask(data: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.projectRepository.findById(data.projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId

    if (!isGM && !isTL) {
      const isMember = await this.projectRepository.isMember(data.projectId, userId)
      if (!isMember) {
        throw new AppError(
          "You are not a member of this project",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }

      if (project.taskCreationPolicy === TASK_CREATION_POLICY.LEADER_ONLY) {
        throw new AppError(
          "Only Team Leaders or Managers can create tasks in this project",
          HttpStatusCode.FORBIDDEN,
          ErrorLayer.SERVICE,
        )
      }
    }

    if (this.positionService) {
      await this.positionService.validateTaskCreation(
        data.projectId,
        userId,
        data.tracker || "feature",
      )
    }

    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError(
          "Assignee employee not found",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(
        data.projectId,
        data.assigneeId,
      )
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }
      const childStart = data.startDate ? new Date(data.startDate) : null
      const childDue = data.dueDate ? new Date(data.dueDate) : null
      if (childStart && parent.startDate && childStart < new Date(parent.startDate)) {
        throw new AppError(
          "Child task start date cannot precede parent task start date",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
      if (childDue && parent.dueDate && childDue > new Date(parent.dueDate)) {
        throw new AppError(
          "Child task due date cannot exceed parent task due date",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }

    let statusId = data.statusId
    let statusEnum = data.status

    if (this.statusRepository) {
      if (statusId) {
        const customStatus = await this.statusRepository.findById(statusId)
        if (!customStatus || customStatus.projectId !== data.projectId) {
          throw new AppError(
            "Invalid task status for this project",
            HttpStatusCode.BAD_REQUEST,
            LAYER_NAME,
          )
        }
        statusEnum = mapStatusNameToEnum(customStatus.name, customStatus.isCompleted)
      } else {
        const defaultStatus = await this.statusRepository.findDefaultStatus(data.projectId)
        if (defaultStatus) {
          statusId = defaultStatus.id
          statusEnum = mapStatusNameToEnum(defaultStatus.name, defaultStatus.isCompleted)
        }
      }
    }

    return this.repository.createTask({
      ...data,
      status: statusEnum,
      statusId,
      createdById: userId,
    })
  }

  /**
   * Updates a task after permission checks and transition validation.
   * @param id The task ID
   * @param data The task fields to update
   * @param userId The authenticated user ID
   */
  async updateTask(id: string, data: UpdateTaskDto, userId: string): Promise<Task | null> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError(
        "Associated project not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId
    const isAssignee = task.assigneeId === userId

    if (!isGM && !isTL && !isCreator && !isAssignee) {
      throw new AppError(
        "You do not have permission to update this task",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    const employee = await this.employeeRepository.findById(userId)
    const isTester = employee?.position?.toLowerCase() === "tester"

    if (data.assigneeId) {
      const assignee = await this.employeeRepository.findById(data.assigneeId)
      if (!assignee) {
        throw new AppError(
          "Assignee employee not found",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      }

      const assigneeIsTL = project.teamLeaderId === data.assigneeId
      const assigneeIsMember = await this.projectRepository.isMember(
        task.projectId,
        data.assigneeId,
      )
      if (!assigneeIsTL && !assigneeIsMember) {
        throw new AppError(
          "Assignee must be a member or the leader of this project",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }

    if (data.parentTaskId) {
      const parent = await this.repository.findById(data.parentTaskId)
      if (!parent) {
        throw new AppError("Parent task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
      }
      if (data.parentTaskId === id) {
        throw new AppError(
          "A task cannot be its own parent",
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.SERVICE,
        )
      }
    }

    const effectiveParentId =
      data.parentTaskId !== undefined ? data.parentTaskId : task.parentTaskId
    if (effectiveParentId) {
      const parent = await this.repository.findById(effectiveParentId)
      if (parent) {
        const effStart =
          data.startDate !== undefined
            ? data.startDate
              ? new Date(data.startDate)
              : null
            : task.startDate
              ? new Date(task.startDate)
              : null
        const effDue =
          data.dueDate !== undefined
            ? data.dueDate
              ? new Date(data.dueDate)
              : null
            : task.dueDate
              ? new Date(task.dueDate)
              : null
        if (effStart && parent.startDate && effStart < new Date(parent.startDate)) {
          throw new AppError(
            "Child task start date cannot precede parent task start date",
            HttpStatusCode.BAD_REQUEST,
            ErrorLayer.SERVICE,
          )
        }
        if (effDue && parent.dueDate && effDue > new Date(parent.dueDate)) {
          throw new AppError(
            "Child task due date cannot exceed parent task due date",
            HttpStatusCode.BAD_REQUEST,
            ErrorLayer.SERVICE,
          )
        }
      }
    }

    let statusId = data.statusId
    let statusEnum = data.status

    if (this.statusRepository && statusId !== undefined && statusId !== task.statusId) {
      if (statusId !== null) {
        const customStatus = await this.statusRepository.findById(statusId)
        if (!customStatus || customStatus.projectId !== task.projectId) {
          throw new AppError(
            "Invalid task status for this project",
            HttpStatusCode.BAD_REQUEST,
            LAYER_NAME,
          )
        }
        statusEnum = mapStatusNameToEnum(customStatus.name, customStatus.isCompleted)

        let currentIsCompleted = false
        if (task.statusId) {
          const currentStatus = await this.statusRepository.findById(task.statusId)
          if (currentStatus) {
            currentIsCompleted = currentStatus.isCompleted
          }
        } else {
          currentIsCompleted =
            task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.CANCELLED
        }

        if (customStatus.isCompleted !== currentIsCompleted && !isGM && !isTL && !isTester) {
          const actionText = customStatus.isCompleted ? "hoàn thành" : "mở lại/di chuyển"
          throw new AppError(
            `Chỉ Team Leader, Manager hoặc Tester mới có quyền ${actionText} công việc này.`,
            HttpStatusCode.FORBIDDEN,
            LAYER_NAME,
          )
        }
      }
    }

    if (
      this.statusRepository &&
      statusId === undefined &&
      statusEnum &&
      statusEnum !== task.status
    ) {
      const projectStatuses = await this.statusRepository.listByProjectId(task.projectId)
      const matchingStatus = projectStatuses.find(
        (ps) => mapStatusNameToEnum(ps.name, ps.isCompleted) === statusEnum,
      )
      if (matchingStatus) {
        statusId = matchingStatus.id
      }
    }

    if (statusEnum && statusEnum !== task.status) {
      if (statusEnum === TASK_STATUS.DONE) {
        if (!isGM && !isTL && !isTester) {
          throw new AppError(
            "Chỉ Team Leader, Manager hoặc Tester mới có quyền phê duyệt hoàn thành công việc",
            HttpStatusCode.FORBIDDEN,
            ErrorLayer.SERVICE,
          )
        }
      }
    }

    return this.repository.updateTask(id, {
      ...data,
      status: statusEnum,
      statusId,
    })
  }

  /**
   * Deletes a task when the caller is its creator, project lead, or an elevated manager.
   * @param id The task ID
   * @param userId The authenticated user ID
   */
  async deleteTask(id: string, userId: string): Promise<boolean> {
    const task = await this.repository.findById(id)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const project = await this.projectRepository.findById(task.projectId)
    if (!project) {
      throw new AppError(
        "Associated project not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    const isGM = await this.isAuthorizedAdminOrGM(userId)
    const isTL = project.teamLeaderId === userId
    const isCreator = task.createdById === userId

    if (!isGM && !isTL && !isCreator) {
      throw new AppError(
        "You do not have permission to delete this task",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    return this.repository.deleteTask(id)
  }
}
