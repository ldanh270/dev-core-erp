import { Calendar, Clock, User } from "lucide-react"

import { PageCard, SafeHtml, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { TASK_STATUS } from "@/config/entities/project.config"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { Task } from "@/types/task.types"

function formatStatus(status: string) {
  if (status === TASK_STATUS.TODO) return "Đang mở"
  if (status === TASK_STATUS.IN_PROGRESS) return "Đang làm"
  if (status === TASK_STATUS.IN_REVIEW) return "Đánh giá"
  if (status === TASK_STATUS.DONE) return "Hoàn thành"
  if (status === TASK_STATUS.CANCELLED) return "Đã hủy"
  if (status === TASK_STATUS.REOPENED) return "Mở lại"
  return status
}

function formatPriority(priority: string) {
  if (priority === "low") return "Thấp"
  if (priority === "medium") return "Trung bình"
  if (priority === "high") return "Cao"
  if (priority === "urgent") return "Khẩn cấp"
  return priority
}

function getPriorityColor(priority: string) {
  if (priority === "urgent") return "bg-destructive/10 text-destructive border-destructive/20"
  if (priority === "high")
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
  if (priority === "medium")
    return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
  return "bg-secondary text-secondary-foreground"
}

interface TaskDetailMainInfoProps {
  task: Task
  statuses: ProjectTaskStatus[]
}

/** Detailed metadata and attribute inspector for a selected task. */
export function TaskDetailMainInfo({ task, statuses }: TaskDetailMainInfoProps) {
  const customStatus = statuses.find((s) => s.id === task.statusId)
  const statusLabel = customStatus ? customStatus.name : formatStatus(task.status)
  const isCompleted = customStatus
    ? customStatus.isCompleted
    : task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.CANCELLED
  const statusVariant = isCompleted
    ? "success"
    : customStatus?.name.toLowerCase().includes("progress")
      ? "warning"
      : "info"

  return (
    <div className="space-y-6">
      <PageCard className="p-6">
        <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
          Thông tin công việc
        </h3>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Trạng thái:</span>
            <StatusPill label={statusLabel} variant={statusVariant} />
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Độ ưu tiên:</span>
            <Badge
              variant="outline"
              className={`rounded-full text-[10px] ${getPriorityColor(task.priority)}`}
            >
              {formatPriority(task.priority)}
            </Badge>
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Người thực hiện:</span>
            {task.assignee ? (
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <User className="size-3.5 text-muted-foreground" />
                {task.assignee.fullName}
              </span>
            ) : (
              <span className="italic text-muted-foreground">Chưa chỉ định</span>
            )}
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Người báo cáo:</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <User className="size-3.5 text-muted-foreground" />
              {task.createdBy?.fullName || "N/A"}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Ngày bắt đầu:</span>
            <span className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
              <Calendar className="size-3.5 text-muted-foreground" />
              {task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "-"}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Hạn hoàn thành:</span>
            <span className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground">
              <Calendar className="size-3.5 text-muted-foreground" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Thời gian ước tính:</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              {task.estimatedTime ? `${task.estimatedTime} giờ` : "-"}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-muted-foreground">Tiến độ (% Done):</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{task.progress}%</span>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Description & Results Section */}
      <PageCard className="p-6">
        <h3 className="mb-3 border-b border-border pb-2 text-base font-bold text-foreground">
          Mô tả chi tiết
        </h3>
        {task.description ? (
          <SafeHtml
            content={task.description}
            className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground"
          />
        ) : (
          <p className="text-xs italic text-muted-foreground">
            Không có mô tả chi tiết cho công việc này.
          </p>
        )}
      </PageCard>

      {task.resultNotes && (
        <PageCard className="p-6">
          <h3 className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-base font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            Kết quả công việc
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Ghi chú kết quả:
              </span>
              <SafeHtml
                content={task.resultNotes}
                className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border/40 bg-muted/30 p-3 text-sm leading-relaxed text-foreground"
              />
            </div>
          </div>
        </PageCard>
      )}
    </div>
  )
}
