import { SPENT_TIME_STATUS } from "@/config/entities/project.config"
import { SPENT_TIME_UI } from "@/config/rules/spent-time.config"
import { taskApi } from "@/lib/api/task.api"
import type { SpentTime } from "@/types/spent-time.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Tier 1 Business Hook coordinating spent-time entries, aggregated totals, and approval mutations for a task.
 * @param taskId - Unique ID of the active task.
 */
export function useTaskSpentTimeActions(taskId: string) {
  const queryClient = useQueryClient()
  const [isOpenLogTimeModal, setIsOpenLogTimeModal] = useState(false)
  const [editingSpentTime, setEditingSpentTime] = useState<SpentTime | undefined>(undefined)

  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", taskId],
    queryFn: () => taskApi.listSpentTimes({ taskId }),
    enabled: !!taskId,
  })

  const totalSpentHours = useMemo(() => {
    return (
      spentTimes
        ?.filter((st) => st.status !== SPENT_TIME_STATUS.REJECTED)
        .reduce((sum, st) => sum + st.hours, 0) || 0
    )
  }, [spentTimes])

  const approveSpentTimeMutation = useMutation({
    mutationFn: (logId: string) => taskApi.approveSpentTime(logId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", taskId] })
      toast.success(SPENT_TIME_UI.TASK_TOAST_APPROVED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const rejectSpentTimeMutation = useMutation({
    mutationFn: ({ logId, reason }: { logId: string; reason: string }) =>
      taskApi.rejectSpentTime(logId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", taskId] })
      toast.success(SPENT_TIME_UI.TASK_TOAST_REJECTED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const deleteSpentTimeMutation = useMutation({
    mutationFn: async (logId: string) => {
      return taskApi.deleteSpentTime(logId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", taskId] })
      void queryClient.invalidateQueries({ queryKey: ["project"] })
    },
  })

  return {
    spentTimes,
    isLoadingSpent,
    totalSpentHours,
    isOpenLogTimeModal,
    setIsOpenLogTimeModal,
    editingSpentTime,
    setEditingSpentTime,
    approveSpentTimeMutation,
    rejectSpentTimeMutation,
    deleteSpentTimeMutation,
  }
}
