import {
  ATTENDANCE_QUERY_KEYS,
  HOLIDAY_SCOPE,
  HOLIDAY_SCOPE_LABELS,
  type IHolidayScope,
} from "@/config/entities/attendance.config"
import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { usePermission } from "@/hooks/use-permission"
import { holidaysApi } from "@/lib/api/attendance.api"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"

import { useCallback, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toast } from "sonner"

const { HOLIDAYS: HOLIDAY_MSGS } = ATTENDANCE_MESSAGES

interface IApiErrorResponse {
  error?: { message?: string }
}

export function getHolidayScopeLabel(holiday: IHoliday): string {
  const scope = (holiday.scope as IHolidayScope) || HOLIDAY_SCOPE.ALL
  if (scope === HOLIDAY_SCOPE.POSITION) {
    return holiday.position?.name
      ? HOLIDAY_MSGS.SCOPE_POSITION(holiday.position.name)
      : HOLIDAY_SCOPE_LABELS.position
  }
  if (scope === HOLIDAY_SCOPE.EMPLOYEES) {
    const count = holiday.assignees?.length ?? 0
    return HOLIDAY_MSGS.SCOPE_EMPLOYEES(count)
  }
  return HOLIDAY_SCOPE_LABELS.all
}

/**
 * Encapsulates holidays management state, query fetching, and mutation handlers.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useHolidaysManagement() {
  const { hasPermission } = usePermission()
  const isAdmin = hasPermission("attendance.update")
  const [year, setYear] = useState(new Date().getFullYear())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<IHoliday | null>(null)
  const [deletingHoliday, setDeletingHoliday] = useState<IHoliday | null>(null)
  const queryClient = useQueryClient()
  const holidaysQueryKey = [...ATTENDANCE_QUERY_KEYS.HOLIDAYS, year] as const

  const { data: holidays, isLoading } = useQuery({
    queryKey: holidaysQueryKey,
    queryFn: () => holidaysApi.getAll({ year }),
  })

  const invalidateHolidays = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.HOLIDAYS })
  }, [queryClient])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setEditingHoliday(null)
  }, [])

  const createMutation = useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: (created) => {
      toast.success(HOLIDAY_MSGS.CREATE_SUCCESS(created.length))
      invalidateHolidays()
      closeDialog()
    },
    onError: (error: unknown) => {
      const message = isAxiosError<IApiErrorResponse>(error)
        ? error.response?.data.error?.message
        : undefined
      toast.error(message ?? HOLIDAY_MSGS.CREATE_ERROR)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Pick<IHolidayPayload, "name" | "date" | "type">
    }) => holidaysApi.update(id, data),
    onSuccess: () => {
      toast.success(HOLIDAY_MSGS.UPDATE_SUCCESS)
      invalidateHolidays()
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: holidaysApi.delete,
    onSuccess: () => {
      toast.success(HOLIDAY_MSGS.DELETE_SUCCESS)
      invalidateHolidays()
      setDeletingHoliday(null)
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = useCallback(() => {
    setEditingHoliday(null)
    setIsDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((holiday: IHoliday) => {
    setEditingHoliday(holiday)
    setIsDialogOpen(true)
  }, [])

  const handlePreviousYear = useCallback(() => {
    setYear((y) => y - 1)
  }, [])

  const handleNextYear = useCallback(() => {
    setYear((y) => y + 1)
  }, [])

  return {
    year,
    setYear,
    holidays,
    isLoading,
    isAdmin,
    isDialogOpen,
    setIsDialogOpen,
    editingHoliday,
    deletingHoliday,
    setDeletingHoliday,
    isSaving,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    createMutation,
    updateMutation,
    deleteMutation,
    handlePreviousYear,
    handleNextYear,
  }
}
