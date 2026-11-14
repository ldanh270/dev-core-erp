import apiClient from "@/lib/api-client"
import type {
  CreateProjectTaskStatusDto,
  ProjectTaskStatus,
  UpdateProjectTaskStatusDto,
} from "@/types/project-task-status.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

/**
 * Frontend API client wrapper for communicating with project task custom status endpoints.
 */
export const projectTaskStatusApi = {
  /**
   * Fetches the complete list of custom task status columns for a specific project.
   */
  list: async (projectId: string): Promise<ProjectTaskStatus[]> => {
    const response = await apiClient.get<ApiResponse<ProjectTaskStatus[]>>(
      `/projects/${projectId}/statuses`,
    )
    return response.data.data
  },

  /**
   * Fetches detailed information about a single custom status column.
   */
  getOne: async (projectId: string, id: string): Promise<ProjectTaskStatus> => {
    const response = await apiClient.get<ApiResponse<ProjectTaskStatus>>(
      `/projects/${projectId}/statuses/${id}`,
    )
    return response.data.data
  },

  /**
   * Sends a request to create a new custom status column in a project.
   */
  create: async (
    projectId: string,
    data: CreateProjectTaskStatusDto,
  ): Promise<ProjectTaskStatus> => {
    const response = await apiClient.post<ApiResponse<ProjectTaskStatus>>(
      `/projects/${projectId}/statuses`,
      data,
    )
    return response.data.data
  },

  /**
   * Sends a request to update properties of an existing custom status column.
   */
  update: async (
    projectId: string,
    id: string,
    data: UpdateProjectTaskStatusDto,
  ): Promise<ProjectTaskStatus> => {
    const response = await apiClient.patch<ApiResponse<ProjectTaskStatus>>(
      `/projects/${projectId}/statuses/${id}`,
      data,
    )
    return response.data.data
  },

  /**
   * Sends a request to delete a custom status column, optionally migrating tasks to a fallback status column.
   */
  delete: async (projectId: string, id: string, fallbackStatusId?: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/statuses/${id}`, {
      params: { fallbackStatusId },
    })
  },
}
