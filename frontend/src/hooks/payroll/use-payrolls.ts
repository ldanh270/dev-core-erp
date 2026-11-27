import { API_ENDPOINTS } from "@/config/api.config"
import { PAYROLL_QUERY_KEYS } from "@/config/entities/payroll.config"
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import apiClient from "@/lib/api-client"
import {
  approvePayroll,
  generatePayroll,
  getPayrollDetails,
  getPayrolls,
  rejectPayroll,
} from "@/lib/api/payroll.api"
import type { IPayslip } from "@/types/payroll.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Query and mutation hooks for fetching, generating, and approving monthly payroll batches.
 */
export function usePayslip(payrollId: string | null, employeeId: string | null) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.PAYSLIP, payrollId, employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.BASE}/${payrollId}/payslips/${employeeId}`,
      )
      return response.data.data as IPayslip
    },
    enabled: !!payrollId && !!employeeId,
  })
}

export function usePayrolls(params?: { status?: string; year?: number }) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.PAYROLLS, params],
    queryFn: () => getPayrolls(params),
  })
}

export function usePayrollDetails(id: string) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.PAYROLL_DETAILS, id],
    queryFn: () => getPayrollDetails(id),
    enabled: !!id,
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { month: number; year: number; name?: string }) => generatePayroll(data),
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.GENERATE_PAYROLL)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYROLLS })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || PAYROLL_MESSAGES.ERRORS.GENERATE_PAYROLL)
    },
  })
}

export function useApprovePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approvePayroll,
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.APPROVE_PAYROLL)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYROLLS })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || PAYROLL_MESSAGES.ERRORS.APPROVE_PAYROLL)
    },
  })
}

export function useRejectPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPayroll(id, reason),
    onSuccess: () => {
      toast.success(PAYROLL_MESSAGES.SUCCESS.REJECT_PAYROLL)
      return queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.PAYROLLS })
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || PAYROLL_MESSAGES.ERRORS.REJECT_PAYROLL)
    },
  })
}

export function useEmployeePayslipsHistory(employeeId: string | null) {
  return useQuery({
    queryKey: [...PAYROLL_QUERY_KEYS.PAYSLIPS_HISTORY, employeeId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.PAYROLL.BASE}/employee/${employeeId}/payslips`,
      )
      // the endpoint might return an array if modified, but getMyPayslips returns an array. Let's cast it
      return response.data.data as IPayslip[]
    },
    enabled: !!employeeId,
  })
}
