import { TASK_PRIORITY, TASK_STATUS, TASK_TRACKER } from "@/config/entities/project.config"
import {
  DEFAULT_RECENT_DAYS_RANGE,
  FILTER_DEFINITIONS,
  GANTT_FILTER_KEY,
  GANTT_FILTER_OPERATOR,
  GANTT_FILTER_TYPE,
} from "@/constants/gantt.constants"
import type { Task } from "@/types/task.types"

import { differenceInDays, startOfDay } from "date-fns"

/**
 * Resolves the default filter comparison operator for a given Gantt filter property key.
 */
export function getDefaultGanttOperator(key: string): string {
  const def = Reflect.get(FILTER_DEFINITIONS, key) as
    { label: string; type: string; group: string } | undefined
  if (def === undefined) return GANTT_FILTER_OPERATOR.IS
  if (key === GANTT_FILTER_KEY.DATE_DUE) return GANTT_FILTER_OPERATOR.OVERDUE
  if (key === GANTT_FILTER_KEY.STATUS) return GANTT_FILTER_OPERATOR.OPEN
  if (key === GANTT_FILTER_KEY.TRACKER || key === GANTT_FILTER_KEY.PRIORITY)
    return GANTT_FILTER_OPERATOR.IS
  if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) return GANTT_FILTER_OPERATOR.LA
  if (def.type === GANTT_FILTER_TYPE.TEXT) return GANTT_FILTER_OPERATOR.CHUA
  if (def.type === GANTT_FILTER_TYPE.PROGRESS || def.type === GANTT_FILTER_TYPE.NUMBER)
    return GANTT_FILTER_OPERATOR.EQUAL
  if (def.type === GANTT_FILTER_TYPE.DATE) return GANTT_FILTER_OPERATOR.ANY
  if (def.type === GANTT_FILTER_TYPE.RELATION) return GANTT_FILTER_OPERATOR.ANY
  return GANTT_FILTER_OPERATOR.IS
}

/**
 * Returns default initial value appropriate for a Gantt filter definition.
 */
export function getDefaultGanttValue(
  key: string,
  assignees: { id: string; fullName: string }[],
): string {
  const def = Reflect.get(FILTER_DEFINITIONS, key) as
    { label: string; type: string; group: string } | undefined
  if (def === undefined) return ""
  if (key === GANTT_FILTER_KEY.TRACKER) return TASK_TRACKER.TASK
  if (key === GANTT_FILTER_KEY.PRIORITY) return TASK_PRIORITY.MEDIUM
  if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) return assignees.at(0)?.id || ""
  if (def.type === GANTT_FILTER_TYPE.PROGRESS) return "50"
  if (def.type === GANTT_FILTER_TYPE.NUMBER) return "0"
  if (def.type === GANTT_FILTER_TYPE.DATE) return ""
  return ""
}

/**
 * Filters Gantt tasks against multiple dynamic query constraints (status, assignee, dates, trackers).
 */
export function filterGanttTasks(
  tasks: Task[],
  appliedFilterKeys: string[],
  appliedFilterStates: Record<
    string,
    { enabled: boolean; operator: string; value: string } | undefined
  >,
  currentUserId?: string,
): Task[] {
  return tasks.filter((task: Task) => {
    for (const key of appliedFilterKeys) {
      if (!Object.prototype.hasOwnProperty.call(appliedFilterStates, key)) continue
      const filter = Reflect.get(appliedFilterStates, key) as
        { enabled: boolean; operator: string; value: string } | undefined
      if (!filter?.enabled) continue

      if (key === GANTT_FILTER_KEY.STATUS) {
        const statusVal = task.status
        if (filter.operator === GANTT_FILTER_OPERATOR.OPEN) {
          const isOpen = (
            [
              TASK_STATUS.TODO,
              TASK_STATUS.IN_PROGRESS,
              TASK_STATUS.IN_REVIEW,
              TASK_STATUS.REOPENED,
            ] as string[]
          ).includes(statusVal)
          if (!isOpen) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.DONG) {
          const isClosed = ([TASK_STATUS.DONE, TASK_STATUS.CANCELLED] as string[]).includes(
            statusVal,
          )
          if (!isClosed) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.TAT_CA) {
          /* matches all statuses */
        } else if (filter.operator === GANTT_FILTER_OPERATOR.LA) {
          if (statusVal !== filter.value) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.KHONG_LA) {
          if (statusVal === filter.value) return false
        }
      } else if (key === GANTT_FILTER_KEY.TRACKER) {
        const val = task.tracker
        if (filter.operator === GANTT_FILTER_OPERATOR.IS && val !== filter.value) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.IS_NOT && val === filter.value) return false
      } else if (key === GANTT_FILTER_KEY.PRIORITY) {
        const val = task.priority
        if (filter.operator === GANTT_FILTER_OPERATOR.IS && val !== filter.value) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.IS_NOT && val === filter.value) return false
      } else if (key === GANTT_FILTER_KEY.ASSIGNEE) {
        const assigneeVal = task.assigneeId
        if (filter.operator === GANTT_FILTER_OPERATOR.LA && assigneeVal !== filter.value)
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.KHONG_LA && assigneeVal === filter.value)
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.TOI && assigneeVal !== currentUserId)
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.NONE && assigneeVal !== null) return false
      } else if (key === GANTT_FILTER_KEY.QUICK_REPORTED) {
        if (task.createdById !== filter.value) return false
      } else if (key === GANTT_FILTER_KEY.QUICK_UPDATED) {
        const updateDate = new Date(task.updatedAt)
        const diff = differenceInDays(new Date(), updateDate)
        if (diff > DEFAULT_RECENT_DAYS_RANGE) return false
      } else if (key === GANTT_FILTER_KEY.QUICK_WATCHED) {
        if (task.assigneeId !== filter.value && task.createdById !== filter.value) return false
      } else if (key === GANTT_FILTER_KEY.SUBJECT || key === GANTT_FILTER_KEY.TXT_SUBJECT) {
        const val = task.title.toLowerCase()
        const search = filter.value.toLowerCase()
        if (filter.operator === GANTT_FILTER_OPERATOR.CHUA && !val.includes(search)) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.KHONG_CHUA && val.includes(search))
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.BAT_DAU_BANG && !val.startsWith(search))
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.KET_THUC_BANG && !val.endsWith(search))
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.NONE && val.trim() !== "") return false
        if (filter.operator === GANTT_FILTER_OPERATOR.ANY && val.trim() === "") return false
      } else if (key === GANTT_FILTER_KEY.TXT_DESC) {
        const val = (task.description || "").toLowerCase()
        const search = filter.value.toLowerCase()
        if (filter.operator === GANTT_FILTER_OPERATOR.CHUA && !val.includes(search)) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.KHONG_CHUA && val.includes(search))
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.NONE && val.trim() !== "") return false
        if (filter.operator === GANTT_FILTER_OPERATOR.ANY && val.trim() === "") return false
      } else if (key === GANTT_FILTER_KEY.PROGRESS) {
        const val = task.progress
        const comp = parseInt(filter.value) || 0
        if (filter.operator === GANTT_FILTER_OPERATOR.EQUAL && val !== comp) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.GREATER_THAN_EQUAL && val < comp) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.LESS_THAN_EQUAL && val > comp) return false
      } else if (key === GANTT_FILTER_KEY.TIME_EST) {
        const val = task.estimatedTime || 0
        const comp = parseFloat(filter.value) || 0
        if (filter.operator === GANTT_FILTER_OPERATOR.EQUAL && val !== comp) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.GREATER_THAN_EQUAL && val < comp) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.LESS_THAN_EQUAL && val > comp) return false
        if (filter.operator === GANTT_FILTER_OPERATOR.NONE && task.estimatedTime !== null)
          return false
        if (filter.operator === GANTT_FILTER_OPERATOR.ANY && task.estimatedTime === null)
          return false
      } else if (
        key === GANTT_FILTER_KEY.DATE_START ||
        key === GANTT_FILTER_KEY.DATE_DUE ||
        key === GANTT_FILTER_KEY.DATE_CREATED ||
        key === GANTT_FILTER_KEY.DATE_UPDATED ||
        key === GANTT_FILTER_KEY.DATE_CLOSED
      ) {
        let taskDateStr: string | null = null
        switch (key) {
          case GANTT_FILTER_KEY.DATE_START:
            taskDateStr = task.startDate
            break
          case GANTT_FILTER_KEY.DATE_DUE:
            taskDateStr = task.dueDate
            break
          case GANTT_FILTER_KEY.DATE_CREATED:
            taskDateStr = task.createdAt
            break
          case GANTT_FILTER_KEY.DATE_UPDATED:
            taskDateStr = task.updatedAt
            break
          case GANTT_FILTER_KEY.DATE_CLOSED:
            taskDateStr = task.completedAt
            break
          default:
            taskDateStr = null
            break
        }

        if (filter.operator === GANTT_FILTER_OPERATOR.OVERDUE) {
          if (!taskDateStr) return false
          const taskDate = new Date(taskDateStr)
          const today = startOfDay(new Date())
          const statusLower = (task.status || "").toLowerCase()
          const isCompleted =
            statusLower === TASK_STATUS.DONE ||
            statusLower === TASK_STATUS.CANCELLED ||
            (task.progress !== undefined && task.progress >= 100)
          if (isCompleted) return false
          if (taskDate >= today) return false
          continue
        }

        if (!taskDateStr) {
          if (filter.operator === GANTT_FILTER_OPERATOR.ANY) continue
          return false
        }

        const taskDate = new Date(taskDateStr)
        const today = new Date()

        if (filter.operator === GANTT_FILTER_OPERATOR.TODAY) {
          if (differenceInDays(taskDate, today) !== 0) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.YESTERDAY) {
          if (differenceInDays(today, taskDate) !== 1) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.IN_DAYS) {
          const days = parseInt(filter.value) || 0
          const diff = differenceInDays(today, taskDate)
          if (diff < 0 || diff > days) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.MORE_THAN_DAYS) {
          const days = parseInt(filter.value) || 0
          const diff = differenceInDays(today, taskDate)
          if (diff <= days) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.AFTER) {
          if (!filter.value || taskDate <= new Date(filter.value)) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.BEFORE) {
          if (!filter.value || taskDate >= new Date(filter.value)) return false
        } else if (filter.operator === GANTT_FILTER_OPERATOR.BETWEEN) {
          const [d1, d2] = filter.value.split(",")
          if (d1 && taskDate < new Date(d1)) return false
          if (d2 && taskDate > new Date(d2)) return false
        }
      }
    }
    return true
  })
}

/**
 * Transforms flat task array into a hierarchy with tree depth properties for Gantt rendering.
 */
export function buildGanttTaskTree(filteredTasks: Task[]): (Task & { depth: number })[] {
  const rootTasks = filteredTasks.filter((t: Task) => !t.parentTaskId)
  const childTasks = filteredTasks.filter((t: Task) => t.parentTaskId)

  const result: (Task & { depth: number })[] = []

  const traverse = (parent: Task, depth: number) => {
    result.push({ ...parent, depth })
    const children = childTasks.filter((t: Task) => t.parentTaskId === parent.id)
    children.forEach((child: Task) => {
      traverse(child, depth + 1)
    })
  }

  rootTasks.forEach((root: Task) => {
    traverse(root, 0)
  })

  const processedIds = new Set(result.map((r) => r.id))
  filteredTasks.forEach((t: Task) => {
    if (!processedIds.has(t.id)) {
      result.push({ ...t, depth: 0 })
    }
  })

  return result
}

/**
 * Calculates start column and span across the timeline grid for a task and its subtasks.
 */
export function getGanttTaskGridStyle(
  task: Task,
  tasks: Task[],
  timelineStart: Date,
  timelineEnd: Date,
  timelineDaysLength: number,
): { gridColumnStart: number; gridColumnEnd: number } | null {
  let earliestStart = task.startDate ? new Date(task.startDate) : null
  let latestEnd = task.dueDate ? new Date(task.dueDate) : null

  const children = tasks.filter((t: Task) => t.parentTaskId === task.id)
  for (const child of children) {
    if (child.startDate) {
      const cStart = new Date(child.startDate)
      if (!earliestStart || cStart < earliestStart) {
        earliestStart = cStart
      }
    }
    if (child.dueDate) {
      const cEnd = new Date(child.dueDate)
      if (!latestEnd || cEnd > latestEnd) {
        latestEnd = cEnd
      }
    }
  }

  if (!earliestStart) return null

  const taskStart = earliestStart
  const taskEnd = latestEnd || (task.updatedAt ? new Date(task.updatedAt) : new Date())

  if (taskEnd < timelineStart || taskStart > timelineEnd) {
    return null
  }

  let startCol = differenceInDays(taskStart, timelineStart) + 1
  let span = differenceInDays(taskEnd, taskStart) + 1

  if (startCol < 1) {
    span += startCol - 1
    startCol = 1
  }
  const maxCols = timelineDaysLength
  if (startCol + span > maxCols + 1) {
    span = maxCols + 1 - startCol
  }

  if (span <= 0) return null

  return {
    gridColumnStart: startCol,
    gridColumnEnd: startCol + span,
  }
}
