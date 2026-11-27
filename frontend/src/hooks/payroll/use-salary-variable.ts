import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import apiClient from "@/lib/api-client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Query and mutation hooks for salary variable definitions and values.
 */
export interface ISalaryVariable {
  id: string
  code: string
  name: string
  value: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ICreateSalaryVariableDTO {
  code: string
  name: string
  value: number
  description?: string
}

export interface IUpdateSalaryVariableDTO extends Partial<ICreateSalaryVariableDTO> {
  isActive?: boolean
}

const ENDPOINT = "/salary-variables"

export function useSalaryVariables(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.SALARY_VARIABLES, params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ISalaryVariable[] }>(ENDPOINT, {
        params,
      })
      return data.data
    },
  })
}

export function useSalaryVariable(id: string) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.SALARY_VARIABLES, id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ISalaryVariable }>(`${ENDPOINT}/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ICreateSalaryVariableDTO) => {
      const { data } = await apiClient.post<{ data: ISalaryVariable }>(ENDPOINT, payload)
      return data.data
    },
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.CREATE_SALARY_VARIABLE)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_VARIABLES })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || PAYROLL_MESSAGES.ERRORS.CREATE_SALARY_VARIABLE,
      )
    },
  })
}

export function useUpdateSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: IUpdateSalaryVariableDTO }) => {
      const { data } = await apiClient.put<{ data: ISalaryVariable }>(`${ENDPOINT}/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_SALARY_VARIABLE)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_VARIABLES })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || PAYROLL_MESSAGES.ERRORS.UPDATE_SALARY_VARIABLE,
      )
    },
  })
}

export function useDeleteSalaryVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${ENDPOINT}/${id}`)
    },
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.DELETE_SALARY_VARIABLE)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SALARY_VARIABLES })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || PAYROLL_MESSAGES.ERRORS.DELETE_SALARY_VARIABLE,
      )
    },
  })
}
