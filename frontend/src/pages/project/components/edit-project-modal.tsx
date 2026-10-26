import { useConfirm } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PROJECT_STATUSES, TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import {
  useCreateProjectTracker,
  useDeleteProjectTracker,
  useProjectTrackers,
  useUpdateProjectTracker,
} from "@/pages/project/hooks/use-project-tracker"
import type { Employee } from "@/types/employee.types"
import type { Project } from "@/types/project.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { startTransition, useEffect, useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, CheckSquare, ChevronDown, Edit2, Plus, Square, Trash2, X } from "lucide-react"
import { toast } from "sonner"

/**
 * Properties for EditProjectModal component.
 */
interface EditProjectModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  project: Project
  allEmployees: Employee[]
}

const SELECT_NONE_VALUE = "none"

const PROJECT_STATUS_LABELS = new Map<string, string>([
  ["planning", "Lên kế hoạch"],
  ["active", "Đang hoạt động"],
  ["on_hold", "Tạm dừng"],
  ["completed", "Hoàn thành"],
  ["cancelled", "Đã hủy"],
])

/**
 * Modal dialog component for editing project properties: metadata, leadership,
 * task creation policies, and custom project-scoped task trackers.
 */
export function EditProjectModal({
  isOpen,
  onOpenChange,
  projectId,
  project,
  allEmployees,
}: EditProjectModalProps) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDesc, setEditProjectDesc] = useState("")
  const [editProjectStatus, setEditProjectStatus] = useState("")
  const [editProjectPolicy, setEditProjectPolicy] = useState("")
  const [editProjectLeader, setEditProjectLeader] = useState(SELECT_NONE_VALUE)
  const [editProjectStart, setEditProjectStart] = useState("")
  const [editProjectEnd, setEditProjectEnd] = useState("")
  const [editProjectDealTarget, setEditProjectDealTarget] = useState("")
  const [editProjectTrackers, setEditProjectTrackers] = useState<string[]>([])
  const [tempTrackers, setTempTrackers] = useState<string[]>([])
  const [editProjectError, setEditProjectError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load dynamic project trackers
  const { data: trackers = [] } = useProjectTrackers(projectId)
  const createTrackerMutation = useCreateProjectTracker(projectId)
  const updateTrackerMutation = useUpdateProjectTracker(projectId)
  const deleteTrackerMutation = useDeleteProjectTracker(projectId)

  const [editingTrackerId, setEditingTrackerId] = useState("")
  const [editingTrackerName, setEditingTrackerName] = useState("")
  const [newTrackerName, setNewTrackerName] = useState("")

  const handleCreateTracker = () => {
    if (!newTrackerName.trim()) return
    createTrackerMutation.mutate(
      { name: newTrackerName.trim() },
      {
        onSuccess: (newTracker) => {
          setNewTrackerName("")
          setEditProjectTrackers((prev) => [...prev, newTracker.code])
          setTempTrackers((prev) => [...prev, newTracker.code])
        },
      },
    )
  }

  const handleSaveRename = (id: string) => {
    if (!editingTrackerName.trim()) {
      setEditingTrackerId("")
      return
    }
    const oldTracker = trackers.find((t) => t.id === id)
    updateTrackerMutation.mutate(
      { id, data: { name: editingTrackerName.trim() } },
      {
        onSuccess: (updatedTracker) => {
          setEditingTrackerId("")
          if (oldTracker) {
            setEditProjectTrackers((prev) =>
              prev.map((code) => (code === oldTracker.code ? updatedTracker.code : code)),
            )
            setTempTrackers((prev) =>
              prev.map((code) => (code === oldTracker.code ? updatedTracker.code : code)),
            )
          }
        },
      },
    )
  }

  const handleDeleteTracker = async (id: string, code: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa loại yêu cầu",
      description: "Bạn có chắc chắn muốn xóa loại yêu cầu này khỏi dự án?",
      confirmText: "Xóa",
      variant: "destructive",
    })
    if (!isConfirmed) return
    deleteTrackerMutation.mutate(id, {
      onSuccess: () => {
        setEditProjectTrackers((prev) => prev.filter((k) => k !== code))
        setTempTrackers((prev) => prev.filter((k) => k !== code))
      },
    })
  }

  useEffect(() => {
    if (isOpen && project && trackers.length > 0) {
      startTransition(() => {
        setEditProjectName(project.name)
        setEditProjectDesc(project.description || "")
        setEditProjectStatus(project.status)
        setEditProjectPolicy(project.taskCreationPolicy)
        setEditProjectLeader(project.teamLeaderId || SELECT_NONE_VALUE)
        setEditProjectStart(
          project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        )
        setEditProjectEnd(
          project.expectedEndDate
            ? new Date(project.expectedEndDate).toISOString().split("T")[0]
            : "",
        )
        setEditProjectDealTarget(
          project.dealTargetPercent != null ? String(project.dealTargetPercent) : "",
        )
        const initialTrackers =
          project.allowedTaskTrackers && project.allowedTaskTrackers.length > 0
            ? project.allowedTaskTrackers
            : trackers.map((t) => t.code)
        setEditProjectTrackers(initialTrackers)
        setEditProjectError(null)
      })
    }
  }, [isOpen, project, trackers])

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!editProjectName.trim()) {
        throw new Error("Vui lòng nhập tên dự án")
      }
      if (editProjectStart && editProjectEnd) {
        const start = new Date(editProjectStart)
        const end = new Date(editProjectEnd)
        if (start > end) {
          throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến")
        }
      }
      return projectApi.update(projectId, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim() || null,
        status: editProjectStatus as (typeof PROJECT_STATUSES)[number],
        taskCreationPolicy: editProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        teamLeaderId: editProjectLeader === SELECT_NONE_VALUE ? null : editProjectLeader,
        startDate: editProjectStart || null,
        expectedEndDate: editProjectEnd || null,
        // dealTargetPercent is intentionally omitted: customer deal target is fixed
        // after project creation and only read by Capacity Copilot forecasts.
        allowedTaskTrackers: editProjectTrackers,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      setEditProjectError(null)
      toast.success("Cập nhật thông tin dự án thành công")
    },
    onError: (err: unknown) => {
      setEditProjectError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditProjectError(null)
    if (editProjectTrackers.length === 0) {
      setEditProjectError("Vui lòng chọn ít nhất 1 loại yêu cầu.")
      return
    }
    updateProjectMutation.mutate()
  }

  const handleClose = () => {
    setEditProjectError(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[550px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Chỉnh sửa dự án</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật thông tin và cấu hình cho dự án này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {editProjectError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {editProjectError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="editProjName" className="text-xs font-semibold text-muted-foreground">
              Tên dự án <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editProjName"
              value={editProjectName}
              onChange={(e) => {
                setEditProjectName(e.target.value)
              }}
              className="h-10 text-sm border-border rounded-full px-4"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editProjDesc" className="text-xs font-semibold text-muted-foreground">
              Mô tả dự án
            </Label>
            <Textarea
              id="editProjDesc"
              value={editProjectDesc}
              onChange={(e) => {
                setEditProjectDesc(e.target.value)
              }}
              className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Mô tả ngắn gọn về dự án..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="editProjStatus"
                className="text-xs font-semibold text-muted-foreground"
              >
                Trạng thái
              </Label>
              <Select value={editProjectStatus} onValueChange={setEditProjectStatus}>
                <SelectTrigger
                  id="editProjStatus"
                  className="w-full h-10 border-border rounded-full px-4 bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {PROJECT_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="rounded-lg">
                      {PROJECT_STATUS_LABELS.get(st) || st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="editProjPolicy"
                className="text-xs font-semibold text-muted-foreground"
              >
                Ai được tạo task?
              </Label>
              <Select value={editProjectPolicy} onValueChange={setEditProjectPolicy}>
                <SelectTrigger
                  id="editProjPolicy"
                  className="w-full h-10 border-border rounded-full px-4 bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {TASK_CREATION_POLICIES.map((p) => (
                    <SelectItem key={p} value={p} className="rounded-lg">
                      {p === "leader_only" ? "Chỉ trưởng nhóm" : "Tất cả thành viên"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editProjLeader" className="text-xs font-semibold text-muted-foreground">
              Trưởng dự án (Team Leader)
            </Label>
            <Select value={editProjectLeader} onValueChange={setEditProjectLeader}>
              <SelectTrigger
                id="editProjLeader"
                className="w-full h-10 border-border rounded-full px-4 bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">
                  Chưa phân công
                </SelectItem>
                {allEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project-level deal target used by Capacity Copilot, not by Project Task assignment AI. */}
          <div className="space-y-1.5">
            <Label
              htmlFor="editProjDealTarget"
              className="text-xs font-semibold text-muted-foreground"
            >
              Cam kết tuần/milestone (Deal target %)
            </Label>
            <Input
              id="editProjDealTarget"
              type="number"
              value={editProjectDealTarget}
              readOnly
              className="h-10 cursor-not-allowed rounded-full border-border bg-muted/40 px-4 text-sm text-muted-foreground"
            />
            <p className="text-[10px] text-muted-foreground">
              Deal đã chốt với khách hàng nên không chỉnh sửa tại đây.
            </p>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-xs font-semibold text-muted-foreground">
              Các loại yêu cầu được phép hoạt động
            </Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
              Chỉ chọn các loại yêu cầu được phép tạo trong dự án này (để trống nếu cho phép tất
              cả).
            </p>

            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setIsDropdownOpen(false)
                }}
              />
            )}

            <div className="relative w-full">
              <button
                type="button"
                onClick={() => {
                  // Capture current state to temp trackers when opening the dropdown list
                  setTempTrackers(editProjectTrackers)
                  setIsDropdownOpen(!isDropdownOpen)
                }}
                className="w-full h-10 border border-border rounded-full px-4 bg-background flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-muted/30 text-foreground"
              >
                <span className="truncate">
                  {editProjectTrackers.length === trackers.length
                    ? "Cho phép tất cả"
                    : editProjectTrackers.length === 0
                      ? "Chọn ít nhất 1 loại yêu cầu"
                      : editProjectTrackers
                          .map((k) => trackers.find((t) => t.code === k)?.name || k)
                          .join(", ")}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground ml-1" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-1 w-full bg-popover border border-border rounded-xl p-3 shadow-lg z-50 space-y-2">
                  <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Chọn loại công việc
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5 mr-1 border-r border-border pr-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTempTrackers(trackers.map((t) => t.code))
                          }}
                          className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempTrackers([])
                          }}
                          className="text-[9px] font-extrabold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Apply temporary tracker selections to editProjectTrackers and close dropdown
                          setEditProjectTrackers(tempTrackers)
                          setIsDropdownOpen(false)
                        }}
                        className="size-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center cursor-pointer transition-colors"
                        title="Lưu"
                      >
                        <Check className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Discard temporary selections and close dropdown
                          setIsDropdownOpen(false)
                        }}
                        className="size-5 rounded-full bg-muted hover:bg-muted-hover text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                        title="Hủy"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                    {trackers.map((tracker) => {
                      const isChecked = tempTrackers.includes(tracker.code)
                      return (
                        <div
                          key={tracker.id}
                          className="group flex items-center justify-between gap-1 p-1 hover:bg-muted/30 rounded-lg"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              // Toggle selection in the temporary trackers array
                              setTempTrackers((prev) =>
                                prev.includes(tracker.code)
                                  ? prev.filter((k) => k !== tracker.code)
                                  : [...prev, tracker.code],
                              )
                            }}
                            className={`flex items-center gap-2 p-1 flex-1 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                              isChecked ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="size-3.5 shrink-0 text-primary fill-primary/10" />
                            ) : (
                              <Square className="size-3.5 shrink-0 text-muted-foreground" />
                            )}
                            {editingTrackerId === tracker.id ? (
                              <input
                                type="text"
                                value={editingTrackerName}
                                onChange={(e) => setEditingTrackerName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveRename(tracker.id)
                                  } else if (e.key === "Escape") {
                                    setEditingTrackerId("")
                                  }
                                }}
                                onBlur={() => handleSaveRename(tracker.id)}
                                className="h-6 text-xs border border-border rounded px-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-xs font-semibold leading-tight line-clamp-1">
                                {tracker.name}
                              </span>
                            )}
                          </button>

                          {editingTrackerId !== tracker.id && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingTrackerId(tracker.id)
                                  setEditingTrackerName(tracker.name)
                                }}
                                className="p-1 hover:text-primary text-muted-foreground rounded-full cursor-pointer"
                              >
                                <Edit2 className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTracker(tracker.id, tracker.code)
                                }}
                                className="p-1 hover:text-destructive text-muted-foreground rounded-full cursor-pointer"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Thêm loại yêu cầu mới..."
                        value={newTrackerName}
                        onChange={(e) => setNewTrackerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateTracker()
                          }
                        }}
                        className="flex-1 h-8 text-xs border border-border rounded-full px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleCreateTracker}
                        disabled={createTrackerMutation.isPending}
                        className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="editProjStart"
                className="text-xs font-semibold text-muted-foreground"
              >
                Ngày bắt đầu
              </Label>
              <Input
                id="editProjStart"
                type="date"
                value={editProjectStart}
                onChange={(e) => {
                  setEditProjectStart(e.target.value)
                }}
                className="h-10 text-sm border-border rounded-full px-4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editProjEnd" className="text-xs font-semibold text-muted-foreground">
                Ngày kết thúc dự kiến
              </Label>
              <Input
                id="editProjEnd"
                type="date"
                value={editProjectEnd}
                onChange={(e) => {
                  setEditProjectEnd(e.target.value)
                }}
                className="h-10 text-sm border-border rounded-full px-4"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 rounded-full px-5 text-sm"
              disabled={updateProjectMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
