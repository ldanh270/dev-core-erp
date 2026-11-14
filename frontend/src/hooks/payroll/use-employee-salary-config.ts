import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import apiClient from "@/lib/api-client.ts"
import type { IEmployeeSalaryConfig, IPayslipTemplate } from "@/types/payroll.types.ts"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useActiveSalaryConfig(employeeId: string) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.EMPLOYEE_SALARY_CONFIG, "active", employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config`,
      )
      return response.data.data as IEmployeeSalaryConfig | null
    },
    enabled: !!employeeId,
  })
}

export function useSalaryConfigHistory(employeeId: string) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.EMPLOYEE_SALARY_CONFIG, "history", employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config/history`,
      )
      return response.data.data as IEmployeeSalaryConfig[]
    },
    enabled: !!employeeId,
  })
}

export function useAssignSalaryConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      ...data
    }: Omit<IEmployeeSalaryConfig, "id" | "employeeId" | "createdAt" | "updatedAt"> & {
      employeeId: string
    }) => {
      const response = await apiClient.post(
        `${API_ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG}/${employeeId}/salary-config`,
        data,
      )
      return response.data.data as IEmployeeSalaryConfig
    },
    onSuccess: (_, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...PAYROLL_QUERY_KEYS.EMPLOYEE_SALARY_CONFIG, "active", variables.employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...PAYROLL_QUERY_KEYS.EMPLOYEE_SALARY_CONFIG, "history", variables.employeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employees"], // Invalidate employee list to update display salaries
        }),
      ])
    },
  })
}

export function useBulkAssignSalaryTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      employeeIds: string[]
      templateId: string
      defaultBaseSalary: number
      effectiveFrom: string
      note?: string
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.BULK_ASSIGN_SALARY_TEMPLATE, data)
      return response.data.data as { assignedCount: number }
    },
    onSuccess: () => {
      // Bulk assignment can alter many employees, so refresh both salary configs and employee summaries.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.EMPLOYEE_SALARY_CONFIG }),
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
      ])
    },
  })
}

export function usePayslipTemplates() {
  return useQuery({
    queryKey: ["payslip-templates"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES)
      return response.data.data as IPayslipTemplate[]
    },
  })
}
