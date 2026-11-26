import { BoardAddColumnCard, BoardView } from "@/components/common"
import { ProjectKanbanColumn } from "@/components/features/project/kanban/ProjectKanbanColumn"
import { ProjectKanbanDialogs } from "@/components/features/project/kanban/ProjectKanbanDialogs"
import { groupTasksByStatus } from "@/components/features/project/kanban/project-kanban-utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProjectMember } from "@/types/project.types"

function ProjectKanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-secondary/40 rounded-xl p-4 space-y-3 min-w-[280px]">
          <Skeleton className="h-6 w-1/2 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

import { useMemo } from "react"

import { FolderKanban, Plus } from "lucide-react"

import { useProjectKanban } from '@/hooks/project/use-project-kanban'

interface ProjectKanbanTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role?: string
    fullName: string
  } | null
}

/** Kanban board workspace rendering columns, drag-and-drop cards, and workflow controls. */
export function ProjectKanbanTab({ projectId, teamLeader, user }: ProjectKanbanTabProps) {
  const {
    canManageStatuses,
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
    statuses,
    isLoadingStatuses,
    isLoadingTasks,
    tasks,
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    resetForm,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
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
  } = useProjectKanban({ projectId, teamLeader, user })

  const tasksByStatus = useMemo(
    () => groupTasksByStatus(statuses, tasks),
    [statuses, tasks],
  )

  if (isLoadingStatuses || isLoadingTasks) {
    return <ProjectKanbanSkeleton />
  }

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col">
      <BoardView
        layout="fixed"
        className="h-full min-h-0 flex-1"
        toolbarLeft={
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Kanban Board</h3>
              <p className="text-xs text-muted-foreground">
                Kéo thả để cập nhật tiến độ công việc động
              </p>
            </div>
          </div>
        }
        toolbarRight={
          canManageStatuses ? (
            <Button
              onClick={() => {
                resetForm()
                setIsAddColumnOpen(true)
              }}
              className="rounded-full text-xs font-bold gap-1 px-4 shadow-sm"
            >
              <Plus className="size-3.5" />
              Thêm cột trạng thái
            </Button>
          ) : undefined
        }
        footerText="Kéo thả thẻ để cập nhật trạng thái hoặc kéo thả tiêu đề cột để sắp xếp thứ tự"
      >
        {statuses.map((status) => (
          <ProjectKanbanColumn
            key={status.id}
            status={status}
            colTasks={tasksByStatus[status.id] || []}
            statuses={statuses}
            canManageStatuses={canManageStatuses}
            draggingColumnId={draggingColumnId}
            dragOverColumnId={dragOverColumnId}
            draggingTaskId={draggingTaskId}
            dragOverInfo={dragOverInfo}
            onColumnDragOver={handleColumnDragOver}
            onColumnDrop={handleColumnDrop}
            onDrop={handleDrop}
            onColumnDragStart={handleColumnDragStart}
            onColumnDragEnd={handleColumnDragEnd}
            setDragOverColumnId={setDragOverColumnId}
            setDragOverInfo={setDragOverInfo}
            onOpenEditColumn={(s) => {
              setSelectedColumn(s)
              setColumnName(s.name)
              setColumnColor(s.color)
              setColumnIsCompleted(s.isCompleted)
              setColumnIsDefault(s.isDefault)
              setIsEditColumnOpen(true)
            }}
            onOpenDeleteColumn={(s) => {
              setSelectedColumn(s)
              setFallbackColumnId(statuses.find((item) => item.id !== s.id)?.id || "")
              setIsDeleteConfirmOpen(true)
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onCardDragOver={handleCardDragOver}
            onCardDrop={handleCardDrop}
          />
        ))}

        {canManageStatuses && (
          <BoardAddColumnCard
            onClick={() => {
              resetForm()
              setIsAddColumnOpen(true)
            }}
            label="Thêm cột trạng thái"
            className="w-[290px] h-full min-h-[160px]"
          />
        )}
      </BoardView>

      <ProjectKanbanDialogs
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
        handleCreateColumn={handleCreateColumn}
        handleUpdateColumn={handleUpdateColumn}
        handleDeleteColumn={handleDeleteColumn}
        isCreating={createStatusMutation.isPending}
        isUpdating={updateStatusMutation.isPending}
        isDeleting={deleteStatusMutation.isPending}
      />
    </div>
  )
}

