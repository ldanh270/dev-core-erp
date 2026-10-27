import { DEFAULT_KANBAN_COLOR } from "@/config/entities/project.config"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { taskApi } from "@/lib/api/task.api"
import { extractErrorMessage } from "@/utils/error-helper"
import { toast } from "sonner"
import { usePermission } from "@/hooks/use-permission"
import type { Task } from "@/types/task.types"
import type { ProjectTaskStatus, CreateProjectTaskStatusDto, UpdateProjectTaskStatusDto } from "@/types/project-task-status.types"

interface UseProjectKanbanProps {
  projectId: string
  teamLeader?: {
    id: string;
    fullName: string;
    email: string;
  } | null
  user: {
    id: string
    role?: string
    roles?: string[]
    fullName: string
  } | null
}

/**
 * Custom hook to manage projectkanban.
 */
export function useProjectKanban({
  projectId,
  teamLeader,
  user,
}: UseProjectKanbanProps) {
  const queryClient = useQueryClient()
  const isLeader = teamLeader?.id === user?.id
  const { hasAnyPermission } = usePermission()
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
  const canManageStatuses = isAdminOrGM || isLeader

  // Modal States
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Form States
  const [columnName, columnNameSet] = useState("")
  const [columnColor, columnColorSet] = useState<string>(DEFAULT_KANBAN_COLOR)
  const [columnIsCompleted, columnIsCompletedSet] = useState(false)
  const [columnIsDefault, columnIsDefaultSet] = useState(false)

  // Selected Target States
  const [selectedColumn, setSelectedColumn] = useState<ProjectTaskStatus | null>(null)
  const [fallbackColumnId, setFallbackColumnId] = useState<string>("")

  // Fetch dynamic project statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  // Fetch tasks of this project
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", "kanban", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!projectId,
  })

  const tasks = tasksData?.data || []

  // Create Status Mutation
  const createStatusMutation = useMutation({
    mutationFn: (data: CreateProjectTaskStatusDto) => projectTaskStatusApi.create(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      toast.success("Đã tạo cột trạng thái mới")
      setIsAddColumnOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTaskStatusDto }) => 
      projectTaskStatusApi.update(projectId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
      void queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      toast.success("Đã cập nhật trạng thái")
      setIsEditColumnOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Delete Status Mutation
  const deleteStatusMutation = useMutation({
    mutationFn: ({ id, fallbackId }: { id: string; fallbackId?: string }) => 
      projectTaskStatusApi.delete(projectId, id, fallbackId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectStatuses", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
      void queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] })
      toast.success("Đã xóa cột trạng thái")
      setIsDeleteConfirmOpen(false)
      resetForm()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Move Task Mutation — Optimistic Update
  const KANBAN_QUERY_KEY = ["tasks", "kanban", projectId] as const

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string | null }) =>
      taskApi.update(taskId, { statusId }),

    // 1. Immediately update the cache before the API call
    onMutate: async ({ taskId, statusId }) => {
      await queryClient.cancelQueries({ queryKey: KANBAN_QUERY_KEY })
      const previousData = queryClient.getQueryData<{ data: Task[] }>(KANBAN_QUERY_KEY)

      queryClient.setQueryData<{ data: Task[] }>(KANBAN_QUERY_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((t) =>
            t.id === taskId ? { ...t, statusId } : t
          ),
        }
      })

      return { previousData }
    },

    // 2. On API error: rollback to snapshot
    onError: (err: unknown, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousData)
      }
      toast.error(extractErrorMessage(err))
    },

    // 3. On settle: sync with server truth
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY })
    },

    onSuccess: () => {
      toast.success("Đã di chuyển công việc")
    },
  })

  const resetForm = () => {
    columnNameSet("")
    columnColorSet(DEFAULT_KANBAN_COLOR)
    columnIsCompletedSet(false)
    columnIsDefaultSet(false)
    setSelectedColumn(null)
    setFallbackColumnId("")
  }

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!columnName.trim()) return
    createStatusMutation.mutate({
      name: columnName,
      color: columnColor,
      isCompleted: columnIsCompleted,
      isDefault: columnIsDefault,
    })
  }

  const handleUpdateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedColumn || !columnName.trim()) return
    updateStatusMutation.mutate({
      id: selectedColumn.id,
      data: {
        name: columnName,
        color: columnColor,
        isCompleted: columnIsCompleted,
        isDefault: columnIsDefault,
      },
    })
  }

  const handleDeleteColumn = () => {
    if (!selectedColumn) return
    deleteStatusMutation.mutate({
      id: selectedColumn.id,
      fallbackId: fallbackColumnId || undefined,
    })
  }

  // Drag state: track which card is being hovered and position
  const [dragOverInfo, setDragOverInfo] = useState<{ taskId: string; position: "top" | "bottom" } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)

  // Column drag and drop states
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

  // Native Drag and Drop events for cards
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

  const handleColumnDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const sourceStatusId = e.dataTransfer.getData("columnId") || draggingColumnId
    setDragOverColumnId(null)
    setDraggingColumnId(null)
    if (sourceStatusId && sourceStatusId !== targetStatusId) {
      void handleReorderColumns(sourceStatusId, targetStatusId)
    }
  }

  const handleReorderColumns = async (sourceId: string, targetId: string) => {
    const sourceIndex = statuses.findIndex((s) => s.id === sourceId)
    const targetIndex = statuses.findIndex((s) => s.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
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
      .map((status) =>
        projectTaskStatusApi.update(projectId, status.id, { order: status.order })
      )

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

  return {
    isLeader,
    isAdminOrGM,
    canManageStatuses,

    // Modal States
    isAddColumnOpen,
    setIsAddColumnOpen,
    isEditColumnOpen,
    setIsEditColumnOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,

    // Form States
    columnName,
    setColumnName: columnNameSet,
    columnColor,
    setColumnColor: columnColorSet,
    columnIsCompleted,
    setColumnIsCompleted: columnIsCompletedSet,
    columnIsDefault,
    setColumnIsDefault: columnIsDefaultSet,

    // Selected Target States
    selectedColumn,
    setSelectedColumn,
    fallbackColumnId,
    setFallbackColumnId,

    // Queries
    statuses,
    isLoadingStatuses,
    isLoadingTasks,
    tasks,

    // Mutations & Actions
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    moveTaskMutation,
    resetForm,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,

    // Drag & Drop States
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,

    // Drag & Drop Handlers
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
