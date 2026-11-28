import { KanbanColumn } from "@/components/features/recruitment/KanbanColumn"
import { routerNavigate } from "@/lib/router-navigator"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

import type { DragEvent } from "react"

import { Plus } from "lucide-react"

interface KanbanBoardAreaProps {
  statuses: RecruitmentPipelineStage[]
  applicationsByStageMap: Map<string, KanbanApplication[]>
  canManageStages: boolean
  draggingColumnId: string | null
  dragOverColumnId: string | null
  draggingTaskId: string | null
  dragOverInfo: { taskId: string; position: "top" | "bottom" } | null
  isMoving: boolean
  onColumnDragStart: (event: DragEvent, columnId: string) => void
  onColumnDragEnd: () => void
  onColumnDragOver: (event: DragEvent, columnId: string) => void
  onColumnDrop: (event: DragEvent, columnId: string) => void
  onColumnDragLeave: () => void
  onDrop: (event: DragEvent, columnId: string) => void
  onEditColumn: (stage: RecruitmentPipelineStage) => void
  onDeleteColumn: (stage: RecruitmentPipelineStage) => void
  onCardDragStart: (event: DragEvent, application: KanbanApplication) => void
  onCardDragEnd: () => void
  onCardDragOver: (event: DragEvent, taskId: string) => void
  onCardDrop: (event: DragEvent, application: KanbanApplication) => void
  onMoveApplication: (taskId: string, statusId: string) => void
  setDragOverInfo: (info: { taskId: string; position: "top" | "bottom" } | null) => void
  onAddColumnClick: () => void
}

/**
 * Pure presentational board area rendering responsive Kanban columns,
 * handling drag-over placeholders, and delegating drag-and-drop events.
 */
export function KanbanBoardArea({
  statuses,
  applicationsByStageMap,
  canManageStages,
  draggingColumnId,
  dragOverColumnId,
  draggingTaskId,
  dragOverInfo,
  isMoving,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragLeave,
  onDrop,
  onEditColumn,
  onDeleteColumn,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDrop,
  onMoveApplication,
  setDragOverInfo,
  onAddColumnClick,
}: KanbanBoardAreaProps) {
  return (
    <div className="flex min-h-[500px] select-none items-start gap-5 overflow-x-auto pb-6">
      {statuses.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          applications={applicationsByStageMap.get(stage.id) ?? []}
          statuses={statuses}
          canManageStages={canManageStages}
          draggingColumnId={draggingColumnId}
          dragOverColumnId={dragOverColumnId}
          draggingTaskId={draggingTaskId}
          dragOverInfo={dragOverInfo}
          isMoving={isMoving}
          onColumnDragStart={onColumnDragStart}
          onColumnDragEnd={onColumnDragEnd}
          onColumnDragOver={onColumnDragOver}
          onColumnDrop={onColumnDrop}
          onColumnDragLeave={onColumnDragLeave}
          onDrop={onDrop}
          onEditColumn={onEditColumn}
          onDeleteColumn={onDeleteColumn}
          onCardDragStart={onCardDragStart}
          onCardDragEnd={onCardDragEnd}
          onCardDragOver={onCardDragOver}
          onCardDrop={onCardDrop}
          onMoveApplication={onMoveApplication}
          onApplicationClick={(appId) => {
            routerNavigate(`/recruitment/applications/${appId}`)
          }}
          setDragOverInfo={setDragOverInfo}
        />
      ))}
      {canManageStages && (
        <div
          onClick={onAddColumnClick}
          className="group flex h-[150px] w-[290px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 text-muted-foreground transition-all hover:border-primary/60 hover:bg-secondary/10 hover:text-primary"
        >
          <Plus className="mb-2 size-6 text-muted-foreground/60 transition-colors group-hover:text-primary" />
          <span className="text-xs font-bold">Thêm cột trạng thái</span>
        </div>
      )}
    </div>
  )
}
