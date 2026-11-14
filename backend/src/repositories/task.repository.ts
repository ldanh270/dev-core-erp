import { TASK_STATUS } from "@/configs/entities/project.config.ts"
import {
  CompletedTaskSuggestionRow,
  CreateTaskDto,
  ITaskRepository,
  PaginatedTasksDto,
  Task,
  TaskListQuery,
  TaskPriority,
  TaskStatus,
  TaskTracker,
  UpdateTaskDto,
} from "@/types"

import {
  Prisma,
  PrismaClient,
  Task as PrismaTask,
  TaskPriority as PrismaTaskPriority,
  TaskStatus as PrismaTaskStatus,
} from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

const TASK_PROJECT_SELECT = {
  id: true,
  name: true,
  taskCreationPolicy: true,
  teamLeaderId: true,
} as const

const TASK_EMPLOYEE_SELECT = {
  id: true,
  fullName: true,
  email: true,
} as const

const TASK_DEFAULT_INCLUDE = {
  project: { select: TASK_PROJECT_SELECT },
  assignee: { select: TASK_EMPLOYEE_SELECT },
  createdBy: { select: TASK_EMPLOYEE_SELECT },
} as const

type TaskEmployeeSummary = {
  id: string
  fullName: string
  email: string
}

type PrismaTaskWithRelations = PrismaTask & {
  project?: {
    id: string
    name: string
    taskCreationPolicy: string
    teamLeaderId: string | null
  } | null
  assignee?: TaskEmployeeSummary | null
  createdBy?: TaskEmployeeSummary | null
}

export class PrismaTaskRepository extends BaseRepository implements ITaskRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Maps Prisma task data to domain model
   * Transforms database representation to business logic representation
   */
  protected mapToDomain(task: PrismaTaskWithRelations): Task {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      tracker: task.tracker as TaskTracker,
      priority: task.priority as TaskPriority,
      status: task.status as TaskStatus,
      statusId: task.statusId,
      assigneeId: task.assigneeId,
      createdById: task.createdById,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      estimatedTime: task.estimatedTime,
      progress: task.progress,
      resultUrl: task.resultUrl,
      resultNotes: task.resultNotes,
      rejectionReason: task.rejectionReason,
      parentTaskId: task.parentTaskId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
            taskCreationPolicy: task.project.taskCreationPolicy,
            teamLeaderId: task.project.teamLeaderId,
          }
        : undefined,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            fullName: task.assignee.fullName,
            email: task.assignee.email,
          }
        : null,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            fullName: task.createdBy.fullName,
            email: task.createdBy.email,
          }
        : undefined,
    }
  }

  /**
   * Finds a task by its unique ID
   * Includes related project and employee information
   * Returns null if task does not exist
   */
  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_DEFAULT_INCLUDE,
    })
    return task ? this.mapToDomain(task as PrismaTaskWithRelations) : null
  }

  /**
   * Lists tasks with pagination and filtering
   * Supports filtering by project, status, priority, assignee
   * Supports search by title and description
   * Supports sorting and pagination
   */
  async listTasks(query: TaskListQuery): Promise<PaginatedTasksDto> {
    const {
      projectId,
      page = 1,
      limit = 10,
      search,
      tracker,
      status,
      statusId,
      priority,
      assigneeId,
      createdById,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query

    const skip = (page - 1) * limit
    const where: Prisma.TaskWhereInput = {}

    if (projectId) {
      where.projectId = projectId
    }
    if (tracker) {
      where.tracker = tracker
    }
    if (status) {
      where.status = status as PrismaTaskStatus
    }
    if (statusId) {
      if (statusId === "open") {
        where.OR = [
          {
            customStatus: {
              isCompleted: false,
            },
          },
          {
            statusId: null,
            status: {
              in: [
                TASK_STATUS.TODO,
                TASK_STATUS.IN_PROGRESS,
                TASK_STATUS.IN_REVIEW,
                TASK_STATUS.REOPENED,
              ],
            },
          },
        ]
      } else {
        where.statusId = statusId
      }
    }
    if (priority) {
      where.priority = priority as PrismaTaskPriority
    }
    if (assigneeId) {
      where.assigneeId = assigneeId
    }
    if (createdById) {
      where.createdById = createdById
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: TASK_DEFAULT_INCLUDE,
      }),
    ])

    return {
      data: tasks.map((t) => this.mapToDomain(t as PrismaTaskWithRelations)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Creates a new task in the database
   * Sets initial status and dueDate based on provided data
   */
  async createTask(data: CreateTaskDto & { createdById: string }): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        tracker: data.tracker,
        priority: data.priority as PrismaTaskPriority,
        status: data.status as PrismaTaskStatus,
        statusId: data.statusId,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedTime: data.estimatedTime,
        progress: data.progress || 0,
        parentTaskId: data.parentTaskId,
      },
      include: TASK_DEFAULT_INCLUDE,
    })
    return this.mapToDomain(task as PrismaTaskWithRelations)
  }

  /**
   * Updates an existing task
   * Automatically sets completedAt when status changes to 'done'
   * Handles null values to allow clearing optional fields
   * Returns updated task or null if not found
   */
  async updateTask(id: string, data: UpdateTaskDto): Promise<Task | null> {
    const updateData: Prisma.TaskUncheckedUpdateInput = {
      title: data.title,
      description: data.description,
      tracker: data.tracker,
      priority: data.priority as PrismaTaskPriority,
      status: data.status as PrismaTaskStatus,
      statusId: data.statusId,
      assigneeId: data.assigneeId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      estimatedTime: data.estimatedTime,
      progress: data.progress,
      resultUrl: data.resultUrl,
      resultNotes: data.resultNotes,
      rejectionReason: data.rejectionReason,
      parentTaskId: data.parentTaskId,
    }

    if (data.startDate === null) updateData.startDate = null
    if (data.dueDate === null) updateData.dueDate = null
    if (data.assigneeId === null) updateData.assigneeId = null
    if (data.statusId === null) updateData.statusId = null
    if (data.completedAt === null) updateData.completedAt = null
    if (data.estimatedTime === null) updateData.estimatedTime = null
    if (data.resultUrl === null) updateData.resultUrl = null
    if (data.resultNotes === null) updateData.resultNotes = null
    if (data.rejectionReason === null) updateData.rejectionReason = null
    if (data.parentTaskId === null) updateData.parentTaskId = null

    // Automatically set completedAt when switching status to Done, or clear it when moving away from Done
    if (data.status === TASK_STATUS.DONE && !data.completedAt) {
      updateData.completedAt = new Date()
    } else if (data.status && data.status !== TASK_STATUS.DONE) {
      updateData.completedAt = null
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: TASK_DEFAULT_INCLUDE,
    })
    return this.mapToDomain(task as PrismaTaskWithRelations)
  }

  /**
   * Permanently deletes a task from the database
   * Returns true if successful
   */
  async deleteTask(id: string): Promise<boolean> {
    await this.prisma.task.delete({
      where: { id },
    })
    return true
  }

  /**
   * Reassigns all tasks under a project from one custom status ID to another (or null).
   * Typically used as a fallback mapping when deleting a status column.
   */
  async updateTasksStatusId(
    projectId: string,
    fromStatusId: string,
    toStatusId: string | null,
  ): Promise<void> {
    await this.prisma.task.updateMany({
      where: { projectId, statusId: fromStatusId },
      data: { statusId: toStatusId },
    })
  }

  /**
   * Synchronizes the legacy string status enum of all tasks mapped to a custom status ID.
   * Ensures compatibility between old enum-based filters and new status columns.
   */
  async syncLegacyStatus(statusId: string, legacyStatus: PrismaTaskStatus): Promise<void> {
    await this.prisma.task.updateMany({
      where: { statusId },
      data: { status: legacyStatus },
    })
  }

  /** Batch-counts in_progress tasks per assignee for AI capacity estimation. */
  async countActiveByAssignees(assigneeIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>()
    if (assigneeIds.length === 0) return counts

    const grouped = await this.prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { in: assigneeIds },
        status: TASK_STATUS.IN_PROGRESS as PrismaTaskStatus,
      },
      _count: { _all: true },
    })

    for (const row of grouped) {
      if (row.assigneeId) {
        counts.set(row.assigneeId, row._count._all)
      }
    }
    return counts
  }

  /** Fetches up to `perAssigneeLimit` most recently completed tasks per assignee in one query. */
  async listRecentCompletedByAssignees(
    assigneeIds: string[],
    perAssigneeLimit = 20,
  ): Promise<Map<string, CompletedTaskSuggestionRow[]>> {
    const grouped = new Map<string, CompletedTaskSuggestionRow[]>()
    if (assigneeIds.length === 0) return grouped

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; title: string; estimatedTime: number | null; assigneeId: string }>
    >`
      SELECT id, title, "estimatedTime", "assigneeId"
      FROM (
        SELECT
          id,
          title,
          "estimatedTime",
          "assigneeId",
          ROW_NUMBER() OVER (
            PARTITION BY "assigneeId"
            ORDER BY "completedAt" DESC NULLS LAST, "updatedAt" DESC
          ) AS rn
        FROM "Task"
        WHERE "assigneeId" = ANY(${assigneeIds}::text[])
          AND status = ${TASK_STATUS.DONE}::"TaskStatus"
      ) ranked
      WHERE rn <= ${perAssigneeLimit}
    `

    for (const row of rows) {
      const bucket = grouped.get(row.assigneeId) ?? []
      bucket.push({
        id: row.id,
        title: row.title,
        estimatedTime: row.estimatedTime,
      })
      grouped.set(row.assigneeId, bucket)
    }
    return grouped
  }
}
