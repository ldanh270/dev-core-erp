import type { Task } from "@/types/task.types"

/**
 * State tracking hovered task entity and mouse position for Gantt tooltips.
 */
export interface HoveredTaskState {
  task: Task
  isOverdue: boolean
  isCompletedEarly: boolean
  x: number
  y: number
}

export const GANTT_AVAILABLE_COLUMNS = [
  { key: "estimatedTime", label: "Ước lượng thời gian & log time (Est)" },
  { key: "assignee", label: "Người thực hiện nhiệm vụ (Assignee)" },
  { key: "progress", label: "Hiển thị nhãn tiến độ dòng thời gian (Progress)" },
]
