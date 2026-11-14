import apiClient from "@/lib/api-client"
import type {
  CreateProjectDto,
  GanttData,
  PaginatedProjectsDto,
  Project,
  ProjectListQuery,
  ProjectMember,
  UpdateProjectDto,
} from "@/types/project.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export const projectApi = {
  list: async (query?: ProjectListQuery): Promise<PaginatedProjectsDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedProjectsDto>>("/projects", {
      params: query,
    })
    return response.data.data
  },

  getOne: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
    return response.data.data
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>("/projects", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${id}`)
  },

  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`,
    )
    return response.data.data
  },

  /** hourlyRate + workMode set PT payroll rate and onsite vs remote attendance rules. */
  addMember: async (
    projectId: string,
    data: {
      employeeId: string
      hourlyRate?: number | null
      workMode?: string
      roleId?: string | null
    },
  ): Promise<void> => {
    await apiClient.post<ApiResponse<null>>(`/projects/${projectId}/members`, data)
  },

  /** PATCH member hourlyRate/workMode — drives PT payroll rate and onsite vs remote attendance. */
  updateMember: async (
    projectId: string,
    employeeId: string,
    data: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<void> => {
    // hourlyRate + workMode drive PT payroll and attendance rules per project.
    await apiClient.patch<ApiResponse<null>>(`/projects/${projectId}/members/${employeeId}`, data)
  },

  removeMember: async (projectId: string, employeeId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/members/${employeeId}`)
  },

  getGanttData: async (projectId: string): Promise<GanttData> => {
    const response = await apiClient.get<ApiResponse<GanttData>>(`/projects/${projectId}/gantt`)
    return response.data.data
  },
}
