import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { Task } from "@/types/task.types"

/**
 * Utility functions for grouping tasks and computing status badges in Kanban boards.
 */
export function groupTasksByStatus(
  statuses: ProjectTaskStatus[],
  tasks: Task[],
): Record<string, Task[]> {
  const tasksByStatus: Record<string, Task[]> = {}
  statuses.forEach((status) => {
    tasksByStatus[status.id] = []
  })

  const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0]

  tasks.forEach((task) => {
    if (task.statusId && task.statusId in tasksByStatus) {
      tasksByStatus[task.statusId].push(task)
    } else {
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

  return tasksByStatus
}
