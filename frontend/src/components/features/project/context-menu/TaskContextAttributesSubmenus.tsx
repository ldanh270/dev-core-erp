import { ClipboardList, Folder, Plus } from "lucide-react"
import { TaskContextMenuSubmenu } from "./TaskContextMenuSubmenu"
import {
  TRACKER_OPTIONS,
  PRIORITY_OPTIONS,
  PROGRESS_OPTIONS,
} from "./task-context-menu.constants"
import type { Task } from "@/types/task.types"

interface TaskContextAttributesSubmenusProps {
  task: Task
  flipLeft?: boolean
  flipUp?: boolean
  onUpdateTask: (data: Record<string, unknown>) => void
  onClose: () => void
}

/** Submenus for modifying task attributes (tracker, status, priority, progress) via context menu. */
export function TaskContextAttributesSubmenus({
  task,
  flipLeft,
  flipUp,
  onUpdateTask,
  onClose,
}: TaskContextAttributesSubmenusProps) {
  return (
    <>
      {/* Submenu: Tracker */}
      <TaskContextMenuSubmenu
        label="Loại công việc"
        icon={<Folder size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={flipLeft}
        flipUp={flipUp}
      >
        {TRACKER_OPTIONS.map((tr) => (
          <button
            type="button"
            key={tr.value}
            onClick={() => {
              onUpdateTask({ tracker: tr.value })
              onClose()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
          >
            <span>{tr.label}</span>
            {task.tracker === tr.value && (
              <span className="text-[10px] font-bold text-primary">✓</span>
            )}
          </button>
        ))}
      </TaskContextMenuSubmenu>

      {/* Submenu: Priority */}
      <TaskContextMenuSubmenu
        label="Độ ưu tiên"
        icon={<Plus size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={flipLeft}
        flipUp={flipUp}
      >
        {PRIORITY_OPTIONS.map((pr) => (
          <button
            type="button"
            key={pr.value}
            onClick={() => {
              onUpdateTask({ priority: pr.value })
              onClose()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
          >
            <span>{pr.label}</span>
            {task.priority === pr.value && (
              <span className="text-[10px] font-bold text-primary">✓</span>
            )}
          </button>
        ))}
      </TaskContextMenuSubmenu>

      {/* Submenu: Progress */}
      <TaskContextMenuSubmenu
        label="Tiến độ (%)"
        icon={<ClipboardList size={13} className="shrink-0 text-muted-foreground" />}
        flipLeft={flipLeft}
        flipUp={flipUp}
        dropdownClassName="min-w-[110px] max-h-[200px] overflow-y-auto"
      >
        {PROGRESS_OPTIONS.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => {
              onUpdateTask({ progress: Number(p) })
              onClose()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between font-mono"
          >
            <span>{p} %</span>
            {task.progress === Number(p) && (
              <span className="text-[10px] font-bold text-primary">✓</span>
            )}
          </button>
        ))}
      </TaskContextMenuSubmenu>
    </>
  )
}
