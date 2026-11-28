import type { Task } from "@/types/task.types"

import { ClipboardList, Clock, ExternalLink, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { TaskContextAssigneeSubmenu } from "./TaskContextAssigneeSubmenu"
import { TaskContextAttributesSubmenus } from "./TaskContextAttributesSubmenus"
import { TaskContextMenuSubmenu } from "./TaskContextMenuSubmenu"
import { DEFAULT_STATUSES } from "./task-context-menu.constants"
import { useContextMenuPosition } from "./use-context-menu-position"

export interface TaskContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  task: Task | null
  projectMembers?: Array<{
    id: string
    employeeId: string
    employee?: { fullName: string; email: string }
  }>
  statuses?: Array<{ id: string; name: string; isCompleted: boolean }>
  onClose: () => void
  onUpdateTask: (data: Record<string, unknown>) => void
  onLogTime: (task: { id: string; title: string }) => void
}

/** Context menu popover providing rapid inline actions and attribute modifications for tasks. */
export function TaskContextMenu({
  isOpen,
  x,
  y,
  task,
  projectMembers = [],
  statuses = [],
  onClose,
  onUpdateTask,
  onLogTime,
}: TaskContextMenuProps) {
  const { menuRef, pos } = useContextMenuPosition({
    isOpen,
    x,
    y,
    enabled: Boolean(task),
    onClose,
  })

  if (!isOpen || !task) return null

  const displayStatuses = statuses.length > 0 ? statuses : DEFAULT_STATUSES

  return (
    <div
      ref={menuRef}
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
      className="fixed z-[9999] w-48 bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 text-xs space-y-0.5 transition-all duration-75 select-none backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {/* Submenu: Trạng thái */}
      <TaskContextMenuSubmenu
        label="Trạng thái"
        icon={<ClipboardList size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={pos.flipLeft}
        flipUp={pos.flipUp}
        dropdownClassName="min-w-[140px] max-h-[220px] overflow-y-auto"
      >
        {displayStatuses.map((st) => {
          const isActive =
            statuses.length > 0
              ? task.statusId === st.id || task.status === st.id
              : task.status === st.id
          return (
            <button
              type="button"
              key={st.id}
              onClick={() => {
                onUpdateTask(statuses.length > 0 ? { statusId: st.id } : { status: st.id })
                onClose()
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
            >
              <span>{st.name}</span>
              {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
            </button>
          )
        })}
      </TaskContextMenuSubmenu>

      <TaskContextAttributesSubmenus
        task={task}
        flipLeft={pos.flipLeft}
        flipUp={pos.flipUp}
        onUpdateTask={onUpdateTask}
        onClose={onClose}
      />

      <TaskContextAssigneeSubmenu
        task={task}
        projectMembers={projectMembers}
        flipLeft={pos.flipLeft}
        flipUp={pos.flipUp}
        onUpdateTask={onUpdateTask}
        onClose={onClose}
      />

      <div className="h-px bg-border/60 my-1" />

      {/* Action: Log Time */}
      <button
        type="button"
        onClick={() => {
          onLogTime({ id: task.id, title: task.title })
          onClose()
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer text-left"
      >
        <Clock size={13} className="shrink-0 text-muted-foreground" />
        <span>Ghi nhận thời gian</span>
      </button>

      {/* Action: Add Subtask */}
      <Link
        to={`/project/${task.projectId}/task/new`}
        onClick={() => {
          sessionStorage.setItem("activeProjectId", task.projectId)
          sessionStorage.setItem("parentTaskId", task.id)
          onClose()
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground hover:no-underline"
      >
        <Plus size={13} className="shrink-0 text-muted-foreground" />
        <span>Thêm công việc con</span>
      </Link>

      {/* Action: Copy Link */}
      <button
        type="button"
        onClick={() => {
          const link = `${window.location.origin}/project/task/${task.id}`
          void navigator.clipboard.writeText(link)
          toast.success("Đã sao chép liên kết vào bộ nhớ tạm")
          onClose()
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer text-left"
      >
        <ExternalLink size={13} className="shrink-0 text-muted-foreground" />
        <span>Sao chép liên kết</span>
      </button>
    </div>
  )
}
