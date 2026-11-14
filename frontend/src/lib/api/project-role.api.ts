import apiClient from "@/lib/api-client"
import type {
  CreateProjectRoleDto,
  ProjectRole,
  UpdateProjectRoleDto,
} from "@/types/project-role.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

/**
 * API client endpoints for Project Roles (custom member permissions/trackers rules).
 */
export const projectRoleApi = {
  /**
   * Lists all roles configured in a project.
   */
  list: async (projectId: string): Promise<ProjectRole[]> => {
    const response = await apiClient.get<ApiResponse<ProjectRole[]>>(`/projects/${projectId}/roles`)
    return response.data.data
  },

  /**
   * Creates a new custom project role.
   */
  create: async (projectId: string, data: CreateProjectRoleDto): Promise<ProjectRole> => {
    const response = await apiClient.post<ApiResponse<ProjectRole>>(
      `/projects/${projectId}/roles`,
      data,
    )
    return response.data.data
  },

  /**
   * Updates an existing project role.
   */
  update: async (
    projectId: string,
    id: string,
    data: UpdateProjectRoleDto,
  ): Promise<ProjectRole> => {
    const response = await apiClient.patch<ApiResponse<ProjectRole>>(
      `/projects/${projectId}/roles/${id}`,
      data,
    )
    return response.data.data
  },

  /**
   * Deletes a project role.
   */
  delete: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/roles/${id}`)
  },
}
