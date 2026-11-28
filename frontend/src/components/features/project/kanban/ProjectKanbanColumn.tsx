import { BoardColumn, BoardColumnHeader } from "@/components/common"
import { ProjectKanbanCard } from "@/components/features/project/kanban/ProjectKanbanCard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { Task } from "@/types/task.types"

import { MoreHorizontal, Sparkles } from "lucide-react"

interface ProjectKanbanColumnProps {
  status: ProjectTaskStatus
  colTasks: Task[]
  statuses: ProjectTaskStatus[]
  canManageStatuses: boolean
  draggingColumnId: string | null
  dragOverColumnId: string | null
  draggingTaskId: string | null
  dragOverInfo: { taskId: string; position: "top" | "bottom" } | null
  onColumnDragOver: (e: React.DragEvent, statusId: string) => void
  onColumnDrop: (e: React.DragEvent, statusId: string) => void
  onDrop: (e: React.DragEvent, statusId: string) => void
  onColumnDragStart: (e: React.DragEvent, statusId: string) => void
  onColumnDragEnd: () => void
  setDragOverColumnId: (id: string | null) => void
  setDragOverInfo: (info: { taskId: string; position: "top" | "bottom" } | null) => void
  onOpenEditColumn: (status: ProjectTaskStatus) => void
  onOpenDeleteColumn: (status: ProjectTaskStatus) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: (e: React.DragEvent) => void
  onCardDragOver: (e: React.DragEvent, taskId: string) => void
  onCardDrop: (e: React.DragEvent, task: Task) => void
}

/** Droppable Kanban column container representing a workflow stage. */
export function ProjectKanbanColumn({
  status,
  colTasks,
  statuses,
  canManageStatuses,
  draggingColumnId,
  dragOverColumnId,
  draggingTaskId,
  dragOverInfo,
  onColumnDragOver,
  onColumnDrop,
  onDrop,
  onColumnDragStart,
  onColumnDragEnd,
  setDragOverColumnId,
  setDragOverInfo,
  onOpenEditColumn,
  onOpenDeleteColumn,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDrop,
}: ProjectKanbanColumnProps) {
  const isDraggingThisColumn = draggingColumnId === status.id
  const isDragOverThisColumn = dragOverColumnId === status.id

  return (
    <BoardColumn
      key={status.id}
      scrollType="always"
      className={`w-[290px] h-full ${
        isDraggingThisColumn
          ? "opacity-45 scale-[0.98] border-dashed border-muted-foreground/50"
          : ""
      } ${isDragOverThisColumn ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""}`}
      onDragOver={(e) => {
        if (draggingColumnId) {
          onColumnDragOver(e, status.id)
        } else {
          e.preventDefault()
        }
      }}
      onDragLeave={() => {
        if (draggingColumnId) {
          setDragOverColumnId(null)
        } else {
          setDragOverInfo(null)
        }
      }}
      onDrop={(e) => {
        if (draggingColumnId) {
          onColumnDrop(e, status.id)
        } else {
          onDrop(e, status.id)
        }
      }}
      header={
        <div
          draggable={canManageStatuses}
          onDragStart={(e) => {
            onColumnDragStart(e, status.id)
          }}
          onDragEnd={onColumnDragEnd}
          className={canManageStatuses ? "cursor-grab active:cursor-grabbing" : ""}
        >
          <BoardColumnHeader
            title={status.name}
            count={colTasks.length}
            dotColor={status.color}
            actions={
              canManageStatuses && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/40 transition-colors cursor-pointer">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                    <DropdownMenuItem
                      onClick={() => {
                        onOpenEditColumn(status)
                      }}
                      className="rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cấu hình cột
                    </DropdownMenuItem>
                    {!status.isDefault && statuses.length > 1 && (
                      <DropdownMenuItem
                        onClick={() => {
                          onOpenDeleteColumn(status)
                        }}
                        className="rounded-lg text-xs font-semibold text-destructive cursor-pointer"
                      >
                        Xóa cột
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }
          />
        </div>
      }
      isEmpty={colTasks.length === 0}
      emptyState={
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/40 rounded-xl w-full">
          <Sparkles className="size-5 text-muted-foreground/30 mb-1" />
          <p className="text-[10px] font-medium text-muted-foreground/60">Không có công việc</p>
        </div>
      }
      bodyProps={{
        onDragOver: (e) => {
          if (draggingColumnId) return
          e.preventDefault()
        },
        onDrop: (e) => {
          if (draggingColumnId) return
          onDrop(e, status.id)
        },
      }}
    >
      {colTasks.map((task) => (
        <ProjectKanbanCard
          key={task.id}
          task={task}
          isDragging={draggingTaskId === task.id}
          dragOverPosition={dragOverInfo?.taskId === task.id ? dragOverInfo.position : null}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onCardDragOver}
          onDragLeave={() => {
            setDragOverInfo(null)
          }}
          onDrop={onCardDrop}
        />
      ))}
    </BoardColumn>
  )
}
