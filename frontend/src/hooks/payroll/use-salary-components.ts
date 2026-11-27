import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import apiClient from "@/lib/api-client"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query and mutation hooks for salary components CRUD operations.
 */
export function useSalaryComponents() {
  return useQuery({
    queryKey: PAYROLL_QUERY_KEYS.SALARY_COMPONENTS,
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.SALARY_COMPONENTS)
      return response.data.data as ISalaryComponent[]
    },
  })
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<ISalaryComponent>) => {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.SALARY_COMPONENTS, data)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_COMPONENTS })
    },
  })
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ISalaryComponent> & { id: string }) => {
      const response = await apiClient.put(`${API_ENDPOINTS.PAYROLL.SALARY_COMPONENTS}/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_COMPONENTS })
    },
  })
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`${API_ENDPOINTS.PAYROLL.SALARY_COMPONENTS}/${id}`)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_COMPONENTS })
    },
  })
}
