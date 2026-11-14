import apiClient from "@/lib/api-client"

/**
 * Position domain entity interface.
 */
export interface Position {
  id: string
  name: string
  code: string
  description: string | null
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
  createdAt: string
  updatedAt: string
}

/**
 * ProjectPositionRule interface mapping allowed trackers to positions per project.
 */
export interface ProjectPositionRule {
  id: string
  projectId: string
  positionId: string
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
  createdAt: string
  updatedAt: string
  position?: Position
}

/**
 * DTO to create a new position.
 */
export interface CreatePositionDto {
  name: string
  code: string
  description?: string
  allowedTaskTrackers?: string[]
  allowedApplicationTypes?: string[]
}

/**
 * DTO to update an existing position.
 */
export interface UpdatePositionDto {
  name?: string
  code?: string
  description?: string | null
  allowedTaskTrackers?: string[]
  allowedApplicationTypes?: string[]
}

/**
 * DTO containing allowed configuration parameters for a position within a project.
 */
export interface ProjectPositionRuleDto {
  positionId: string
  allowedTaskTrackers: string[]
  allowedApplicationTypes: string[]
}

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

/**
 * API client endpoints for Position management.
 */
export const positionApi = {
  /**
   * Retrieves all organizational positions.
   */
  list: async (): Promise<Position[]> => {
    const response = await apiClient.get<ApiResponse<Position[]>>("/positions")
    return response.data.data
  },

  /**
   * Retrieves a single position by ID.
   */
  getOne: async (id: string): Promise<Position> => {
    const response = await apiClient.get<ApiResponse<Position>>(`/positions/${id}`)
    return response.data.data
  },

  /**
   * Submits request to create a new position.
   */
  create: async (data: CreatePositionDto): Promise<Position> => {
    const response = await apiClient.post<ApiResponse<Position>>("/positions", data)
    return response.data.data
  },

  /**
   * Submits request to update an existing position.
   */
  update: async (id: string, data: UpdatePositionDto): Promise<Position> => {
    const response = await apiClient.put<ApiResponse<Position>>(`/positions/${id}`, data)
    return response.data.data
  },

  /**
   * Submits request to delete/deactivate a position.
   */
  delete: async (id: string): Promise<Position> => {
    const response = await apiClient.delete<ApiResponse<Position>>(`/positions/${id}`)
    return response.data.data
  },

  /**
   * Retrieves all position rules configured for a project.
   */
  listProjectRules: async (projectId: string): Promise<ProjectPositionRule[]> => {
    const response = await apiClient.get<ApiResponse<ProjectPositionRule[]>>(
      `/positions/projects/${projectId}/position-rules`,
    )
    return response.data.data
  },

  /**
   * Submits batch update to configure position rules inside a project.
   */
  saveProjectRules: async (
    projectId: string,
    rules: ProjectPositionRuleDto[],
  ): Promise<ProjectPositionRule[]> => {
    const response = await apiClient.post<ApiResponse<ProjectPositionRule[]>>(
      `/positions/projects/${projectId}/position-rules`,
      { rules },
    )
    return response.data.data
  },
}
