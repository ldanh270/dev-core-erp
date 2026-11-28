import type { KanbanApplication } from "@/types/recruitment.types"

import { type DragEvent, useState } from "react"

interface UseRecruitmentKanbanDndOptions {
  tasks: KanbanApplication[]
  canManageStages: boolean
  onMoveTask: (taskId: string, statusId: string) => void
  onReorderColumns: (sourceId: string, targetId: string) => void
}

/**
 * Handles HTML5 drag-and-drop state, coordinates calculation,
 * and column/card reordering callbacks for the recruitment Kanban board.
 */
export function useRecruitmentKanbanDnd({
  tasks,
  canManageStages,
  onMoveTask,
  onReorderColumns,
}: UseRecruitmentKanbanDndOptions) {
  const [dragOverInfo, setDragOverInfo] = useState<{
    taskId: string
    position: "top" | "bottom"
  } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

  const handleDragStart = (event: DragEvent, task: KanbanApplication) => {
    event.dataTransfer.setData("text/plain", task.id)
    event.dataTransfer.effectAllowed = "move"
    setDraggingTaskId(task.id)
  }

  const handleDragEnd = () => {
    setDragOverInfo(null)
    setDraggingTaskId(null)
  }

  const handleCardDragOver = (event: DragEvent, taskId: string) => {
    if (draggingColumnId) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setDragOverInfo({
      taskId,
      position: event.clientY < rect.top + rect.height / 2 ? "top" : "bottom",
    })
  }

  const handleCardDrop = (event: DragEvent, target: KanbanApplication) => {
    if (draggingColumnId) return
    event.preventDefault()
    const taskId = event.dataTransfer.getData("text/plain")
    setDragOverInfo(null)
    setDraggingTaskId(null)
    if (taskId && taskId !== target.id && target.pipelineStage?.id) {
      onMoveTask(taskId, target.pipelineStage.id)
    }
  }

  const handleDrop = (event: DragEvent, stageId: string) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData("text/plain")
    setDragOverInfo(null)
    setDraggingTaskId(null)
    const task = tasks.find((item) => item.id === taskId)
    if (task && task.pipelineStage?.id !== stageId) {
      onMoveTask(taskId, stageId)
    }
  }

  const handleColumnDragStart = (event: DragEvent, stageId: string) => {
    if (!canManageStages) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData("columnId", stageId)
    event.dataTransfer.effectAllowed = "move"
    setDraggingColumnId(stageId)
  }

  const handleColumnDragEnd = () => {
    setDraggingColumnId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragOver = (event: DragEvent, stageId: string) => {
    if (!draggingColumnId || draggingColumnId === stageId) return
    event.preventDefault()
    setDragOverColumnId(stageId)
  }

  const handleColumnDrop = (event: DragEvent, stageId: string) => {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData("columnId") || draggingColumnId
    setDraggingColumnId(null)
    setDragOverColumnId(null)
    if (sourceId && sourceId !== stageId) {
      onReorderColumns(sourceId, stageId)
    }
  }

  return {
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    setDraggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,
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
