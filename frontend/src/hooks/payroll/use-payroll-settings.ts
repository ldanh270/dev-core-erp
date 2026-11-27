import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS, PAYROLL_SETTINGS_FIELDS } from "@/config/entities/payroll.config"
import apiClient from "@/lib/api-client"
import type { IPayrollSettings } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query hook fetching organizational payroll cycle configuration and date boundaries.
 */
export function usePayrollSettings() {
  return useQuery({
    queryKey: PAYROLL_QUERY_KEYS.SETTINGS,
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.SETTINGS)
      const data = response.data?.data || response.data
      console.log("FETCHED SETTINGS FROM API:", data)
      return data as IPayrollSettings
    },
  })
}

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Pick<IPayrollSettings, (typeof PAYROLL_SETTINGS_FIELDS)[number]>) => {
      const response = await apiClient.put(API_ENDPOINTS.PAYROLL.SETTINGS, data)
      const resData = response.data?.data || response.data
      return resData as IPayrollSettings
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.SETTINGS })
    },
  })
}
