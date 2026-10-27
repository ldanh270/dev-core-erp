import { useEffect, useRef, useState } from "react"
import {
  ClipboardList,
  ExternalLink,
  Folder,
  User,
  Plus,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import type { Task } from "@/types/task.types"

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

/**
 * Reusable, auto-positioning Task Context Menu Component.
 * Automatically adjusts its position (upward/downward, left/right)
 * and submenu directions to stay within the visible viewport bounds.
 */
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
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: y, left: x, flipUp: false, flipLeft: false })

  useEffect(() => {
    if (!isOpen || !task) return

    const menuWidth = 196
    const menuHeight = 360

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let calculatedLeft = x
    let calculatedTop = y
    let flipUp = false
    let flipLeft = false

    // Check bottom overflow -> shift position upward
    if (y + menuHeight > viewportHeight) {
      calculatedTop = Math.max(10, viewportHeight - menuHeight - 15)
      flipUp = true
    }

    // Check right overflow -> shift position leftward
    if (x + menuWidth > viewportWidth) {
      calculatedLeft = Math.max(10, viewportWidth - menuWidth - 15)
      flipLeft = true
    }

    setPos({ top: calculatedTop, left: calculatedLeft, flipUp, flipLeft })
  }, [isOpen, x, y, task])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleScrollOrResize = () => {
      onClose()
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
      window.addEventListener("scroll", handleScrollOrResize, true)
      window.addEventListener("resize", handleScrollOrResize)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  // Helper arrays for trackers & priorities
  const trackerOptions = [
    { label: "Lỗi (Bug)", value: "bug" },
    { label: "Tính năng", value: "feature" },
    { label: "Hỗ trợ", value: "support" },
    { label: "Nhiệm vụ", value: "task" },
  ]

  const priorityOptions = [
    { label: "Thấp", value: "low" },
    { label: "Trung bình", value: "medium" },
    { label: "Cao", value: "high" },
    { label: "Khẩn cấp", value: "urgent" },
  ]

  const progressOptions = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]

  // Submenu position classes based on screen flipping bounds
  const submenuPosClass = pos.flipLeft
    ? "right-full top-0 -mr-2 pr-3"
    : "left-full top-0 -ml-2 pl-3"

  const submenuAlignClass = pos.flipUp ? "bottom-0 top-auto" : "top-0"

  return (
    <div
      ref={menuRef}
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
      className="fixed z-[9999] w-48 bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 text-xs space-y-0.5 transition-all duration-75 select-none backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {/* Submenu: Status */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ClipboardList size={13} className="shrink-0 text-muted-foreground" />
            <span>Trạng thái</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[140px] max-h-[220px] overflow-y-auto ${submenuAlignClass}`}
          >
            {statuses.length > 0 ? (
              statuses.map((st) => {
                const isActive = task.statusId === st.id || task.status === st.id
                return (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => {
                      onUpdateTask({ statusId: st.id })
                      onClose()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span>{st.name}</span>
                    {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                  </button>
                )
              })
            ) : (
              [
                { id: "todo", name: "Đang mở" },
                { id: "in_progress", name: "Đang làm" },
                { id: "in_review", name: "Đánh giá" },
                { id: "done", name: "Hoàn thành" },
                { id: "cancelled", name: "Đã hủy" },
              ].map((st) => {
                const isActive = task.status === st.id
                return (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => {
                      onUpdateTask({ status: st.id })
                      onClose()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-xs transition-colors font-medium text-foreground cursor-pointer flex items-center justify-between"
                  >
                    <span>{st.name}</span>
                    {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Submenu: Tracker */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Folder size={13} className="shrink-0 text-muted-foreground" />
            <span>Loại công việc</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[130px] ${submenuAlignClass}`}
          >
            {trackerOptions.map((tr) => {
              const isActive = task.tracker === tr.value
              return (
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
                  {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submenu: Priority */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus size={13} className="shrink-0 text-muted-foreground" />
            <span>Độ ưu tiên</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[130px] ${submenuAlignClass}`}
          >
            {priorityOptions.map((pr) => {
              const isActive = task.priority === pr.value
              return (
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
                  {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submenu: Assignee */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <User size={13} className="shrink-0 text-muted-foreground" />
            <span>Người thực hiện</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto ${submenuAlignClass}`}
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
            {projectMembers.map((m) => {
              const isActive = task.assigneeId === m.employeeId
              return (
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
                  {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submenu: Progress */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ClipboardList size={13} className="shrink-0 text-muted-foreground" />
            <span>Tiến độ (%)</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[110px] max-h-[200px] overflow-y-auto ${submenuAlignClass}`}
          >
            {progressOptions.map((p) => {
              const isActive = task.progress === Number(p)
              return (
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
                  {isActive && <span className="text-[10px] font-bold text-primary">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submenu: Watchers */}
      <div className="relative group/sub">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Eye size={13} className="shrink-0 text-muted-foreground" />
            <span>Người theo dõi</span>
          </span>
          <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
        </button>
        <div
          className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}
        >
          <div
            className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto ${submenuAlignClass}`}
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
          </div>
        </div>
      </div>

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
          const link = window.location.origin + `/project/task/${task.id}`
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
