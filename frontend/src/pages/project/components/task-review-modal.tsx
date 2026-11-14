import { SafeHtml } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Textarea } from "@/components/ui/textarea"
import type { Task } from "@/types/task.types"

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CornerDownRight,
  FileText,
  XCircle,
} from "lucide-react"

import { useTaskReview } from "../hooks/use-task-review"

interface TaskReviewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  projectId: string
  isLeader: boolean
  isAdminOrGM: boolean
}

export function TaskReviewModal({
  isOpen,
  onOpenChange,
  task,
  projectId,
  isLeader,
  isAdminOrGM,
}: TaskReviewModalProps) {
  const {
    resultNotes,
    setResultNotes,
    isRejecting,
    setIsRejecting,
    rejectionReason,
    setRejectionReason,
    formError,
    submitReviewMutation,
    handleSubmitWork,
    handleApprove,
    handleReject,
  } = useTaskReview({ task, projectId, onOpenChange })

  const canApprove = isLeader || isAdminOrGM

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Thông tin hoàn thành công việc
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {task.title}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20 mt-2">
            {formError}
          </div>
        )}

        {/* Task Details Display */}
        <div className="space-y-4 pt-3">
          <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
            <span className="text-muted-foreground font-medium">Trạng thái hiện tại:</span>
            <Badge
              variant="outline"
              className="capitalize rounded-full font-semibold px-2.5 py-0.5"
            >
              {task.status}
            </Badge>
          </div>

          {/* Display previous rejection reason if reopened */}
          {task.status === "reopened" && task.rejectionReason && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle className="size-4" />
                <span>Yêu cầu sửa đổi từ Team Leader:</span>
              </div>
              <p className="text-xs text-muted-foreground italic pl-5">"{task.rejectionReason}"</p>
            </div>
          )}

          {/* Done state details */}
          {task.status === "done" && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/25 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                <CheckCircle2 className="size-4" />
                <span>Công việc đã hoàn thành & phê duyệt!</span>
              </div>
              {task.resultNotes && (
                <div className="text-xs text-muted-foreground pl-5 space-y-1">
                  <span className="font-bold">Ghi chú kết quả: </span>
                  <SafeHtml
                    content={task.resultNotes}
                    className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Form / Actions based on status */}

          {/* 1. EMPLOYEE SUBMITTING WORK (Task not in done or review) */}
          {task.status !== "done" && task.status !== "in_review" && !canApprove && (
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="resultNotes"
                  className="text-xs font-semibold text-muted-foreground flex items-center gap-1"
                >
                  <CornerDownRight className="size-3.5 text-muted-foreground" />
                  Mô tả / Ghi chú kết quả
                </Label>
                <RichTextEditor
                  value={resultNotes}
                  onChange={setResultNotes}
                  placeholder="Ghi chú ngắn về kết quả công việc của bạn, đính kèm link, ảnh chụp..."
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full text-xs font-bold"
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending
                  ? "Đang gửi báo cáo..."
                  : "Gửi yêu cầu đánh giá (Submit for Review)"}
              </Button>
            </form>
          )}

          {/* 2. EMPLOYEE VIEWING REVIEW (Awaiting review) */}
          {task.status === "in_review" && !canApprove && (
            <div className="space-y-4 rounded-xl border border-border/40 p-4 bg-muted/5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 animate-pulse">
                <Clock className="size-4" />
                <span>Đang chờ Team Leader đánh giá và phê duyệt</span>
              </div>
              <div className="space-y-2 text-xs pt-1 border-t border-border/40">
                {task.resultNotes && (
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground">Mô tả đã gửi: </span>
                    <SafeHtml
                      content={task.resultNotes}
                      className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40 mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. LEADER REVIEWING SUBMISSION (status = in_review, has approve permissions) */}
          {task.status === "in_review" && canApprove && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 p-4 bg-muted/5 space-y-2 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Kết quả do nhân viên gửi:
                </span>
                {task.resultNotes && (
                  <div className="bg-muted/10 p-2.5 rounded-lg border border-border/40 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-muted-foreground">
                      Mô tả:{" "}
                    </span>
                    <SafeHtml
                      content={task.resultNotes}
                      className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground"
                    />
                  </div>
                )}
              </div>

              {/* Action Choices */}
              {!isRejecting ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRejecting(true)
                    }}
                    className="rounded-full text-xs font-bold border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                    disabled={submitReviewMutation.isPending}
                  >
                    <XCircle className="size-4 mr-1.5 shrink-0" /> Yêu cầu sửa đổi
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove()
                    }}
                    className="rounded-full text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
                    disabled={submitReviewMutation.isPending}
                  >
                    <CheckCircle2 className="size-4 mr-1.5 shrink-0" /> Phê duyệt hoàn thành
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleReject}
                  className="space-y-3.5 border-t border-border/40 pt-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="rejectionReason" className="text-xs font-bold text-rose-600">
                      Lý do yêu cầu sửa đổi công việc
                    </Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Giải thích chi tiết các điểm cần chỉnh sửa cho nhân sự..."
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value)
                      }}
                      className="rounded-xl text-xs resize-none h-20"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsRejecting(false)
                      }}
                      className="rounded-full text-xs font-semibold"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      className="rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700"
                      disabled={submitReviewMutation.isPending}
                    >
                      Xác nhận yêu cầu sửa đổi
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. DEFAULT: LEADER VIEWING NON-REVIEW STATE (Leader wants to edit dates or update status directly) */}
          {task.status !== "in_review" && task.status !== "done" && canApprove && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground font-medium">
                Công việc chưa gửi kết quả đánh giá. Là Team Leader, bạn có thể phê duyệt hoàn thành
                trực tiếp:
              </p>
              <Button
                onClick={() => {
                  handleApprove()
                }}
                className="w-full rounded-full text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
                disabled={submitReviewMutation.isPending}
              >
                <CheckCircle2 className="size-4 mr-1.5 shrink-0" /> Duyệt hoàn thành trực tiếp
                (Done)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
