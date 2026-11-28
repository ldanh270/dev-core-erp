import { KanbanBoardArea } from "@/components/features/recruitment/KanbanBoardArea"
import { KanbanDialogs } from "@/components/features/recruitment/KanbanDialogs"
import { groupApplicationsByStage } from "@/components/features/recruitment/kanban-utils"
import type { usePostingKanban } from "@/hooks/recruitment/use-posting-kanban"
import type { useRequisitionKanban } from "@/hooks/recruitment/use-requisition-kanban"

import { useMemo } from "react"

export type KanbanBoardHandle =
  ReturnType<typeof usePostingKanban> | ReturnType<typeof useRequisitionKanban>

/**
 * Props for {@link KanbanContent} component.
 */
export interface KanbanContentProps {
  /** Unified board controller handle from usePostingKanban or useRequisitionKanban. */
  board: KanbanBoardHandle
  /** Currently selected candidate application ID for detail drawer view. */
  selectedApplicationId: string | null
  /** Callback fired when candidate application selection transitions. */
  setSelectedApplicationId: (id: string | null) => void
  /** Whether the board is rendered embedded inside another page tab. */
  embedded?: boolean
}

/**
 * Pure UI presenter container combining the Kanban board columns,
 * drag-and-drop state delegates, and column management dialogs.
 */
export function KanbanContent({
  board,
  selectedApplicationId,
  setSelectedApplicationId,
  embedded = false,
}: KanbanContentProps) {
  const {
    canManageStages,
    statuses,
    tasks,
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
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    moveTaskMutation,
    resetForm,
    handleDragStart,
    handleDragEnd,
    handleCardDragOver,
    handleCardDrop,
    handleDrop,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDrop,
  } = board

  const applicationsByStageMap = useMemo(
    () => groupApplicationsByStage(statuses, tasks),
    [statuses, tasks],
  )

  const content = (
    <>
      <KanbanBoardArea
        statuses={statuses}
        applicationsByStageMap={applicationsByStageMap}
        canManageStages={canManageStages}
        draggingColumnId={draggingColumnId}
        dragOverColumnId={dragOverColumnId}
        draggingTaskId={draggingTaskId}
        dragOverInfo={dragOverInfo}
        isMoving={moveTaskMutation.isPending}
        onColumnDragStart={handleColumnDragStart}
        onColumnDragEnd={handleColumnDragEnd}
        onColumnDragOver={handleColumnDragOver}
        onColumnDrop={handleColumnDrop}
        onColumnDragLeave={() => {
          if (draggingColumnId) setDragOverColumnId(null)
          else setDragOverInfo(null)
        }}
        onDrop={handleDrop}
        onEditColumn={(s) => {
          setSelectedColumn(s)
          setColumnName(s.name)
          setColumnColor(s.color)
          setColumnIsCompleted(s.isCompleted)
          setColumnIsDefault(s.isDefault)
          setIsEditColumnOpen(true)
        }}
        onDeleteColumn={(s) => {
          setSelectedColumn(s)
          setFallbackColumnId(statuses.find((item) => item.id !== s.id)?.id ?? "")
          setIsDeleteConfirmOpen(true)
        }}
        onCardDragStart={handleDragStart}
        onCardDragEnd={handleDragEnd}
        onCardDragOver={handleCardDragOver}
        onCardDrop={handleCardDrop}
        onMoveApplication={(taskId, statusId) => {
          moveTaskMutation.mutate({ taskId, statusId })
        }}
        setDragOverInfo={setDragOverInfo}
        onAddColumnClick={() => {
          resetForm()
          setIsAddColumnOpen(true)
        }}
      />

      <KanbanDialogs
        isAddColumnOpen={isAddColumnOpen}
        setIsAddColumnOpen={setIsAddColumnOpen}
        isEditColumnOpen={isEditColumnOpen}
        setIsEditColumnOpen={setIsEditColumnOpen}
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        columnName={columnName}
        setColumnName={setColumnName}
        columnColor={columnColor}
        setColumnColor={setColumnColor}
        columnIsCompleted={columnIsCompleted}
        setColumnIsCompleted={setColumnIsCompleted}
        columnIsDefault={columnIsDefault}
        setColumnIsDefault={setColumnIsDefault}
        selectedColumn={selectedColumn}
        fallbackColumnId={fallbackColumnId}
        setFallbackColumnId={setFallbackColumnId}
        statuses={statuses}
        selectedApplicationId={selectedApplicationId}
        setSelectedApplicationId={setSelectedApplicationId}
        onCreateStatus={() => createStatusMutation.mutate()}
        onUpdateStatus={() => updateStatusMutation.mutate()}
        onDeleteStatus={() => deleteStatusMutation.mutate()}
        isCreating={createStatusMutation.isPending}
        isUpdating={updateStatusMutation.isPending}
        isDeleting={deleteStatusMutation.isPending}
      />
    </>
  )

  if (embedded) {
    return <div className="space-y-6">{content}</div>
  }

  return content
}
