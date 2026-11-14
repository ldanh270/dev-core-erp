import apiClient from "@/lib/api-client"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

export interface TaskEstimateAiSuggestion {
  employeeId: string
  fullName: string
  position: string | null
  skillScore: number
  workloadScore: number
  availabilityScore: number
  finalScore: number
  reasons: string[]
}

export interface GeneratedTaskSuggestion {
  title: string
  description: string
  tracker: string
  priority: string
  estimatedTime: number
}

export const taskEstimateAiApi = {
  getSuggestions: async (taskId: string): Promise<TaskEstimateAiSuggestion[]> => {
    const response = await apiClient.get<ApiResponse<TaskEstimateAiSuggestion[]>>(
      `/task-estimate-ai/tasks/${taskId}/suggestions`,
    )
    return response.data.data
  },

  generateTasks: async (projectId: string): Promise<GeneratedTaskSuggestion[]> => {
    const response = await apiClient.post<ApiResponse<GeneratedTaskSuggestion[]>>(
      `/task-estimate-ai/projects/${projectId}/generate-tasks`,
    )
    return response.data.data
  },
}
