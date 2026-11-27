import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import apiClient from "@/lib/api-client"
import type { IPayslip, IPayslipFeedbackPayload } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Query hook fetching paginated personal payslip records for the authenticated user.
 */
export function useMyPayslips() {
  return useQuery({
    queryKey: PAYROLL_QUERY_KEYS.MY_PAYSLIPS,
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.MY_PAYSLIPS)
      return response.data.data as IPayslip[]
    },
  })
}

export function useSubmitPayslipFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payslipId,
      payload,
    }: {
      payslipId: string
      payload: IPayslipFeedbackPayload
    }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.PAYROLL.MY_PAYSLIP_FEEDBACK(payslipId),
        payload,
      )
      return response.data.data
    },
    onSuccess: () => {
      // Feedback can create an attendance correction, so refresh previews and persisted payslips together.
      void queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.MY_PAYSLIPS })
    },
  })
}
