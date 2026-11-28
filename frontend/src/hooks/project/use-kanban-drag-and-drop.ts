import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { taskApi } from "@/lib/api/task.api"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { Task } from "@/types/task.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface UseKanbanDragAndDropProps {
  projectId: string
  tasks: Task[]
  statuses: ProjectTaskStatus[]
  canManageStatuses: boolean
}

/**
 * Hook providing drag-and-drop mechanics for project Kanban cards and columns,
 * including optimistic updates and reordering mutations.
 */
export function useKanbanDragAndDrop({
  projectId,
  tasks,
  statuses,
  canManageStatuses,
}: UseKanbanDragAndDropProps) {
  const queryClient = useQueryClient()
  const KANBAN_QUERY_KEY = ["tasks", "kanban", projectId] as const

  const [dragOverInfo, setDragOverInfo] = useState<{
    taskId: string
    position: "top" | "bottom"
  } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string | null }) =>
      taskApi.update(taskId, { statusId }),

    onMutate: async ({ taskId, statusId }) => {
      await queryClient.cancelQueries({ queryKey: KANBAN_QUERY_KEY })
      const previousData = queryClient.getQueryData<{ data: Task[] }>(KANBAN_QUERY_KEY)

      queryClient.setQueryData<{ data: Task[] }>(KANBAN_QUERY_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((t) => (t.id === taskId ? { ...t, statusId } : t)),
        }
      })

      return { previousData }
    },

    onError: (err: unknown, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousData)
      }
      toast.error(extractErrorMessage(err))
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY })
    },

    onSuccess: () => {
      toast.success("Đã di chuyển công việc")
    },
  })

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.effectAllowed = "move"
    setDraggingTaskId(task.id)
  }

  const handleDragEnd = () => {
    setDragOverInfo(null)
    setDraggingTaskId(null)
  }

  const handleCardDragOver = (e: React.DragEvent, taskId: string) => {
    if (draggingColumnId) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: "top" | "bottom" = e.clientY < midY ? "top" : "bottom"
    setDragOverInfo({ taskId, position })
  }

  const isInvalidBackwardTransition = (
    sourceStatusId?: string | null,
    targetStatusId?: string | null,
  ): boolean => {
    if (!sourceStatusId || !targetStatusId) return false
    const sourceStatus = statuses.find((s) => s.id === sourceStatusId)
    const targetStatus = statuses.find((s) => s.id === targetStatusId)
    if (!sourceStatus || !targetStatus) return false

    return !sourceStatus.isDefault && !sourceStatus.isCompleted && targetStatus.isDefault
  }

  const handleCardDrop = (e: React.DragEvent, targetTask: Task) => {
    if (draggingColumnId) return
    e.preventDefault()
    e.stopPropagation()
    const taskId = e.dataTransfer.getData("text/plain")
    setDragOverInfo(null)
    setDraggingTaskId(null)
    if (taskId && taskId !== targetTask.id) {
      const sourceTask = tasks.find((t) => t.id === taskId)
      if (sourceTask && sourceTask.statusId !== targetTask.statusId) {
        if (isInvalidBackwardTransition(sourceTask.statusId, targetTask.statusId)) {
          toast.warning(
            "Công việc đang thực hiện không thể chuyển ngược lại về cần làm theo quy trình",
          )
          return
        }
        moveTaskMutation.mutate({ taskId, statusId: targetTask.statusId })
      }
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    setDragOverInfo(null)
    setDraggingTaskId(null)
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.statusId !== targetStatusId) {
        if (isInvalidBackwardTransition(task.statusId, targetStatusId)) {
          toast.warning(
            "Công việc đang thực hiện không thể chuyển ngược lại về cần làm theo quy trình",
          )
          return
        }
        moveTaskMutation.mutate({ taskId, statusId: targetStatusId })
      }
    }
  }

  const handleColumnDragStart = (e: React.DragEvent, statusId: string) => {
    if (!canManageStatuses) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData("columnId", statusId)
    e.dataTransfer.effectAllowed = "move"
    setDraggingColumnId(statusId)
  }

  const handleColumnDragEnd = () => {
    setDraggingColumnId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragOver = (e: React.DragEvent, statusId: string) => {
    if (!draggingColumnId || draggingColumnId === statusId) return
    e.preventDefault()
    setDragOverColumnId(statusId)
  }

  const handleReorderColumns = async (sourceId: string, targetId: string) => {
    const sourceIndex = statuses.findIndex((s) => s.id === sourceId)
    const targetIndex = statuses.findIndex((s) => s.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const reorder = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
      const result = Array.from(list)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    }

    const reorderedStatuses = reorder(statuses, sourceIndex, targetIndex)
    const updatedStatuses = reorderedStatuses.map((status, index) => ({
      ...status,
      order: index,
    }))

    const STATUSES_QUERY_KEY = ["projectStatuses", projectId] as const

    await queryClient.cancelQueries({ queryKey: STATUSES_QUERY_KEY })
    const previousStatuses = queryClient.getQueryData<ProjectTaskStatus[]>(STATUSES_QUERY_KEY)

    queryClient.setQueryData<ProjectTaskStatus[]>(STATUSES_QUERY_KEY, updatedStatuses)

    const promises = updatedStatuses
      .filter((status) => {
        const original = statuses.find((s) => s.id === status.id)
        return !original || original.order !== status.order
      })
      .map((status) => projectTaskStatusApi.update(projectId, status.id, { order: status.order }))

    try {
      await Promise.all(promises)
      toast.success("Đã cập nhật thứ tự các cột")
    } catch (error) {
      if (previousStatuses) {
        queryClient.setQueryData(STATUSES_QUERY_KEY, previousStatuses)
      }
      toast.error(extractErrorMessage(error))
    } finally {
      void queryClient.invalidateQueries({ queryKey: STATUSES_QUERY_KEY })
    }
  }

  const handleColumnDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const sourceStatusId = e.dataTransfer.getData("columnId") || draggingColumnId
    setDragOverColumnId(null)
    setDraggingColumnId(null)
    if (sourceStatusId && sourceStatusId !== targetStatusId) {
      void handleReorderColumns(sourceStatusId, targetStatusId)
    }
  }

  return {
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,
    moveTaskMutation,
    handleDragStart,
    handleDragEnd,
    handleCardDragOver,
    handleCardDrop,
    handleDrop,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDrop,
  }
}
