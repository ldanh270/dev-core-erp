import { Badge } from "@/components/ui/badge"
import { ROUTES } from "@/config/routes.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task.types"

import { Link } from "react-router-dom"

interface ProjectKanbanCardProps {
  task: Task
  isDragging: boolean
  dragOverPosition: "top" | "bottom" | null
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent, taskId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, task: Task) => void
}

function getPriorityColor(priority: string) {
  if (priority === "urgent") return "bg-destructive/10 text-destructive border-destructive/20"
  if (priority === "high") return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
  if (priority === "medium") return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
  return "bg-secondary text-secondary-foreground border-border"
}

function getTrackerColor(tracker: string) {
  if (tracker === "bug") return "bg-destructive/10 text-destructive border-destructive/20"
  if (tracker === "feature") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
  if (tracker === "support") return "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400"
  return "bg-secondary text-secondary-foreground border-border"
}

function getPriorityLabel(priority: string) {
  if (priority === "urgent") return "Khẩn cấp"
  if (priority === "high") return "Cao"
  if (priority === "medium") return "Trung bình"
  return "Thấp"
}

/** Draggable task card component displayed inside Kanban columns. */
export function ProjectKanbanCard({
  task,
  isDragging,
  dragOverPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: ProjectKanbanCardProps) {
  const priorityColor = getPriorityColor(task.priority)
  const trackerColor = getTrackerColor(task.tracker)

  return (
    <div className="relative">
      {dragOverPosition === "top" && (
        <div className="h-0.5 bg-primary rounded-full mx-1 mb-1 shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]" />
      )}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, task.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, task)}
        className={`bg-card border border-border/80 rounded-xl p-3.5 space-y-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group/card ${
          isDragging ? "opacity-40 scale-[0.98]" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`rounded-full text-xs px-2 py-0.5 font-semibold uppercase ${trackerColor}`}
          >
            {task.tracker}
          </Badge>
          <Badge
            variant="outline"
            className={`rounded-full text-xs px-2 py-0.5 font-semibold ${priorityColor}`}
          >
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        <Link
          to={`${ROUTES.PROJECT.TASK_DETAIL}/${task.id}`}
          className={cn(
            TYPOGRAPHY.BOARD_CARD_TITLE,
            "block group-hover/card:text-primary transition-colors line-clamp-2 hover:underline",
          )}
        >
          {task.title}
        </Link>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
          <span className={TYPOGRAPHY.CELL_CODE}>#{task.id.substring(0, 5)}</span>

          <div className="flex items-center gap-1.5 max-w-[150px]">
            {task.assignee ? (
              <span
                className={cn(TYPOGRAPHY.BOARD_CARD_SUB, "font-medium text-foreground max-w-[100px]")}
                title={task.assignee.fullName}
              >
                {task.assignee.fullName}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Chưa giao</span>
            )}
            <div className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
              {task.assignee ? task.assignee.fullName.substring(0, 1) : "?"}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Tiến độ</span>
            <span className="tabular-nums">{task.progress}%</span>
          </div>
          <div className="w-full bg-secondary/70 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      </div>
      {dragOverPosition === "bottom" && (
        <div className="h-0.5 bg-primary rounded-full mx-1 mt-1 shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]" />
      )}
    </div>
  )
}
