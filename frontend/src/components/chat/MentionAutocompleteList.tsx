import { Button } from "@/components/ui/button"
import { MENTION_PREFIX } from "@/config/entities/chat.config"
import type { MentionEmployeeItem, MentionProjectItem, MentionTaskItem } from "@/types/chat.types"

import { Briefcase, CheckSquare, User } from "lucide-react"

interface MentionAutocompleteListProps {
  activeTrigger: (typeof MENTION_PREFIX)[keyof typeof MENTION_PREFIX]
  mentionIndex: number
  employees: MentionEmployeeItem[]
  projects: MentionProjectItem[]
  tasks: MentionTaskItem[]
  isLoading: boolean
  onSelectEmployee: (employee: MentionEmployeeItem) => void
  onSelectProject: (project: MentionProjectItem) => void
  onSelectTask: (task: MentionTaskItem) => void
}

/** Renders the three mention result variants and keeps selection state prop-driven. */
export function MentionAutocompleteList({
  activeTrigger,
  mentionIndex,
  employees,
  projects,
  tasks,
  isLoading,
  onSelectEmployee,
  onSelectProject,
  onSelectTask,
}: MentionAutocompleteListProps) {
  return (
    <div className="absolute bottom-full left-4 z-50 mb-2 max-h-64 w-80 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {activeTrigger === MENTION_PREFIX.EMPLOYEE && (
            <>
              <User className="h-3.5 w-3.5 text-primary" /> Nhắc đến Nhân viên (@)
            </>
          )}
          {activeTrigger === MENTION_PREFIX.PROJECT && (
            <>
              <Briefcase className="h-3.5 w-3.5 text-blue-500" /> Gắn thẻ Dự án (#)
            </>
          )}
          {activeTrigger === MENTION_PREFIX.TASK && (
            <>
              <CheckSquare className="h-3.5 w-3.5 text-emerald-500" /> Gắn thẻ Công việc (!)
            </>
          )}
        </span>
        {isLoading && <span className="animate-spin text-xs">...</span>}
      </div>

      <div className="py-1">
        {activeTrigger === MENTION_PREFIX.EMPLOYEE &&
          (employees.length === 0 && !isLoading ? (
            <p className="px-3 py-2 text-center text-xs text-muted-foreground">
              Không tìm thấy nhân viên
            </p>
          ) : (
            employees.map((employee, index) => (
              <Button
                key={employee.id}
                type="button"
                variant={index === mentionIndex ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectEmployee(employee)}
                className="w-full justify-start gap-2 text-xs"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {employee.fullName.charAt(0)}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate">{employee.fullName}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    @{employee.username}
                  </span>
                </span>
              </Button>
            ))
          ))}

        {activeTrigger === MENTION_PREFIX.PROJECT &&
          (projects.length === 0 && !isLoading ? (
            <p className="px-3 py-2 text-center text-xs text-muted-foreground">
              Không tìm thấy dự án
            </p>
          ) : (
            projects.map((project, index) => (
              <Button
                key={project.id}
                type="button"
                variant={index === mentionIndex ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectProject(project)}
                className="w-full justify-start gap-2 text-xs"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                  <Briefcase className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate">{project.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {project.status}
                  </span>
                </span>
              </Button>
            ))
          ))}

        {activeTrigger === MENTION_PREFIX.TASK &&
          (tasks.length === 0 && !isLoading ? (
            <p className="px-3 py-2 text-center text-xs text-muted-foreground">
              Không tìm thấy công việc
            </p>
          ) : (
            tasks.map((task, index) => (
              <Button
                key={task.id}
                type="button"
                variant={index === mentionIndex ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectTask(task)}
                className="w-full justify-start gap-2 text-xs"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                  <CheckSquare className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate">{task.title}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {task.projectName ? `${task.projectName} • ` : ""}
                    {task.priority}
                  </span>
                </span>
              </Button>
            ))
          ))}
      </div>
    </div>
  )
}
