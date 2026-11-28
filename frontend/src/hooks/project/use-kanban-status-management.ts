import { DEFAULT_KANBAN_COLOR } from "@/config/entities/project.config"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import type {
  CreateProjectTaskStatusDto,
  ProjectTaskStatus,
  UpdateProjectTaskStatusDto,
} from "@/types/project-task-status.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Hook to manage modal states, form data, and mutations for project Kanban columns (add, edit, delete).
 * @param projectId - Active project ID.
 */
export function useKanbanStatusManagement(projectId: string) {
  const queryClient = useQueryClient()

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const [columnName, setColumnName] = useState("")
  const [columnColor, setColumnColor] = useState<string>(DEFAULT_KANBAN_COLOR)
  const [columnIsCompleted, setColumnIsCompleted] = useState(false)
  const [columnIsDefault, setColumnIsDefault] = useState(false)

  const [selectedColumn, setSelectedColumn] = useState<ProjectTaskStatus | null>(null)
  const [fallbackColumnId, setFallbackColumnId] = useState<string>("")

  const resetForm = () => {
    setColumnName("")
    setColumnColor(DEFAULT_KANBAN_COLOR)
    setColumnIsCompleted(false)
    setColumnIsDefault(false)
    setSelectedColumn(null)
    setFallbackColumnId("")
  }

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

  return {
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
    resetForm,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
  }
}
