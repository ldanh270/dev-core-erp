import type { DataTableColumn } from "@/components/common"
import { StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { getTableColWidthPx, TABLE_COL_WIDTH } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task.types"
import { ExternalLink, MoreHorizontal } from "lucide-react"
import { useMemo } from "react"
import { Link } from "react-router-dom"

export interface UseTaskTableColumnsOptions {
  onOpenActionMenu: (task: Task, rect: DOMRect) => void
}

/**
 * Generates table column definitions for the task dashboard and task lists.
 */
export function useTaskTableColumns({ onOpenActionMenu }: UseTaskTableColumnsOptions) {
  return useMemo<DataTableColumn<Task>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        width: getTableColWidthPx("INDEX"),
        cell: (task) => <span className={TYPOGRAPHY.CELL_CODE}>#{task.id.substring(0, 5)}</span>,
      },
      {
        id: "project",
        header: "Dự án",
        width: getTableColWidthPx("DATE"),
        truncate: true,
        cell: (task) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "truncate")}>
            {task.project?.name || "N/A"}
          </span>
        ),
      },
      {
        id: "tracker",
        header: "Tracker",
        width: "90px",
        cell: (task) => {
          let trackerColor = "bg-secondary text-secondary-foreground"
          if (task.tracker === "bug") {
            trackerColor = "bg-destructive/10 text-destructive border-destructive/20"
          } else if (task.tracker === "feature") {
            trackerColor =
              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
          } else if (task.tracker === "support") {
            trackerColor = "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400"
          }

          return (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                trackerColor,
              )}
            >
              {task.tracker}
            </Badge>
          )
        },
      },
      {
        id: "title",
        header: "Tiêu đề",
        minWidth: `${TABLE_COL_WIDTH.SCHEDULE}px`,
        truncate: true,
        cell: (task) => (
          <Link
            to={`/project/task/${task.id}`}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "text-primary hover:underline inline-flex items-center gap-1 group truncate",
            )}
          >
            <span className="truncate">{task.title}</span>
            <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("PRIORITY"),
        cell: (task) => (
          <StatusPill
            label={
              task.status === "todo"
                ? "Đang mở"
                : task.status === "reopened"
                  ? "Mở lại"
                  : task.status === "in_progress"
                    ? "Đang làm"
                    : task.status === "in_review"
                      ? "Đánh giá"
                      : task.status === "done"
                        ? "Hoàn thành"
                        : "Đã hủy"
            }
            variant={
              task.status === "done"
                ? "success"
                : task.status === "in_progress"
                  ? "warning"
                  : task.status === "reopened" || task.status === "in_review"
                    ? "info"
                    : task.status === "cancelled"
                      ? "danger"
                      : "neutral"
            }
          />
        ),
      },
      {
        id: "priority",
        header: "Độ ưu tiên",
        width: `${TABLE_COL_WIDTH.ACTIONS}px`,
        cell: (task) => {
          let priorityColor = "bg-secondary text-secondary-foreground"
          if (task.priority === "urgent") {
            priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
          } else if (task.priority === "high") {
            priorityColor = "bg-warning/10 text-warning border-warning/20"
          } else if (task.priority === "medium") {
            priorityColor = "bg-info/10 text-info border-info/20"
          }

          return (
            <Badge
              variant="outline"
              className={cn("rounded-full text-xs font-semibold px-2 py-0.5", priorityColor)}
            >
              {task.priority === "urgent"
                ? "Khẩn cấp"
                : task.priority === "high"
                  ? "Cao"
                  : task.priority === "medium"
                    ? "Trung bình"
                    : "Thấp"}
            </Badge>
          )
        },
      },
      {
        id: "progress",
        header: "%",
        align: "right",
        width: "50px",
        cell: (task) => (
          <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "font-semibold")}>{task.progress}%</span>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        width: "44px",
        cell: (task) => (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              onOpenActionMenu(task, rect)
            }}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Thao tác"
          >
            <MoreHorizontal className="size-4" />
          </button>
        ),
      },
    ],
    [onOpenActionMenu],
  )
}
