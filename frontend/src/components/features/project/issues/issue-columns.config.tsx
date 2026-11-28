import { StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { TableCell } from "@/components/ui/table"
import type { Task } from "@/types/task.types"

import React from "react"

import { Link } from "react-router-dom"

/**
 * Default table column configurations and cell renderers for project issues.
 */
export const ALL_FILTER_VALUE = "all"

/**
 * Returns localized label for task status codes in issue columns.
 */
export const formatStatus = (status: string) => {
  switch (status) {
    case "todo":
      return "Đang mở"
    case "in_progress":
      return "Đang làm"
    case "in_review":
      return "Đánh giá"
    case "done":
      return "Hoàn thành"
    case "cancelled":
      return "Đã hủy"
    case "reopened":
      return "Mở lại"
    default:
      return status
  }
}

export const AVAILABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "tracker", label: "Kiểu công việc" },
  { key: "title", label: "Chủ đề" },
  { key: "assignee", label: "Người thực hiện" },
  { key: "status", label: "Trạng thái" },
  { key: "priority", label: "Mức ưu tiên" },
  { key: "progress", label: "Tiến độ" },
  { key: "author", label: "Tác giả" },
  { key: "startDate", label: "Bắt đầu" },
  { key: "dueDate", label: "Hết hạn" },
  { key: "estimatedTime", label: "Thời gian ước lượng" },
  { key: "updatedAt", label: "Cập nhật" },
]

export interface ColumnDefinition {
  label: string
  className: string
  render: (
    task: Task,
    statuses?: { id: string; name: string; isCompleted: boolean }[],
  ) => React.ReactNode
}

export const COLUMN_METADATA: Record<string, ColumnDefinition> = {
  id: {
    label: "ID",
    className: "w-16 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">
        #{task.id.substring(0, 5)}
      </TableCell>
    ),
  },
  tracker: {
    label: "Kiểu công việc",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => {
      let trackerColor = "bg-secondary text-secondary-foreground border-border"
      if (task.tracker === "bug") {
        trackerColor = "bg-destructive/10 text-destructive border-destructive/20"
      } else if (task.tracker === "feature") {
        trackerColor =
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
      } else if (task.tracker === "support") {
        trackerColor = "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400"
      }
      return (
        <TableCell>
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${trackerColor}`}
          >
            {task.tracker}
          </Badge>
        </TableCell>
      )
    },
  },
  title: {
    label: "Chủ đề",
    className: "font-semibold text-xs min-w-[200px]",
    render: (task: Task) => (
      <TableCell className="max-w-[250px] truncate font-medium">
        <Link
          to={`/project/task/${task.id}`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          {task.title}
        </Link>
      </TableCell>
    ),
  },
  assignee: {
    label: "Người thực hiện",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs">
        {task.assignee ? (
          <span className="font-semibold text-foreground">{task.assignee.fullName}</span>
        ) : (
          <span className="text-muted-foreground italic">Không chỉ định</span>
        )}
      </TableCell>
    ),
  },
  status: {
    label: "Trạng thái",
    className: "w-28 font-semibold text-xs",
    render: (task: Task, statuses = []) => {
      const customStatus = statuses.find((s) => s.id === task.statusId)
      const label = customStatus ? customStatus.name : formatStatus(task.status)
      const isCompleted = customStatus
        ? customStatus.isCompleted
        : task.status === "done" || task.status === "cancelled"
      const variant = isCompleted
        ? "success"
        : customStatus?.name.toLowerCase().includes("progress")
          ? "warning"
          : "info"
      return (
        <TableCell>
          <StatusPill label={label} variant={variant} />
        </TableCell>
      )
    },
  },
  priority: {
    label: "Mức ưu tiên",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => {
      let priorityColor = "bg-secondary text-secondary-foreground"
      if (task.priority === "urgent") {
        priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
      } else if (task.priority === "high") {
        priorityColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
      } else if (task.priority === "medium") {
        priorityColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
      }
      return (
        <TableCell>
          <Badge variant="outline" className={`rounded-full text-[9px] ${priorityColor}`}>
            {task.priority}
          </Badge>
        </TableCell>
      )
    },
  },
  progress: {
    label: "Tiến độ",
    className: "w-16 text-right font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-right font-bold text-xs">{task.progress}%</TableCell>
    ),
  },
  author: {
    label: "Tác giả",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-foreground font-semibold">
        {task.createdBy ? task.createdBy.fullName : "Chưa rõ"}
      </TableCell>
    ),
  },
  startDate: {
    label: "Bắt đầu",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    ),
  },
  dueDate: {
    label: "Hết hạn",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    ),
  },
  estimatedTime: {
    label: "Thời gian ước lượng",
    className: "w-24 font-semibold text-xs text-right",
    render: (task: Task) => (
      <TableCell className="text-xs text-right font-mono font-semibold">
        {task.estimatedTime ? `${task.estimatedTime}h` : "-"}
      </TableCell>
    ),
  },
  updatedAt: {
    label: "Cập nhật",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    ),
  },
}
