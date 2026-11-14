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

/**
 * Data access client for project management, memberships, and timeline planning.
 */
export const projectApi = {
  /**
   * Retrieves a paginated list of projects with optional query filters.
   *
   * @param query - Optional filtering, searching, and pagination options
   * @returns Paginated projects result
   */
  list: async (query?: ProjectListQuery): Promise<PaginatedProjectsDto> => {
    const response = await apiClient.get<ApiResponse<PaginatedProjectsDto>>("/projects", {
      params: query,
    })
    return response.data.data
  },

  /**
   * Retrieves detailed information for a single project by ID.
   *
   * @param id - Project unique identifier
   * @returns Project entity
   */
  getOne: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
    return response.data.data
  },

  /**
   * Creates a new project in the system.
   *
   * @param data - Project creation parameters
   * @returns Newly created project entity
   */
  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>("/projects", data)
    return response.data.data
  },

  /**
   * Updates an existing project's metadata or timeline dates.
   *
   * @param id - Project unique identifier
   * @param data - Project update parameters
   * @returns Updated project entity
   */
  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data)
    return response.data.data
  },

  /**
   * Soft deletes a project by ID.
   *
   * @param id - Project unique identifier
   * @returns Resolves when project is deleted
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${id}`)
  },

  /**
   * Retrieves member list and assignments for a project.
   *
   * @param projectId - Project unique identifier
   * @returns Array of project members
   */
  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`,
    )
    return response.data.data
  },

  /**
   * Adds an employee as a project member with optional rates and work mode.
   *
   * @param projectId - Project unique identifier
   * @param data - Member assignment payload
   * @returns Resolves when member is added
   */
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

  /**
   * Updates a project member's rate, work mode, or assigned role.
   *
   * @param projectId - Project unique identifier
   * @param employeeId - Member employee identifier
   * @param data - Member update payload
   * @returns Resolves when member is updated
   */
  updateMember: async (
    projectId: string,
    employeeId: string,
    data: { hourlyRate?: number | null; workMode?: string; roleId?: string | null },
  ): Promise<void> => {
    await apiClient.patch<ApiResponse<null>>(`/projects/${projectId}/members/${employeeId}`, data)
  },

  /**
   * Removes an employee from a project's active member roster.
   *
   * @param projectId - Project unique identifier
   * @param employeeId - Member employee identifier
   * @returns Resolves when member is removed
   */
  removeMember: async (projectId: string, employeeId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/projects/${projectId}/members/${employeeId}`)
  },

  /**
   * Retrieves Gantt chart timeline tasks and milestones for a project.
   *
   * @param projectId - Project unique identifier
   * @returns Gantt data structure
   */
  getGanttData: async (projectId: string): Promise<GanttData> => {
    const response = await apiClient.get<ApiResponse<GanttData>>(`/projects/${projectId}/gantt`)
    return response.data.data
  },
}
