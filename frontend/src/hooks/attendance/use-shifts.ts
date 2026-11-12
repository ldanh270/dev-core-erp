import { shiftsApi } from "@/lib/api/attendance.api"
import type { ICreateShiftPayload, IUpdateShiftPayload } from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const SHIFTS_KEY = ["shifts"] as const

/**
 * Hook to fetch all configured work shifts.
 *
 * @returns React Query query result with list of shifts
 */
export function useShifts() {
  return useQuery({
    queryKey: SHIFTS_KEY,
    queryFn: shiftsApi.getAll,
  })
}

/**
 * Hook to fetch details for a single shift by ID.
 *
 * @param id - Shift ID or null
 * @returns React Query query result with shift details
 */
export function useShiftById(id: string | null) {
  return useQuery({
    queryKey: ["shifts", id],
    queryFn: () => shiftsApi.getById(id!),
    enabled: !!id,
  })
}

/**
 * Mutation hook to create a new work shift definition.
 * Automatically invalidates active shifts queries upon success.
 *
 * @returns React Query mutation object
 */
export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateShiftPayload) => shiftsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

/**
 * Mutation hook to update an existing work shift definition.
 * Automatically invalidates active shifts queries upon success.
 *
 * @returns React Query mutation object
 */
export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: IUpdateShiftPayload & { id: string }) =>
      shiftsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}

/**
 * Mutation hook to delete a work shift by ID.
 * Automatically invalidates active shifts queries upon success.
 *
 * @returns React Query mutation object
 */
export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shiftsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHIFTS_KEY }),
  })
}
