import { KANBAN_PALETTE_COLORS, DEFAULT_KANBAN_COLOR } from "@/config/entities/project.config"
import { useState, type DragEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { jobPostingApi, applicationApi } from "@/lib/api/recruitment.api"
import { extractErrorMessage } from "@/utils/error-helper"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

const colors = KANBAN_PALETTE_COLORS
export { colors as POSTING_STAGE_COLORS }

export function usePostingKanban(postingId: string, canManageStages: boolean) {
  const queryClient = useQueryClient()
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [isEditColumnOpen, setIsEditColumnOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [columnName, setColumnName] = useState("")
  const [columnColor, setColumnColor] = useState<string>(DEFAULT_KANBAN_COLOR)
  const [columnIsCompleted, setColumnIsCompleted] = useState(false)
  const [columnIsDefault, setColumnIsDefault] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<RecruitmentPipelineStage | null>(null)
  const [fallbackColumnId, setFallbackColumnId] = useState("")
  const [dragOverInfo, setDragOverInfo] = useState<{ taskId: string; position: "top" | "bottom" } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const stagesKey = ["recruitment", "posting-stages", postingId] as const
  const applicationsKey = ["recruitment", "posting-kanban", postingId] as const
  const stagesQuery = useQuery({ queryKey: stagesKey, queryFn: () => jobPostingApi.stages(postingId), enabled: Boolean(postingId) })
  const applicationsQuery = useQuery({ queryKey: applicationsKey, queryFn: () => applicationApi.listKanban({ postingId, pageSize: 1000 }), enabled: Boolean(postingId) })
  const { data: statuses = [], isLoading: isLoadingStatuses } = stagesQuery
  const { data: applicationResult, isLoading: isLoadingTasks } = applicationsQuery
  const tasks = (applicationResult?.data ?? []) as KanbanApplication[]
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: stagesKey })
    void queryClient.invalidateQueries({ queryKey: applicationsKey })
    void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
  }
  const resetForm = () => { setColumnName(""); setColumnColor(DEFAULT_KANBAN_COLOR); setColumnIsCompleted(false); setColumnIsDefault(false); setSelectedColumn(null); setFallbackColumnId("") }
  const createStatusMutation = useMutation({ mutationFn: () => jobPostingApi.createStage(postingId, { name: columnName.trim(), color: columnColor, isCompleted: columnIsCompleted, isDefault: columnIsDefault }), onSuccess: () => { refresh(); toast.success("Đã tạo cột trạng thái mới"); setIsAddColumnOpen(false); resetForm() }, onError: (error) => toast.error(extractErrorMessage(error)) })
  const updateStatusMutation = useMutation({ mutationFn: () => selectedColumn ? jobPostingApi.updateStage(postingId, selectedColumn.id, { name: columnName.trim(), color: columnColor, isCompleted: columnIsCompleted, isDefault: columnIsDefault }) : Promise.reject(new Error("No column selected")), onSuccess: () => { refresh(); toast.success("Đã cập nhật trạng thái"); setIsEditColumnOpen(false); resetForm() }, onError: (error) => toast.error(extractErrorMessage(error)) })
  const deleteStatusMutation = useMutation({ mutationFn: () => selectedColumn ? jobPostingApi.deleteStage(postingId, selectedColumn.id, fallbackColumnId) : Promise.reject(new Error("No column selected")), onSuccess: () => { refresh(); toast.success("Đã xóa cột trạng thái"); setIsDeleteConfirmOpen(false); resetForm() }, onError: (error) => toast.error(extractErrorMessage(error)) })
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) => jobPostingApi.moveApplicationStage(postingId, taskId, statusId),
    onMutate: async ({ taskId, statusId }) => { await queryClient.cancelQueries({ queryKey: applicationsKey }); const previousData = queryClient.getQueryData<typeof applicationResult>(applicationsKey); queryClient.setQueryData<typeof applicationResult>(applicationsKey, (old) => old ? { ...old, data: old.data.map((task) => task.id === taskId ? { ...task, pipelineStage: statuses.find((stage) => stage.id === statusId) ?? task.pipelineStage } : task) } : old); return { previousData } },
    onError: (error, _variables, context) => { if (context?.previousData) queryClient.setQueryData(applicationsKey, context.previousData); toast.error(extractErrorMessage(error)) },
    onSuccess: () => toast.success("Đã di chuyển ứng viên"), onSettled: refresh,
  })
  const handleReorderColumns = async (sourceId: string, targetId: string) => {
    const sourceIndex = statuses.findIndex((stage) => stage.id === sourceId); const targetIndex = statuses.findIndex((stage) => stage.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const ordered = [...statuses]; const [removed] = ordered.splice(sourceIndex, 1); ordered.splice(targetIndex, 0, removed)
    const updated = ordered.map((stage, position) => ({ ...stage, position })); const previous = queryClient.getQueryData<RecruitmentPipelineStage[]>(stagesKey)
    queryClient.setQueryData(stagesKey, updated)
    try { await jobPostingApi.reorderStages(postingId, updated.map((stage) => stage.id)); toast.success("Đã cập nhật thứ tự các cột") } catch (error) { if (previous) queryClient.setQueryData(stagesKey, previous); toast.error(extractErrorMessage(error)) } finally { void queryClient.invalidateQueries({ queryKey: stagesKey }) }
  }
  return { canManageStages, statuses, tasks, isLoadingStatuses, isLoadingTasks, isError: stagesQuery.isError || applicationsQuery.isError, refetch: () => { void stagesQuery.refetch(); void applicationsQuery.refetch() }, isAddColumnOpen, setIsAddColumnOpen, isEditColumnOpen, setIsEditColumnOpen, isDeleteConfirmOpen, setIsDeleteConfirmOpen, columnName, setColumnName, columnColor, setColumnColor, columnIsCompleted, setColumnIsCompleted, columnIsDefault, setColumnIsDefault, selectedColumn, setSelectedColumn, fallbackColumnId, setFallbackColumnId, dragOverInfo, setDragOverInfo, draggingTaskId, draggingColumnId, setDraggingColumnId, dragOverColumnId, setDragOverColumnId, createStatusMutation, updateStatusMutation, deleteStatusMutation, moveTaskMutation, resetForm, handleReorderColumns,
    handleDragStart: (event: DragEvent, task: KanbanApplication) => { event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.effectAllowed = "move"; setDraggingTaskId(task.id) },
    handleDragEnd: () => { setDragOverInfo(null); setDraggingTaskId(null) },
    handleCardDragOver: (event: DragEvent, taskId: string) => { if (draggingColumnId) return; event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setDragOverInfo({ taskId, position: event.clientY < rect.top + rect.height / 2 ? "top" : "bottom" }) },
    handleCardDrop: (event: DragEvent, target: KanbanApplication) => { if (draggingColumnId) return; event.preventDefault(); const taskId = event.dataTransfer.getData("text/plain"); setDragOverInfo(null); setDraggingTaskId(null); if (taskId && taskId !== target.id && target.pipelineStage?.id) moveTaskMutation.mutate({ taskId, statusId: target.pipelineStage.id }) },
    handleDrop: (event: DragEvent, stageId: string) => { event.preventDefault(); const taskId = event.dataTransfer.getData("text/plain"); setDragOverInfo(null); setDraggingTaskId(null); const task = tasks.find((item) => item.id === taskId); if (task && task.pipelineStage?.id !== stageId) moveTaskMutation.mutate({ taskId, statusId: stageId }) },
    handleColumnDragStart: (event: DragEvent, stageId: string) => { if (!canManageStages) { event.preventDefault(); return; } event.dataTransfer.setData("columnId", stageId); event.dataTransfer.effectAllowed = "move"; setDraggingColumnId(stageId) },
    handleColumnDragEnd: () => { setDraggingColumnId(null); setDragOverColumnId(null) },
    handleColumnDragOver: (event: DragEvent, stageId: string) => { if (!draggingColumnId || draggingColumnId === stageId) return; event.preventDefault(); setDragOverColumnId(stageId) },
    handleColumnDrop: (event: DragEvent, stageId: string) => { event.preventDefault(); const sourceId = event.dataTransfer.getData("columnId") || draggingColumnId; setDraggingColumnId(null); setDragOverColumnId(null); if (sourceId && sourceId !== stageId) void handleReorderColumns(sourceId, stageId) },
  }
}
