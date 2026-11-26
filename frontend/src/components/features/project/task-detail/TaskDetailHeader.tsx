import { BackButton } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types/task.types"

import { Edit, Folder, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

interface TaskDetailHeaderProps {
  task: Task
  projectId: string
  siblingTasksLength: number
  currentTaskIndex: number
  prevTaskId: string | null
  nextTaskId: string | null
  canEditTask: boolean
  canDeleteTask: boolean
  onNavigateSibling: (targetId: string | null) => void
  onLogTime: () => void
  onOpenEdit: () => void
  onDeleteTask: () => void
}

/** Header presentation displaying task identity, badges, and action triggers. */
export function TaskDetailHeader({
  task,
  projectId,
  siblingTasksLength,
  currentTaskIndex,
  prevTaskId,
  nextTaskId,
  canEditTask,
  canDeleteTask,
  onNavigateSibling,
  onLogTime,
  onOpenEdit,
  onDeleteTask,
}: TaskDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <BackButton fallbackHref={projectId ? `/project/${projectId}/issues` : "/project/list"} />
        <div>
          <div className="flex w-full flex-wrap items-center justify-between gap-4 md:min-w-[450px]">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link
                to="/project/list"
                className="flex items-center gap-1 transition-colors hover:text-primary"
              >
                <Folder className="size-3.5" />
                Dự án
              </Link>
              <span>/</span>
              <Link
                to={`/project/${projectId}/overview`}
                className="font-semibold transition-colors hover:text-primary"
              >
                {task.project?.name || "Chi tiết dự án"}
              </Link>
              <span>/</span>
              <span className="font-mono text-muted-foreground">#{task.id.substring(0, 5)}</span>
            </div>

            {siblingTasksLength > 1 && (
              <div className="flex items-center gap-1 rounded-full border border-border/40 bg-secondary/50 px-2 py-0.5">
                <Button
                  variant="ghost"
                  disabled={!prevTaskId}
                  onClick={() => onNavigateSibling(prevTaskId)}
                  className="h-5 cursor-pointer px-1.5 text-[9px] font-bold hover:bg-background disabled:opacity-40"
                >
                  « Trước
                </Button>
                <span className="select-none px-1 font-mono text-[9px] text-muted-foreground">
                  {currentTaskIndex !== -1
                    ? `${currentTaskIndex + 1}/${siblingTasksLength}`
                    : "-"}
                </span>
                <Button
                  variant="ghost"
                  disabled={!nextTaskId}
                  onClick={() => onNavigateSibling(nextTaskId)}
                  className="h-5 cursor-pointer px-1.5 text-[9px] font-bold hover:bg-background disabled:opacity-40"
                >
                  Sau »
                </Button>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              {task.tracker}
            </Badge>
            <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onLogTime}
          size="default"
          className="gap-1.5 rounded-full font-semibold shadow-xs"
        >
          <Plus className="size-4" />
          Ghi nhận thời gian (Log Time)
        </Button>

        {canEditTask && (
          <Button
            onClick={onOpenEdit}
            variant="outline"
            size="default"
            className="gap-1.5 rounded-full border-border font-semibold shadow-xs hover:bg-muted/50"
          >
            <Edit className="size-4" />
            Chỉnh sửa
          </Button>
        )}

        {canDeleteTask && (
          <Button
            onClick={onDeleteTask}
            variant="destructive"
            size="default"
            className="cursor-pointer gap-1.5 rounded-full font-semibold shadow-xs"
          >
            <Trash2 className="size-4" />
            Xóa công việc
          </Button>
        )}
      </div>
    </div>
  )
}
