import { Button } from "@/components/ui/button"
import {
  CHAT_BUTTON_SIZE,
  CHAT_BUTTON_VARIANT,
  MENTION_PREFIX,
} from "@/config/entities/chat.config"
import type { MentionEmployeeItem, MentionProjectItem, MentionTaskItem } from "@/types/chat.types"

import { Briefcase, CheckSquare, User } from "lucide-react"

/**
 * Properties for rendering the multi-entity mention autocomplete suggestions popup.
 */
interface MentionAutocompleteListProps {
  /** The currently active trigger symbol (@ for employee, # for project, ! for task). */
  activeTrigger: (typeof MENTION_PREFIX)[keyof typeof MENTION_PREFIX]
  /** Zero-based index of the currently highlighted suggestion item for keyboard navigation. */
  mentionIndex: number
  /** List of matching employee suggestions when activeTrigger is '@'. */
  employees: MentionEmployeeItem[]
  /** List of matching project suggestions when activeTrigger is '#'. */
  projects: MentionProjectItem[]
  /** List of matching task suggestions when activeTrigger is '!'. */
  tasks: MentionTaskItem[]
  /** Whether autocomplete query search is actively fetching suggestions from the server. */
  isLoading: boolean
  /** Callback fired when an employee suggestion is selected by click or Enter key. */
  onSelectEmployee: (employee: MentionEmployeeItem) => void
  /** Callback fired when a project suggestion is selected by click or Enter key. */
  onSelectProject: (project: MentionProjectItem) => void
  /** Callback fired when a task suggestion is selected by click or Enter key. */
  onSelectTask: (task: MentionTaskItem) => void
}

/**
 * Renders an autocomplete popup list for mentions, dynamically displaying
 * matching employees (@), projects (#), or tasks (!) with keyboard navigation support.
 *
 * @param props - Properties conforming to {@link MentionAutocompleteListProps}.
 * @returns Rendered mention suggestion popover element.
 */
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
                variant={
                  index === mentionIndex ? CHAT_BUTTON_VARIANT.SECONDARY : CHAT_BUTTON_VARIANT.GHOST
                }
                size={CHAT_BUTTON_SIZE.SM}
                onClick={() => {
                  onSelectEmployee(employee)
                }}
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
                variant={
                  index === mentionIndex ? CHAT_BUTTON_VARIANT.SECONDARY : CHAT_BUTTON_VARIANT.GHOST
                }
                size={CHAT_BUTTON_SIZE.SM}
                onClick={() => {
                  onSelectProject(project)
                }}
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
                variant={
                  index === mentionIndex ? CHAT_BUTTON_VARIANT.SECONDARY : CHAT_BUTTON_VARIANT.GHOST
                }
                size={CHAT_BUTTON_SIZE.SM}
                onClick={() => {
                  onSelectTask(task)
                }}
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
