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

export const taskApi = {
  list: async (query?: TaskListQuery): Promise<PaginatedTasksDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedTasksDto>>("/tasks", {
      params: query,
    })
    return response.data.data
  },

  getOne: async (id: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`)
    return response.data.data
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>("/tasks", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/tasks/${id}`)
  },

  /** Lists Spent Time logs — filter by projectId/status for lead approval queue. */
  listSpentTimes: async (query?: SpentTimeQuery): Promise<SpentTime[]> => {
    const response = await apiClient.get<ApiResponse<SpentTime[]>>("/spent-times", {
      params: query,
    })
    return response.data.data
  },

  /** Creates a pending Spent Time log — PT primary time input (not weekly attendance). */
  logSpentTime: async (data: CreateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>("/spent-times", data)
    return response.data.data
  },

  /** Updates a pending log — approved/rejected rows are locked on the server. */
  updateSpentTime: async (id: string, data: UpdateSpentTimeDto): Promise<SpentTime> => {
    const response = await apiClient.patch<ApiResponse<SpentTime>>(`/spent-times/${id}`, data)
    return response.data.data
  },

  /** Deletes a pending log only — cannot remove payroll-eligible approved rows. */
  deleteSpentTime: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/spent-times/${id}`)
  },

  /** Lead approves hours — included in next PT payroll calculation. */
  approveSpentTime: async (id: string): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>(`/spent-times/${id}/approve`)
    return response.data.data
  },

  /** Lead rejects with reason — hours excluded from payroll and task totals. */
  rejectSpentTime: async (id: string, reason: string): Promise<SpentTime> => {
    const response = await apiClient.post<ApiResponse<SpentTime>>(`/spent-times/${id}/reject`, {
      reason,
    })
    return response.data.data
  },
}
