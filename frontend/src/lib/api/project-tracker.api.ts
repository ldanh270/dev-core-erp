import apiClient from "@/lib/api-client"
import type {
  CreateProjectTrackerDto,
  ProjectTracker,
  UpdateProjectTrackerDto,
} from "@/types/project-tracker.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

/**
 * API client endpoints for Project Trackers (project-scoped request types).
 */
export const projectTrackerApi = {
  /**
   * Lists all trackers configured in a project.
   */
  list: async (projectId: string): Promise<ProjectTracker[]> => {
    const response = await apiClient.get<ApiResponse<ProjectTracker[]>>(
      `/projects/${projectId}/trackers`,
    )
    return response.data.data
  },

  /**
   * Creates a new custom project tracker.
   */
  create: async (projectId: string, data: CreateProjectTrackerDto): Promise<ProjectTracker> => {
    const response = await apiClient.post<ApiResponse<ProjectTracker>>(
      `/projects/${projectId}/trackers`,
      data,
    )
    return response.data.data
  },

  /**
   * Updates an existing project tracker.
   */
  update: async (
    projectId: string,
    id: string,
    data: UpdateProjectTrackerDto,
  ): Promise<ProjectTracker> => {
    const response = await apiClient.patch<ApiResponse<ProjectTracker>>(
      `/projects/${projectId}/trackers/${id}`,
      data,
    )
    return response.data.data
  },

  /**
   * Deactivates/deletes a project tracker.
   */
  delete: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/trackers/${id}`)
  },
}
