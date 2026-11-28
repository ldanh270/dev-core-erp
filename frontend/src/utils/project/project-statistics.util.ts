import { SPENT_TIME_STATUS, TASK_TRACKERS } from "@/config/entities/project.config"
import type { SpentTime } from "@/types/spent-time.types"
import type { Task } from "@/types/task.types"

/**
 * Computes counts of open, closed, total tasks and cumulative estimated hours.
 */
export function computeTaskCounts(overviewTasks: Task[]) {
  const openTasksCount = overviewTasks.filter((t) =>
    ["todo", "in_progress", "in_review", "reopened"].includes(t.status),
  ).length

  const closedTasksCount = overviewTasks.filter((t) =>
    ["done", "cancelled"].includes(t.status),
  ).length

  const totalTasksCount = overviewTasks.length

  const totalEstimatedHours = overviewTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0)

  return { openTasksCount, closedTasksCount, totalTasksCount, totalEstimatedHours }
}

/**
 * Computes breakdown of open and closed tasks grouped by tracker type.
 */
export function computeTrackerStats(overviewTasks: Task[]) {
  return TASK_TRACKERS.reduce((acc, tr) => {
    const trTasks = overviewTasks.filter((t) => t.tracker === tr)
    const open = trTasks.filter((t) =>
      ["todo", "in_progress", "in_review", "reopened"].includes(t.status),
    ).length
    const closed = trTasks.filter((t) => ["done", "cancelled"].includes(t.status)).length
    acc.set(tr, { open, closed, total: trTasks.length })
    return acc
  }, new Map<string, { open: number; closed: number; total: number }>())
}

/**
 * Computes sum of approved or pending spent-time hours, excluding rejected records.
 */
export function computeTotalSpentHours(spentTimes?: SpentTime[]) {
  return (
    spentTimes
      ?.filter((st) => st.status !== SPENT_TIME_STATUS.REJECTED)
      .reduce((sum, st) => sum + st.hours, 0) || 0
  )
}
