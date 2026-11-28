import { requisitionApi } from "@/lib/api/recruitment.api"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { POSTING_STAGE_COLORS } from "./use-posting-kanban"
import { useRecruitmentKanbanDnd } from "./use-recruitment-kanban-dnd"

/**
 * Encapsulates query orchestration, mutation lifecycle, and dialog state
 * for Requisition-level Kanban boards.
 */
export function useRequisitionKanban(requisitionId: string, canManageStages: boolean) {
  const queryClient = useQueryClient()
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [columnName, setColumnName] = useState("")
  const [columnColor, setColumnColor] = useState<string>(POSTING_STAGE_COLORS[0])
  const [columnIsCompleted, setColumnIsCompleted] = useState(false)
  const [columnIsDefault, setColumnIsDefault] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<RecruitmentPipelineStage | null>(null)
  const [fallbackColumnId, setFallbackColumnId] = useState("")

  const stagesKey = ["recruitment", "requisition-stages", requisitionId] as const
  const applicationsKey = ["recruitment", "requisition-kanban", requisitionId] as const

  const stagesQuery = useQuery({
    queryKey: stagesKey,
    queryFn: () => requisitionApi.stages(requisitionId),
    enabled: Boolean(requisitionId),
  })

  const applicationsQuery = useQuery({
    queryKey: applicationsKey,
    queryFn: () => requisitionApi.workspace(requisitionId).then((result) => result.applications),
    enabled: Boolean(requisitionId),
  })

  const { data: statuses = [], isLoading: isLoadingStatuses } = stagesQuery
  const { data: applicationResult, isLoading: isLoadingTasks } = applicationsQuery
  const tasks = (applicationResult?.data ?? []) as KanbanApplication[]

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: stagesKey })
    void queryClient.invalidateQueries({ queryKey: applicationsKey })
    void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
  }

  const resetForm = () => {
    setColumnName("")
    setColumnColor(POSTING_STAGE_COLORS[0])
    setColumnIsCompleted(false)
    setColumnIsDefault(false)
    setSelectedColumn(null)
    setFallbackColumnId("")
  }

  const createStatusMutation = useMutation({
    mutationFn: () =>
      requisitionApi.createStage(requisitionId, {
        name: columnName.trim(),
        color: columnColor,
        isCompleted: columnIsCompleted,
        isDefault: columnIsDefault,
      }),
    onSuccess: () => {
      refresh()
      toast.success("Đã tạo cột trạng thái mới")
      setIsAddColumnOpen(false)
      resetForm()
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const updateStatusMutation = useMutation({
    mutationFn: () =>
      requisitionApi.updateStage(requisitionId, selectedColumn?.id ?? "", {
        name: columnName.trim(),
        color: columnColor,
        isCompleted: columnIsCompleted,
        isDefault: columnIsDefault,
      }),
    onSuccess: () => {
      refresh()
      toast.success("Đã cập nhật trạng thái")
      setIsEditColumnOpen(false)
      resetForm()
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const deleteStatusMutation = useMutation({
    mutationFn: () =>
      requisitionApi.deleteStage(requisitionId, selectedColumn?.id ?? "", fallbackColumnId),
    onSuccess: () => {
      refresh()
      toast.success("Đã xóa cột trạng thái")
      setIsDeleteConfirmOpen(false)
      resetForm()
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) =>
      requisitionApi.moveApplicationStage(requisitionId, taskId, statusId),
    onMutate: async ({ taskId, statusId }) => {
      await queryClient.cancelQueries({ queryKey: applicationsKey })
      const previousData = queryClient.getQueryData<typeof applicationResult>(applicationsKey)
      queryClient.setQueryData<typeof applicationResult>(applicationsKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      pipelineStage:
                        statuses.find((stage) => stage.id === statusId) ?? task.pipelineStage,
                    }
                  : task,
              ),
            }
          : old,
      )
      return { previousData }
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) queryClient.setQueryData(applicationsKey, context.previousData)
      toast.error(extractErrorMessage(error))
    },
    onSuccess: () => toast.success("Đã di chuyển ứng viên"),
    onSettled: refresh,
  })

  const handleReorderColumns = async (sourceId: string, targetId: string) => {
    const sourceIndex = statuses.findIndex((stage) => stage.id === sourceId)
    const targetIndex = statuses.findIndex((stage) => stage.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const ordered = [...statuses]
    const [removed] = ordered.splice(sourceIndex, 1)
    ordered.splice(targetIndex, 0, removed)
    const updated = ordered.map((stage, position) => ({ ...stage, position }))
    const previous = queryClient.getQueryData<RecruitmentPipelineStage[]>(stagesKey)
    queryClient.setQueryData(stagesKey, updated)
    try {
      await requisitionApi.reorderStages(
        requisitionId,
        updated.map((stage) => stage.id),
      )
      toast.success("Đã cập nhật thứ tự các cột")
    } catch (error) {
      if (previous) queryClient.setQueryData(stagesKey, previous)
      toast.error(extractErrorMessage(error))
    } finally {
      void queryClient.invalidateQueries({ queryKey: stagesKey })
    }
  }

  const dnd = useRecruitmentKanbanDnd({
    tasks,
    canManageStages,
    onMoveTask: (taskId, statusId) => moveTaskMutation.mutate({ taskId, statusId }),
    onReorderColumns: (sourceId, targetId) => void handleReorderColumns(sourceId, targetId),
  })

  return {
    canManageStages,
    statuses,
    tasks,
    isLoadingStatuses,
    isLoadingTasks,
    isError: stagesQuery.isError || applicationsQuery.isError,
    refetch: () => {
      void stagesQuery.refetch()
      void applicationsQuery.refetch()
    },
    isAddColumnOpen,
    setIsAddColumnOpen,
    isEditColumnOpen,
    setIsEditColumnOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    columnName,
    setColumnName,
    columnColor,
    setColumnColor,
    columnIsCompleted,
    setColumnIsCompleted,
    columnIsDefault,
    setColumnIsDefault,
    selectedColumn,
    setSelectedColumn,
    fallbackColumnId,
    setFallbackColumnId,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    moveTaskMutation,
    resetForm,
    handleReorderColumns,
    ...dnd,
  }
}
