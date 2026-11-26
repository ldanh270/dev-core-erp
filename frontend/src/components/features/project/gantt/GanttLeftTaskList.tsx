import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Task, TaskSpentTime } from "@/types/task.types"

import { Clock, User } from "lucide-react"
import { Link } from "react-router-dom"

interface GanttLeftTaskListProps {
  treeTasks: (Task & { depth: number })[]
  showEstTime: boolean
  showAssignee: boolean
  onSelectTaskForReview: (task: Task) => void
}

/** Sticky left sidebar rendering the hierarchical task tree for the Gantt chart. */
export function GanttLeftTaskList({
  treeTasks,
  showEstTime,
  showAssignee,
  onSelectTaskForReview,
}: GanttLeftTaskListProps) {
  return (
    <div className="col-span-4 flex flex-col bg-muted/10">
      {/* Header */}
      <div className="h-16 border-b border-border/40 flex items-center px-4 bg-muted/20">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Công việc & Nhân sự
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {treeTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Chưa có công việc nào khớp với bộ lọc
          </div>
        ) : (
          treeTasks.map((task: Task & { depth: number }) => (
            <div
              key={task.id}
              className="h-16 flex items-center justify-between px-4 border-b border-border/40 hover:bg-muted/5 transition-colors"
            >
              <div
                className="flex flex-col min-w-0 pr-2"
                style={{ paddingLeft: `${task.depth * 16}px` }}
              >
                <div className="flex items-center text-[11px] font-normal text-foreground">
                  {task.depth > 0 && (
                    <span className="text-muted-foreground/45 font-mono select-none mr-1.5 shrink-0">
                      └─
                    </span>
                  )}
                  <button
                    onClick={() => {
                      onSelectTaskForReview(task)
                    }}
                    className="text-primary hover:underline font-normal shrink-0 mr-1 cursor-pointer"
                  >
                    {task.tracker
                      ? task.tracker.charAt(0).toUpperCase() + task.tracker.slice(1)
                      : "Task"}{" "}
                    #{task?.id ? task.id.slice(-5) : "—"}
                  </button>
                  <span className="truncate text-foreground" title={task.title}>
                    :{" "}
                    <Link
                      to={`/project/task/${task.id}`}
                      className="hover:text-primary hover:underline transition-colors cursor-pointer text-foreground"
                    >
                      {task.title}
                    </Link>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 pl-2">
                  {task.estimatedTime && showEstTime ? (
                    <div className="flex items-center gap-1 font-normal">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>
                        {task.spentTimes?.reduce(
                          (s: number, st: TaskSpentTime) => s + st.hours,
                          0,
                        ) || 0}
                        h / {task.estimatedTime}h
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Assignee profile avatar */}
              {showAssignee &&
                (task.assignee ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 bg-secondary border border-border/40 py-0.5 px-2 rounded-full text-[10px] font-normal cursor-default shrink-0">
                          <User className="size-2.5 text-muted-foreground" />
                          <span className="max-w-15 truncate">
                            {task.assignee.fullName.split(" ").pop()}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs rounded-xl">
                        <p className="font-semibold">{task.assignee.fullName}</p>
                        <p className="text-muted-foreground text-[10px]">{task.assignee.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic bg-secondary border border-dashed border-border/40 py-0.5 px-2 rounded-full shrink-0">
                    Chưa giao
                  </span>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
