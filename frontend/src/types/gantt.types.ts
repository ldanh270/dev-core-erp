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
