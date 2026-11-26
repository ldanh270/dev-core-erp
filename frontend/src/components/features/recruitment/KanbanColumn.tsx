import { CandidateCard } from "@/components/features/recruitment/CandidateCard"
import { Badge } from "@/components/ui/badge"

function DropIndicator({ className }: { className?: string }) {
  return (
    <div
      className={`mx-1 h-0.5 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)] ${className ?? ""}`}
    />
  )
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

import { MoreHorizontal, Sparkles } from "lucide-react"

interface KanbanColumnProps {
  stage: RecruitmentPipelineStage
  applications: KanbanApplication[]
  statuses: RecruitmentPipelineStage[]
  canManageStages: boolean
  draggingColumnId: string | null
  dragOverColumnId: string | null
  draggingTaskId: string | null
  dragOverInfo: { taskId: string; position: "top" | "bottom" } | null
  isMoving: boolean
  onColumnDragStart: (event: React.DragEvent, columnId: string) => void
  onColumnDragEnd: () => void
  onColumnDragOver: (event: React.DragEvent, columnId: string) => void
  onColumnDrop: (event: React.DragEvent, columnId: string) => void
  onColumnDragLeave: () => void
  onDrop: (event: React.DragEvent, columnId: string) => void
  onEditColumn: (stage: RecruitmentPipelineStage) => void
  onDeleteColumn: (stage: RecruitmentPipelineStage) => void
  onCardDragStart: (event: React.DragEvent, application: KanbanApplication) => void
  onCardDragEnd: () => void
  onCardDragOver: (event: React.DragEvent, taskId: string) => void
  onCardDrop: (event: React.DragEvent, application: KanbanApplication) => void
  onMoveApplication: (taskId: string, statusId: string) => void
  onApplicationClick: (applicationId: string) => void
  setDragOverInfo: (info: { taskId: string; position: "top" | "bottom" } | null) => void
}

/**
 * Pure UI presenter rendering an individual Kanban column, column action menus,
 * candidate cards list, and visual drag-over drop indicators.
 */
export function KanbanColumn({
  stage,
  applications,
  statuses,
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
  onApplicationClick,
  setDragOverInfo,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(event) => {
        if (draggingColumnId) onColumnDragOver(event, stage.id)
        else event.preventDefault()
      }}
      onDragLeave={onColumnDragLeave}
      onDrop={(event) => {
        if (canManageStages) {
          if (draggingColumnId) onColumnDrop(event, stage.id)
          else onDrop(event, stage.id)
        }
      }}
      className={`flex max-h-[700px] w-[290px] shrink-0 flex-col rounded-xl border border-border/60 bg-secondary/30 transition-all duration-200 hover:bg-secondary/40 ${
        draggingColumnId === stage.id
          ? "scale-[0.98] border-dashed border-muted-foreground/50 opacity-45"
          : ""
      } ${dragOverColumnId === stage.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""}`}
    >
      <div
        draggable={canManageStages}
        onDragStart={(event) => onColumnDragStart(event, stage.id)}
        onDragEnd={onColumnDragEnd}
        className={`flex items-center justify-between border-b border-border/50 p-3.5 ${
          canManageStages
            ? "cursor-grab rounded-t-xl transition-colors hover:bg-secondary/20 active:cursor-grabbing"
            : ""
        }`}
      >
        <div className="flex max-w-[200px] items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-full shadow-sm"
            style={{ backgroundColor: stage.color }}
          />
          <span className="truncate text-sm font-bold text-foreground">{stage.name}</span>
          <Badge
            variant="outline"
            className="rounded-full border-border/80 bg-background/50 px-1.5 py-0 text-[10px] font-bold"
          >
            {applications.length}
          </Badge>
        </div>
        {canManageStages && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
              <DropdownMenuItem
                onClick={() => onEditColumn(stage)}
                className="cursor-pointer rounded-lg text-xs font-semibold"
              >
                Cấu hình cột
              </DropdownMenuItem>
              {!stage.isDefault && statuses.length > 1 && (
                <DropdownMenuItem
                  onClick={() => onDeleteColumn(stage)}
                  className="cursor-pointer rounded-lg text-xs font-semibold text-destructive"
                >
                  Xóa cột
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        className="min-h-[150px] flex-1 space-y-3 overflow-y-auto p-2.5 scrollbar-thin"
        onDragOver={(event) => {
          if (canManageStages && !draggingColumnId) event.preventDefault()
        }}
        onDrop={(event) => {
          if (canManageStages && !draggingColumnId) onDrop(event, stage.id)
        }}
      >
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 py-10 text-center">
            <Sparkles className="mb-1 size-5 text-muted-foreground/30" />
            <p className="text-[10px] font-medium text-muted-foreground/60">Không có ứng viên</p>
          </div>
        ) : (
          applications.map((application) => (
            <div className="relative" key={application.id}>
              {dragOverInfo?.taskId === application.id && dragOverInfo.position === "top" && (
                <DropIndicator className="mb-1" />
              )}
              <CandidateCard
                application={application}
                stages={statuses}
                canManageStages={canManageStages}
                isMoving={isMoving}
                onMove={(statusId) => onMoveApplication(application.id, statusId)}
                isDragging={draggingTaskId === application.id}
                draggable={canManageStages}
                onDragStart={(event) => onCardDragStart(event, application)}
                onDragEnd={onCardDragEnd}
                onDragOver={(event) => onCardDragOver(event, application.id)}
                onDragLeave={() => setDragOverInfo(null)}
                onDrop={(event) => onCardDrop(event, application)}
                onClick={() => onApplicationClick(application.id)}
              />
              {dragOverInfo?.taskId === application.id && dragOverInfo.position === "bottom" && (
                <DropIndicator className="mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
