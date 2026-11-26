import React from "react"
import { Brain } from "lucide-react"

import { DatePicker } from "@/components/common"
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
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TASK_PRIORITIES } from "@/config/entities/project.config"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { ProjectMember } from "@/types/project.types"

function formatPriority(priority: string) {
  if (priority === "low") return "Thấp"
  if (priority === "medium") return "Trung bình"
  if (priority === "high") return "Cao"
  if (priority === "urgent") return "Khẩn cấp"
  return priority
}

export interface TaskDetailEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskTitle: string
  setTaskTitle: (v: string) => void
  taskDesc: string
  setTaskDesc: (v: string) => void
  taskTracker: string
  setTaskTracker: (v: string) => void
  taskPriority: string
  setTaskPriority: (v: string) => void
  taskStatusId: string
  setTaskStatusId: (v: string) => void
  taskAssignee: string
  setTaskAssignee: (v: string) => void
  taskStart: string
  setTaskStart: (v: string) => void
  taskDue: string
  setTaskDue: (v: string) => void
  taskEstimate: string
  setTaskEstimate: (v: string) => void
  taskProgress: number
  setTaskProgress: (v: number) => void
  resultNotes: string
  setResultNotes: (v: string) => void
  resultUrl: string
  setResultUrl: (v: string) => void
  resultTab: "report" | "optional"
  setResultTab: (v: "report" | "optional") => void
  editError: string | null
  trackersToDisplay: string[]
  formatTracker: (code: string) => string
  statuses: ProjectTaskStatus[]
  members: ProjectMember[]
  isUpdating: boolean
  onSubmit: (e: React.FormEvent) => void
  onOpenAiModal: () => void
}

/** Modal dialog for editing comprehensive task entity fields and details. */
export function TaskDetailEditDialog({
  open,
  onOpenChange,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskTracker,
  setTaskTracker,
  taskPriority,
  setTaskPriority,
  taskStatusId,
  setTaskStatusId,
  taskAssignee,
  setTaskAssignee,
  taskStart,
  setTaskStart,
  taskDue,
  setTaskDue,
  taskEstimate,
  setTaskEstimate,
  taskProgress,
  setTaskProgress,
  resultNotes,
  setResultNotes,
  resultUrl,
  setResultUrl,
  resultTab,
  setResultTab,
  editError,
  trackersToDisplay,
  formatTracker,
  statuses,
  members,
  isUpdating,
  onSubmit,
  onOpenAiModal,
}: TaskDetailEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-background p-6 shadow-lg sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Chỉnh sửa công việc
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cập nhật các thông tin chi tiết và tiến độ cho công việc này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-3">
          {editError && (
            <div className="rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
              {editError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="editTitle" className="text-xs font-semibold text-muted-foreground">
              Tiêu đề công việc <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editTitle"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="rounded-full border-border"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editDesc" className="text-xs font-semibold text-muted-foreground">
              Mô tả chi tiết
            </Label>
            <RichTextEditor
              value={taskDesc}
              onChange={setTaskDesc}
              placeholder="Cung cấp chi tiết các bước, ngữ cảnh hoặc yêu cầu..."
            />
          </div>

          {/* Metadata: Tracker, Priority, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editTracker" className="text-xs font-semibold text-muted-foreground">
                Tracker
              </Label>
              <Select value={taskTracker} onValueChange={setTaskTracker}>
                <SelectTrigger
                  id="editTracker"
                  className="w-full rounded-full border-border bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {trackersToDisplay.map((tr) => (
                    <SelectItem key={tr} value={tr} className="rounded-lg">
                      {formatTracker(tr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPriority" className="text-xs font-semibold text-muted-foreground">
                Độ ưu tiên
              </Label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger
                  id="editPriority"
                  className="w-full rounded-full border-border bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {TASK_PRIORITIES.map((pr) => (
                    <SelectItem key={pr} value={pr} className="rounded-lg">
                      {formatPriority(pr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editStatus" className="text-xs font-semibold text-muted-foreground">
                Trạng thái
              </Label>
              <Select value={taskStatusId} onValueChange={setTaskStatusId}>
                <SelectTrigger
                  id="editStatus"
                  className="w-full rounded-full border-border bg-background"
                >
                  <SelectValue placeholder="Chọn trạng thái..." />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  {statuses.map((st: ProjectTaskStatus) => (
                    <SelectItem key={st.id} value={st.id} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: st.color }}
                        />
                        {st.name} {st.isDefault && " (Mặc định)"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee & Progress */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="editAssignee" className="text-xs font-semibold text-muted-foreground">
                  Người thực hiện
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex h-5 items-center gap-1 rounded-full px-1.5 text-[10px] font-bold text-primary hover:bg-primary/10"
                  onClick={onOpenAiModal}
                >
                  <Brain className="h-3 w-3" />
                  AI gợi ý
                </Button>
              </div>
              <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                <SelectTrigger
                  id="editAssignee"
                  className="w-full rounded-full border-border bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                  <SelectItem value="none" className="rounded-lg">
                    Không phân công
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.employeeId} className="rounded-lg">
                      {m.employee?.fullName || "Chưa rõ"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editProgress" className="text-xs font-semibold text-muted-foreground">
                Tiến độ (% Done)
              </Label>
              <Input
                id="editProgress"
                type="number"
                min="0"
                max="100"
                value={taskProgress}
                onChange={(e) => setTaskProgress(Number(e.target.value))}
                className="rounded-full border-border"
                required
              />
            </div>
          </div>

          {/* Schedule Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editStart" className="text-xs font-semibold text-muted-foreground">
                Ngày bắt đầu
              </Label>
              <DatePicker
                id="editStart"
                value={taskStart || null}
                onChange={(val) => setTaskStart(val || "")}
                placeholder="Chọn ngày bắt đầu..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editDue" className="text-xs font-semibold text-muted-foreground">
                Hạn hoàn thành
              </Label>
              <DatePicker
                id="editDue"
                value={taskDue || null}
                onChange={(val) => setTaskDue(val || "")}
                placeholder="Chọn hạn hoàn thành..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editEstimate" className="text-xs font-semibold text-muted-foreground">
                Ước tính (Giờ)
              </Label>
              <Input
                id="editEstimate"
                type="number"
                step="0.5"
                min="0"
                value={taskEstimate}
                onChange={(e) => setTaskEstimate(e.target.value)}
                className="rounded-full border-border"
              />
            </div>
          </div>

          {/* Results Tab Section */}
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="text-xs font-bold text-foreground">Kết quả công việc</div>
            <Tabs
              value={resultTab}
              onValueChange={(val) => setResultTab(val as "report" | "optional")}
              className="w-full animate-in fade-in duration-300"
            >
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-full border border-border/40 bg-muted/60 p-1">
                <TabsTrigger value="report" className="rounded-full py-1 text-xs">
                  Báo cáo kết quả
                </TabsTrigger>
                <TabsTrigger value="optional" className="rounded-full py-1 text-xs">
                  Không yêu cầu kết quả (Optional)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="space-y-3 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editResultUrl" className="text-xs font-semibold text-muted-foreground">
                    Đường dẫn sản phẩm (resultUrl)
                  </Label>
                  <Input
                    id="editResultUrl"
                    type="text"
                    placeholder="https://github.com/... hoặc link sản phẩm..."
                    value={resultUrl}
                    onChange={(e) => setResultUrl(e.target.value)}
                    className="rounded-full border-border bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="editResultNotes"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Ghi chú kết quả (resultNotes)
                  </Label>
                  <RichTextEditor
                    value={resultNotes}
                    onChange={setResultNotes}
                    placeholder="Mô tả kết quả công việc, tính năng đã hoàn thiện hoặc hướng dẫn test..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="optional" className="pt-3">
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center text-xs italic text-muted-foreground">
                  Công việc này không yêu cầu đính kèm kết quả hoặc ghi chú bàn giao.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5 text-sm font-semibold shadow-xs"
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              disabled={isUpdating}
            >
              {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
