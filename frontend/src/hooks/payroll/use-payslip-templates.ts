import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import apiClient from "@/lib/api-client"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query and mutation hooks for payslip templates CRUD operations.
 */
export function usePayslipTemplates() {
  return useQuery({
    queryKey: PAYROLL_QUERY_KEYS.PAYSLIP_TEMPLATES,
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES)
      return response.data.data as IPayslipTemplate[]
    },
  })
}

export interface ICreatePayslipTemplatePayload {
  name: string
  description?: string
  components: Array<{
    componentId: string
    overrideFormula?: string
  }>
}

export function useCreatePayslipTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ICreatePayslipTemplatePayload) => {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES, data)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYSLIP_TEMPLATES })
    },
  })
}

export function useUpdatePayslipTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ICreatePayslipTemplatePayload> & { id: string; isActive?: boolean }) => {
      const response = await apiClient.put(`${API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES}/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYSLIP_TEMPLATES })
    },
  })
}

export function useDeletePayslipTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`${API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES}/${id}`)
      return response.data.data
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYSLIP_TEMPLATES })
    },
  })
}
