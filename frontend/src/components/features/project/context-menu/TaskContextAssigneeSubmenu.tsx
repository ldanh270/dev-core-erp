import { Eye, User } from "lucide-react"
import { toast } from "sonner"
import { TaskContextMenuSubmenu } from "./TaskContextMenuSubmenu"
import type { Task } from "@/types/task.types"

interface ProjectMember {
  id: string
  employeeId: string
  employee?: { fullName: string; email: string }
}

interface TaskContextAssigneeSubmenuProps {
  task: Task
  projectMembers: ProjectMember[]
  flipLeft?: boolean
  flipUp?: boolean
  onUpdateTask: (data: Record<string, unknown>) => void
  onClose: () => void
}

/** Submenu for quick reassignment of task assignee via context menu. */
export function TaskContextAssigneeSubmenu({
  task,
  projectMembers,
  flipLeft,
  flipUp,
  onUpdateTask,
  onClose,
}: TaskContextAssigneeSubmenuProps) {
  return (
    <>
      {/* Submenu: Assignee */}
      <TaskContextMenuSubmenu
        label="Người thực hiện"
        icon={<User size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={flipLeft}
        flipUp={flipUp}
        dropdownClassName="min-w-[160px] max-h-[200px] overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => {
            onUpdateTask({ assigneeId: null })
            onClose()
          }}
          className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between border-b border-border/40 pb-1"
        >
          <span>Chưa phân công</span>
          {!task.assigneeId && <span className="text-[10px] font-bold text-primary">✓</span>}
        </button>
        {projectMembers.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => {
              onUpdateTask({ assigneeId: m.employeeId })
              onClose()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
          >
            <span className="truncate">{m.employee?.fullName || "Chưa rõ"}</span>
            {task.assigneeId === m.employeeId && (
              <span className="text-[10px] font-bold text-primary">✓</span>
            )}
          </button>
        ))}
      </TaskContextMenuSubmenu>

      {/* Submenu: Watchers */}
      <TaskContextMenuSubmenu
        label="Người theo dõi"
        icon={<Eye size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={flipLeft}
        flipUp={flipUp}
        dropdownClassName="min-w-[160px] max-h-[200px] overflow-y-auto"
      >
        {projectMembers.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => {
              if (m.employee?.fullName) {
                toast.success(`Đang theo dõi bởi: ${m.employee.fullName}`)
              }
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer truncate"
          >
            {m.employee?.fullName || "Chưa rõ"}
          </button>
        ))}
      </TaskContextMenuSubmenu>
    </>
  )
}
