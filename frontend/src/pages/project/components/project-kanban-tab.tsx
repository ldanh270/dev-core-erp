import { BoardAddColumnCard, BoardColumn, BoardColumnHeader, BoardView } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { KANBAN_PALETTE_COLORS } from "@/config/entities/project.config"
import { ROUTES } from "@/config/routes.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { ProjectMember } from "@/types/project.types"
import type { Task } from "@/types/task.types"

import {
  AlertCircle,
  Check,
  FolderKanban,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"

import { useProjectKanban } from "../hooks/use-project-kanban"

interface ProjectKanbanTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role?: string
    fullName: string
  } | null
}

export function ProjectKanbanTab({ projectId, teamLeader, user }: ProjectKanbanTabProps) {
  const {
    canManageStatuses,

    // Modal States
    isAddColumnOpen,
    setIsAddColumnOpen,
    isEditColumnOpen,
    setIsEditColumnOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,

    // Form States
    columnName,
    setColumnName,
    columnColor,
    setColumnColor,
    columnIsCompleted,
    setColumnIsCompleted,
    columnIsDefault,
    setColumnIsDefault,

    // Selected Target States
    selectedColumn,
    setSelectedColumn,
    fallbackColumnId,
    setFallbackColumnId,

    // Queries
    statuses,
    isLoadingStatuses,
    isLoadingTasks,
    tasks,

    // Mutations & Actions
    createStatusMutation,
    updateStatusMutation,
    deleteStatusMutation,
    resetForm,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,

    // Drag & Drop States
    dragOverInfo,
    setDragOverInfo,
    draggingTaskId,
    draggingColumnId,
    dragOverColumnId,
    setDragOverColumnId,

    // Drag & Drop Handlers
    handleDragStart,
    handleDragEnd,
    handleCardDragOver,
    handleCardDrop,
    handleDrop,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDrop,
  } = useProjectKanban({ projectId, teamLeader, user })

  if (isLoadingStatuses || isLoadingTasks) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-secondary/40 rounded-xl p-4 space-y-3 min-w-[280px]">
            <Skeleton className="h-6 w-1/2 rounded-full" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // Pre-group tasks by statusId
  const tasksByStatus: Record<string, Task[]> = {}
  statuses.forEach((status) => {
    tasksByStatus[status.id] = []
  })

  // If a task doesn't have statusId but matches enum, try to find a column with similar name or assign to default status
  const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0]

  tasks.forEach((task) => {
    // When task has a statusId that maps to a known column, use it directly
    if (task.statusId && task.statusId in tasksByStatus) {
      tasksByStatus[task.statusId].push(task)
    } else {
      // Compatibility fallback: map task.status (legacy enum) to a column by name
      let mapped = false
      const normEnum = task.status.toLowerCase().replace(/[\s_-]/g, "")
      for (const s of statuses) {
        const normName = s.name.toLowerCase().replace(/[\s_-]/g, "")
        if (normName === normEnum) {
          tasksByStatus[s.id].push(task)
          mapped = true
          break
        }
      }
      if (!mapped && defaultStatus) {
        tasksByStatus[defaultStatus.id].push(task)
      }
    }
  })

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col">
      <BoardView
        layout="fixed"
        className="h-full min-h-0 flex-1"
        toolbarLeft={
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Kanban Board</h3>
              <p className="text-xs text-muted-foreground">
                Kéo thả để cập nhật tiến độ công việc động
              </p>
            </div>
          </div>
        }
        toolbarRight={
          canManageStatuses ? (
            <Button
              onClick={() => {
                resetForm()
                setIsAddColumnOpen(true)
              }}
              className="rounded-full text-xs font-bold gap-1 px-4 shadow-sm"
            >
              <Plus className="size-3.5" />
              Thêm cột trạng thái
            </Button>
          ) : undefined
        }
        footerText="Kéo thả thẻ để cập nhật trạng thái hoặc kéo thả tiêu đề cột để sắp xếp thứ tự"
      >
        {statuses.map((status) => {
          const colTasks = tasksByStatus[status.id]

          return (
            <BoardColumn
              key={status.id}
              scrollType="always"
              className={`w-[290px] h-full ${
                draggingColumnId === status.id
                  ? "opacity-45 scale-[0.98] border-dashed border-muted-foreground/50"
                  : ""
              } ${
                dragOverColumnId === status.id
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : ""
              }`}
              onDragOver={(e) => {
                if (draggingColumnId) {
                  handleColumnDragOver(e, status.id)
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
                  handleColumnDrop(e, status.id)
                } else {
                  handleDrop(e, status.id)
                }
              }}
              header={
                <div
                  draggable={canManageStatuses}
                  onDragStart={(e) => {
                    handleColumnDragStart(e, status.id)
                  }}
                  onDragEnd={handleColumnDragEnd}
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
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-border bg-popover"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedColumn(status)
                                setColumnName(status.name)
                                setColumnColor(status.color)
                                setColumnIsCompleted(status.isCompleted)
                                setColumnIsDefault(status.isDefault)
                                setIsEditColumnOpen(true)
                              }}
                              className="rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cấu hình cột
                            </DropdownMenuItem>
                            {!status.isDefault && statuses.length > 1 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedColumn(status)
                                  setFallbackColumnId(
                                    statuses.find((s) => s.id !== status.id)?.id || "",
                                  )
                                  setIsDeleteConfirmOpen(true)
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
                  <p className="text-[10px] font-medium text-muted-foreground/60">
                    Không có công việc
                  </p>
                </div>
              }
              bodyProps={{
                onDragOver: (e) => {
                  if (draggingColumnId) return
                  e.preventDefault()
                },
                onDrop: (e) => {
                  if (draggingColumnId) return
                  handleDrop(e, status.id)
                },
              }}
            >
              {colTasks.map((task) => {
                let priorityColor = "bg-secondary text-secondary-foreground border-border"
                if (task.priority === "urgent")
                  priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
                else if (task.priority === "high")
                  priorityColor =
                    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
                else if (task.priority === "medium")
                  priorityColor =
                    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"

                let trackerColor = "bg-secondary text-secondary-foreground border-border"
                if (task.tracker === "bug")
                  trackerColor = "bg-destructive/10 text-destructive border-destructive/20"
                else if (task.tracker === "feature")
                  trackerColor =
                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                else if (task.tracker === "support")
                  trackerColor = "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400"

                return (
                  <div key={task.id} className="relative">
                    {/* Drop indicator ABOVE this card */}
                    {dragOverInfo?.taskId === task.id && dragOverInfo.position === "top" && (
                      <div className="h-0.5 bg-primary rounded-full mx-1 mb-1 shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]" />
                    )}
                    <div
                      draggable="true"
                      onDragStart={(e) => {
                        handleDragStart(e, task)
                      }}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        handleCardDragOver(e, task.id)
                      }}
                      onDragLeave={() => {
                        setDragOverInfo(null)
                      }}
                      onDrop={(e) => {
                        handleCardDrop(e, task)
                      }}
                      className={`bg-card border border-border/80 rounded-xl p-3.5 space-y-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group/card ${
                        draggingTaskId === task.id ? "opacity-40 scale-[0.98]" : ""
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
                          {task.priority === "urgent"
                            ? "Khẩn cấp"
                            : task.priority === "high"
                              ? "Cao"
                              : task.priority === "medium"
                                ? "Trung bình"
                                : "Thấp"}
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
                              className={cn(
                                TYPOGRAPHY.BOARD_CARD_SUB,
                                "font-medium text-foreground max-w-[100px]",
                              )}
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

                      {/* Progress Bar inside card */}
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
                    {/* Drop indicator BELOW this card */}
                    {dragOverInfo?.taskId === task.id && dragOverInfo.position === "bottom" && (
                      <div className="h-0.5 bg-primary rounded-full mx-1 mt-1 shadow-[0_0_6px_2px_hsl(var(--primary)/0.4)]" />
                    )}
                  </div>
                )
              })}
            </BoardColumn>
          )
        })}

        {/* Add status column box using standard BoardAddColumnCard */}
        {canManageStatuses && (
          <BoardAddColumnCard
            onClick={() => {
              resetForm()
              setIsAddColumnOpen(true)
            }}
            label="Thêm cột trạng thái"
            className="w-[290px] h-full min-h-[160px]"
          />
        )}
      </BoardView>

      {/* CREATE COLUMN DIALOG */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Tạo cột trạng thái
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateColumn} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">
                Tên cột trạng thái
              </Label>
              <Input
                id="name"
                value={columnName}
                onChange={(e) => {
                  setColumnName(e.target.value)
                }}
                placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
                required
                className="h-9 text-xs border-border rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
              <div className="flex flex-wrap gap-2.5">
                {KANBAN_PALETTE_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setColumnColor(hex)
                    }}
                    className={`size-6 rounded-full border transition-all relative shrink-0 cursor-pointer ${
                      columnColor === hex
                        ? "scale-110 ring-2 ring-primary/45 border-transparent"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {columnColor === hex && (
                      <Check className="size-3 text-white absolute inset-0 m-auto font-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={columnIsCompleted}
                  onChange={(e) => {
                    setColumnIsCompleted(e.target.checked)
                  }}
                  className="size-4 text-primary border-border rounded"
                />
                Đánh dấu là cột hoàn thành (isCompleted)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={columnIsDefault}
                  onChange={(e) => {
                    setColumnIsDefault(e.target.checked)
                  }}
                  className="size-4 text-primary border-border rounded"
                />
                Trạng thái mặc định khi tạo issue (isDefault)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddColumnOpen(false)
                }}
                className="h-9 text-xs rounded-full"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createStatusMutation.isPending}
                className="h-9 text-xs rounded-full font-bold px-4"
              >
                Tạo cột
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT COLUMN DIALOG */}
      <Dialog open={isEditColumnOpen} onOpenChange={setIsEditColumnOpen}>
        <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              Cấu hình cột trạng thái
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateColumn} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold text-foreground">
                Tên cột trạng thái
              </Label>
              <Input
                id="edit-name"
                value={columnName}
                onChange={(e) => {
                  setColumnName(e.target.value)
                }}
                placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
                required
                className="h-9 text-xs border-border rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
              <div className="flex flex-wrap gap-2.5">
                {KANBAN_PALETTE_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setColumnColor(hex)
                    }}
                    className={`size-6 rounded-full border transition-all relative shrink-0 cursor-pointer ${
                      columnColor === hex
                        ? "scale-110 ring-2 ring-primary/45 border-transparent"
                        : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {columnColor === hex && (
                      <Check className="size-3 text-white absolute inset-0 m-auto font-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={columnIsCompleted}
                  onChange={(e) => {
                    setColumnIsCompleted(e.target.checked)
                  }}
                  className="size-4 text-primary border-border rounded"
                />
                Đánh dấu là cột hoàn thành (isCompleted)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={columnIsDefault}
                  onChange={(e) => {
                    setColumnIsDefault(e.target.checked)
                  }}
                  disabled={selectedColumn?.isDefault} // Cannot unset default unless setting another status
                  className="size-4 text-primary border-border rounded disabled:opacity-40"
                />
                Trạng thái mặc định khi tạo issue (isDefault)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditColumnOpen(false)
                }}
                className="h-9 text-xs rounded-full"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="h-9 text-xs rounded-full font-bold px-4"
              >
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              Xóa cột trạng thái?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Bạn đang yêu cầu xóa trạng thái{" "}
              <span className="font-bold text-foreground">&quot;{selectedColumn?.name}&quot;</span>.
              Các công việc thuộc cột này sẽ bị ảnh hưởng.
            </p>

            {/* Check if fallback status selection is needed */}
            {statuses.length > 1 && (
              <div className="space-y-2 bg-secondary/35 border border-border/50 rounded-xl p-3.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="size-3" />
                  Chuyển công việc hiện tại sang cột:
                </Label>
                <Select value={fallbackColumnId} onValueChange={setFallbackColumnId}>
                  <SelectTrigger className="w-full h-9 border-border rounded-full text-xs bg-background">
                    <SelectValue placeholder="Chọn cột thay thế..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {statuses
                      .filter((s) => s.id !== selectedColumn?.id)
                      .map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="rounded-lg text-xs font-semibold"
                        >
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false)
              }}
              className="h-9 text-xs rounded-full"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteColumn}
              disabled={
                deleteStatusMutation.isPending || (statuses.length > 1 && !fallbackColumnId)
              }
              className="h-9 text-xs rounded-full font-bold px-4"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
