import apiClient from "@/lib/api-client"
import type {
  CreateSpentTimeDto,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
} from "@/types/spent-time.types"
import type {
  CreateTaskDto,
  PaginatedTasksDto,
  Task,
  TaskListQuery,
  UpdateTaskDto,
} from "@/types/task.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

/**
 * Data access client for tasks and spent time management.
 */
export const taskApi = {
  /**
   * Retrieves a paginated list of project tasks with optional filter query.
   *
   * @param query - Optional filtering and pagination criteria
   * @returns Paginated tasks result
   */
  list: async (query?: TaskListQuery): Promise<PaginatedTasksDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedTasksDto>>("/tasks", {
      params: query,
    })
    return response.data.data
  },

  /**
   * Retrieves detailed information for a single task by ID.
   *
   * @param id - Task unique identifier
   * @returns Detailed task entity
   */
  getOne: async (id: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`)
    return response.data.data
  },

  /**
   * Creates a new task in a project.
   *
   * @param data - Task creation payload
   * @returns Newly created task entity
   */
  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>("/tasks", data)
    return response.data.data
  },

  /**
   * Updates an existing task's fields, status, or assignment.
   *
   * @param id - Task unique identifier
   * @param data - Task update payload
   * @returns Updated task entity
   */
  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data)
    return response.data.data
  },

  /**
   * Soft deletes a task by ID.
   *
   * @param id - Task unique identifier
   * @returns Resolves when task is deleted
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/tasks/${id}`)
  },

  /**
   * Lists spent time logs for approval or time tracking auditing.
   *
   * @param query - Optional project, status, or date query parameters
   * @returns Array of spent time records
   */
  listSpentTimes: async (query?: SpentTimeQuery): Promise<SpentTime[]> => {
    const response = await apiClient.get<ApiResponse<SpentTime[]>>("/spent-times", {
      params: query,
    })
    return response.data.data
  },

  /**
   * Logs spent time on a task.
   *
   * @param data - Spent time creation parameters
   * @returns Newly created spent time log
   */
  logSpentTime: async (data: CreateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>("/spent-times", data)
    return response.data.data
  },

  /**
   * Updates an existing pending spent time log.
   *
   * @param id - Spent time unique identifier
   * @param data - Update payload
   * @returns Updated spent time record
   */
  updateSpentTime: async (id: string, data: UpdateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.patch<ApiResponse<SpentTime>>(`/spent-times/${id}`, data)
    return response.data.data
  },

  /**
   * Deletes a pending spent time record.
   *
   * @param id - Spent time unique identifier
   * @returns Resolves when record is deleted
   */
  deleteSpentTime: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/spent-times/${id}`)
  },

  /**
   * Approves a pending spent time log for payroll inclusion.
   *
   * @param id - Spent time unique identifier
   * @returns Approved spent time record
   */
  approveSpentTime: async (id: string): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>(`/spent-times/${id}/approve`)
    return response.data.data
  },

  /**
   * Rejects a pending spent time log with reason.
   *
   * @param id - Spent time unique identifier
   * @param reason - Rejection reason explanation
   * @returns Rejected spent time record
   */
  rejectSpentTime: async (id: string, reason: string): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>(`/spent-times/${id}/reject`, {
      reason,
    })
    return response.data.data
  },
}
