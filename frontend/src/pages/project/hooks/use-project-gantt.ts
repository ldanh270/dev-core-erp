import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, differenceInDays, addDays, eachDayOfInterval, startOfDay } from "date-fns"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { customQueryApi } from "@/lib/api/custom-query.api"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { TASK_STATUS, TASK_PRIORITY, TASK_TRACKER, CUSTOM_QUERY_TYPE } from "@/config/entities/project.config"
import { PROJECT_MESSAGES } from "@/config/messages/project.message"
import { useAuthStore } from "@/store/auth-store"
import type { Project } from "@/types/project.types"
import type { Task, UpdateTaskDto } from "@/types/task.types"
import { extractErrorMessage } from "@/utils/error-helper"
import { usePermission } from "@/hooks/use-permission"

import {
  DEFAULT_MONTHS_RANGE,
  DEFAULT_MONTHS_RANGE_STRING,
  DEFAULT_RECENT_DAYS_RANGE,
  FILTER_DEFINITIONS,
  GANTT_FILTER_KEY,
  GANTT_FILTER_OPERATOR,
  GANTT_FILTER_TYPE,
  PROJECT_QUERY_KEY,
  QUICK_QUERY_TYPE,
} from "../constants/gantt.constants"

interface UseProjectGanttProps {
  projectId: string
  project: Project
}

/**
 * Hook to manage Gantt chart states: timeline calculations, zoom levels, filters,
 * custom query saves/deletes, task date mutations, and task updates.
 * Implements persistent state syncing with react-router-dom searchParams.
 */
export function useProjectGantt({ projectId, project }: UseProjectGanttProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedUrlQueryId, setAppliedUrlQueryId] = useState<string | null>(null)

  // Timeline view range configuration (timeline start date)
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    if (project.startDate) {
      return new Date(project.startDate)
    }
    return new Date()
  })

  // Timeline view range configuration (timeline end date)
  const [timelineEnd, setTimelineEnd] = useState<Date>(() => {
    const start = project.startDate ? new Date(project.startDate) : new Date()
    return addDays(start, DEFAULT_MONTHS_RANGE * 30 - 1)
  })

  // Track if we have initialized the timeline dynamically from tasks
  const [hasInitializedTimeline, setHasInitializedTimeline] = useState(false)

  // Selected task state for completion / review modal
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null)

  // Options Panel states
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false)
  const [showEstTime, setShowEstTime] = useState(true)
  const [showAssignee, setShowAssignee] = useState(true)
  const [showProgress, setShowProgress] = useState(true)

  // Filter form states
  const [monthsInput, setMonthsInput] = useState(DEFAULT_MONTHS_RANGE_STRING) // default 6 months from project start
  const [monthInput, setMonthInput] = useState<number>(() => timelineStart.getMonth())
  const [yearInput, setYearInput] = useState<number>(() => timelineStart.getFullYear())
  const [monthsRange, setMonthsRange] = useState(DEFAULT_MONTHS_RANGE) // actual range applied (months)

  // Redmine Filters State
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([GANTT_FILTER_KEY.STATUS])
  const [filterStates, setFilterStates] = useState<
    Record<
      string,
      | {
          enabled: boolean
          operator: string
          value: string
        }
      | undefined
    >
  >({
    [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: GANTT_FILTER_OPERATOR.OPEN, value: "" },
    [GANTT_FILTER_KEY.TRACKER]: {
      enabled: true,
      operator: GANTT_FILTER_OPERATOR.IS,
      value: TASK_TRACKER.TASK,
    },
    [GANTT_FILTER_KEY.PRIORITY]: {
      enabled: true,
      operator: GANTT_FILTER_OPERATOR.IS,
      value: TASK_PRIORITY.MEDIUM,
    },
    [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: true, operator: GANTT_FILTER_OPERATOR.IS, value: "" },
  })

  const [appliedFilterKeys, setAppliedFilterKeys] = useState<string[]>([GANTT_FILTER_KEY.STATUS])
  const [appliedFilterStates, setAppliedFilterStates] = useState<
    Record<
      string,
      | {
          enabled: boolean
          operator: string
          value: string
        }
      | undefined
    >
  >({
    [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: GANTT_FILTER_OPERATOR.OPEN, value: "" },
    [GANTT_FILTER_KEY.TRACKER]: {
      enabled: true,
      operator: GANTT_FILTER_OPERATOR.IS,
      value: TASK_TRACKER.TASK,
    },
    [GANTT_FILTER_KEY.PRIORITY]: {
      enabled: true,
      operator: GANTT_FILTER_OPERATOR.IS,
      value: TASK_PRIORITY.MEDIUM,
    },
    [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: true, operator: GANTT_FILTER_OPERATOR.IS, value: "" },
  })

  // Sidebar collapsible state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  // Zoom state (column width in pixels)
  const [dayWidth, setDayWidth] = useState(28)

  // Fetch consolidated Gantt data (tasks, members, leave records)
  const { data: ganttData, isLoading } = useQuery({
    queryKey: [PROJECT_QUERY_KEY.GANTT, projectId],
    queryFn: () => projectApi.getGanttData(projectId),
    enabled: !!projectId,
  })

  // Fetch saved custom queries
  const { data: savedQueries = [], refetch: refetchSavedQueries } = useQuery({
    queryKey: [PROJECT_QUERY_KEY.CUSTOM_QUERIES, projectId],
    queryFn: () => customQueryApi.list(projectId),
    enabled: !!projectId,
  })

  // Fetch dynamic project statuses (Kanban columns)
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  const urlQueryId = searchParams.get("queryId")

  useEffect(() => {
    if (urlQueryId && savedQueries.length > 0 && urlQueryId !== appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          if (data && Array.isArray(data.activeFilterKeys) && data.filterStates) {
 
            setActiveFilterKeys(data.activeFilterKeys)
            setFilterStates(data.filterStates)
            setAppliedFilterKeys(data.activeFilterKeys)
            setAppliedFilterStates(data.filterStates)

            if (data.options) {
              if (data.options.showEstTime !== undefined) setShowEstTime(data.options.showEstTime)
              if (data.options.showAssignee !== undefined) setShowAssignee(data.options.showAssignee)
              if (data.options.showProgress !== undefined) setShowProgress(data.options.showProgress)
            }
            setAppliedUrlQueryId(urlQueryId)
            toast.success(`Đã tự động áp dụng truy vấn: ${matched.name}`)
          }
        } catch (e) {
          console.error("Error parsing URL query data", e)
        }
      }
    }
  }, [urlQueryId, savedQueries, appliedUrlQueryId])

  // Mutation to save custom query
  const saveQueryMutation = useMutation({
    mutationFn: async (data: { name: string; projectId?: string | null; queryData: string }) => {
      return customQueryApi.create({
        name: data.name,
        type: CUSTOM_QUERY_TYPE.GANTT,
        projectId: data.projectId !== undefined ? data.projectId : projectId,
        queryData: data.queryData,
      })
    },
    onSuccess: () => {
      void refetchSavedQueries()
      toast.success("Đã lưu truy vấn thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Mutation to delete custom query
  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      return customQueryApi.delete(id)
    },
    onSuccess: (_, deletedId) => {
      void refetchSavedQueries()
      if (urlQueryId === deletedId) {
        const newParams = new URLSearchParams(searchParams)
        newParams.delete("queryId")
        setSearchParams(newParams)
        setAppliedUrlQueryId(null)
      }
      toast.success("Đã xóa truy vấn thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Apply a custom query filters
  const applySavedQuery = (savedQuery: CustomQuery) => {
    try {
      const data = JSON.parse(savedQuery.queryData)
      if (data && Array.isArray(data.activeFilterKeys) && data.filterStates) {
        setActiveFilterKeys(data.activeFilterKeys)
        setFilterStates(data.filterStates)
        setAppliedFilterKeys(data.activeFilterKeys)
        setAppliedFilterStates(data.filterStates)

        // Also apply view options if saved
        if (data.options) {
          if (data.options.showEstTime !== undefined) setShowEstTime(data.options.showEstTime)
          if (data.options.showAssignee !== undefined) setShowAssignee(data.options.showAssignee)
          if (data.options.showProgress !== undefined) setShowProgress(data.options.showProgress)
        }

        // Set search params and update appliedUrlQueryId to prevent duplicate trigger
        setAppliedUrlQueryId(savedQuery.id)
        const newParams = new URLSearchParams(searchParams)
        newParams.set("queryId", savedQuery.id)
        setSearchParams(newParams)

        toast.success(`Đã áp dụng truy vấn: ${savedQuery.name}`)
      } else {
        toast.error("Dữ liệu truy vấn không hợp lệ")
      }
    } catch {
      toast.error("Không thể đọc dữ liệu truy vấn đã lưu")
    }
  }

  // Handle saving new custom query
  const handleSaveQuery = (data: {
    name: string
    projectId?: string | null
    queryData: string
  }) => {
    saveQueryMutation.mutate(data)
  }

  const tasks = useMemo(() => ganttData?.tasks || [], [ganttData?.tasks])

  // Find all unique assignees (team leader + project members)
  const assignees = useMemo(() => {
    const list: { id: string; fullName: string }[] = []

    // Add team leader
    if (project?.teamLeader) {
      list.push({ id: project.teamLeader.id, fullName: project.teamLeader.fullName })
    } else if (project?.teamLeaderId) {
      list.push({ id: project.teamLeaderId, fullName: "Team Leader" })
    }

    // Add members
    const members = ganttData?.members || []
    members.forEach((m) => {
      if (m && !list.some((item) => item.id === m.id)) {
        list.push({ id: m.id, fullName: m.fullName })
      }
    })

    return list
  }, [project, ganttData])

  // Sync timeline range dynamically with loaded tasks once
  useEffect(() => {
    if (tasks && tasks.length > 0 && !hasInitializedTimeline) {
      let minStart: Date | null = null
      let maxEnd: Date | null = null

      for (const t of tasks) {
        if (t.startDate) {
          const d = new Date(t.startDate)
          if (!minStart || d.getTime() < minStart.getTime()) minStart = d
        }

        const dates: Date[] = []
        if (t.updatedAt) dates.push(new Date(t.updatedAt))
        if (t.completedAt) dates.push(new Date(t.completedAt))
        if (t.dueDate) dates.push(new Date(t.dueDate))

        for (const d of dates) {
          if (!maxEnd || d.getTime() > maxEnd.getTime()) maxEnd = d
        }
      }

      if (minStart) {
        setTimeout(() => {
          setTimelineStart(minStart)
          setMonthInput(minStart.getMonth())
          setYearInput(minStart.getFullYear())

          if (maxEnd) {
            const bufferedEnd = addDays(maxEnd, 2)
            setTimelineEnd(bufferedEnd)
            const days = differenceInDays(bufferedEnd, minStart) + 1
            const months = Math.max(1, Math.ceil(days / 30))
            setMonthsInput(months.toString())
            setMonthsRange(months)
          }
          setHasInitializedTimeline(true)
        }, 0)
      }
    }
  }, [tasks, hasInitializedTimeline])

  const getDefaultOperator = (key: string) => {
    const def = Reflect.get(FILTER_DEFINITIONS, key) as
      | { label: string; type: string; group: string }
      | undefined
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

  const getDefaultValue = (key: string) => {
    const def = Reflect.get(FILTER_DEFINITIONS, key) as
      | { label: string; type: string; group: string }
      | undefined
    if (def === undefined) return ""
    if (key === GANTT_FILTER_KEY.TRACKER) return TASK_TRACKER.TASK
    if (key === GANTT_FILTER_KEY.PRIORITY) return TASK_PRIORITY.MEDIUM
    if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) return assignees[0]?.id || ""
    if (def.type === GANTT_FILTER_TYPE.PROGRESS) return "50"
    if (def.type === GANTT_FILTER_TYPE.NUMBER) return "0"
    if (def.type === GANTT_FILTER_TYPE.DATE) return ""
    return ""
  }

  // Update Task mutation (used to quickly adjust task dates)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskDto }) => {
      return taskApi.update(taskId, data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROJECT_QUERY_KEY.GANTT, projectId] })
      void queryClient.invalidateQueries({
        queryKey: [PROJECT_QUERY_KEY.TASKS, PROJECT_QUERY_KEY.OVERVIEW, projectId],
      })
      toast.success("Đã cập nhật công việc")
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Timeline days calculation dynamically based on start and end dates
  const timelineDays = useMemo(() => {
    const start = timelineStart
    const end = timelineEnd < timelineStart ? timelineStart : timelineEnd
    const daysInterval = eachDayOfInterval({ start, end })
    return daysInterval.slice(0, 180) // Cap at 180 days max
  }, [timelineStart, timelineEnd])

  // Month spans grouping for timeline header
  const monthSpans = useMemo(() => {
    if (timelineDays.length === 0) return []
    const spans: { label: string; colSpan: number; startCol: number; endCol: number }[] = []

    let currentLabel = format(timelineDays[0], "yyyy-M")
    let currentCount = 0
    let startIndex = 1

    timelineDays.forEach((day, index) => {
      const label = format(day, "yyyy-M")
      if (label === currentLabel) {
        currentCount++
      } else {
        spans.push({
          label: currentLabel,
          colSpan: currentCount,
          startCol: startIndex,
          endCol: startIndex + currentCount,
        })
        currentLabel = label
        startIndex = index + 1
        currentCount = 1
      }
    })

    if (currentCount > 0) {
      spans.push({
        label: currentLabel,
        colSpan: currentCount,
        startCol: startIndex,
        endCol: startIndex + currentCount,
      })
    }

    return spans
  }, [timelineDays])

  // Apply filters to tasks at client side
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      for (const key of appliedFilterKeys) {
        if (!Object.prototype.hasOwnProperty.call(appliedFilterStates, key)) continue
        const filter = Reflect.get(appliedFilterStates, key) as
          | { enabled: boolean; operator: string; value: string }
          | undefined
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
            // matches all
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
          if (filter.operator === GANTT_FILTER_OPERATOR.TOI && assigneeVal !== user?.id)
            return false
          if (filter.operator === GANTT_FILTER_OPERATOR.NONE && assigneeVal !== null) return false
        }

        // Custom internal filters from sidebar quick links
        else if (key === GANTT_FILTER_KEY.QUICK_REPORTED) {
          if (task.createdById !== filter.value) return false
        } else if (key === GANTT_FILTER_KEY.QUICK_UPDATED) {
          // just filter active tasks updated recently
          const updateDate = new Date(task.updatedAt)
          const diff = differenceInDays(new Date(), updateDate)
          if (diff > DEFAULT_RECENT_DAYS_RANGE) return false // updated more than 7 days ago
        } else if (key === GANTT_FILTER_KEY.QUICK_WATCHED) {
          // not fully implemented watch model, simulate by assignee or creator
          if (task.assigneeId !== filter.value && task.createdById !== filter.value) return false
        }

        // Subject / Description text search
        else if (key === GANTT_FILTER_KEY.SUBJECT || key === GANTT_FILTER_KEY.TXT_SUBJECT) {
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
        }

        // Progress
        else if (key === GANTT_FILTER_KEY.PROGRESS) {
          const val = task.progress
          const comp = parseInt(filter.value) || 0
          if (filter.operator === GANTT_FILTER_OPERATOR.EQUAL && val !== comp) return false
          if (filter.operator === GANTT_FILTER_OPERATOR.GREATER_THAN_EQUAL && val < comp)
            return false
          if (filter.operator === GANTT_FILTER_OPERATOR.LESS_THAN_EQUAL && val > comp) return false
        }

        // Estimated Time
        else if (key === GANTT_FILTER_KEY.TIME_EST) {
          const val = task.estimatedTime || 0
          const comp = parseFloat(filter.value) || 0
          if (filter.operator === GANTT_FILTER_OPERATOR.EQUAL && val !== comp) return false
          if (filter.operator === GANTT_FILTER_OPERATOR.GREATER_THAN_EQUAL && val < comp)
            return false
          if (filter.operator === GANTT_FILTER_OPERATOR.LESS_THAN_EQUAL && val > comp) return false
          if (filter.operator === GANTT_FILTER_OPERATOR.NONE && task.estimatedTime !== null)
            return false
          if (filter.operator === GANTT_FILTER_OPERATOR.ANY && task.estimatedTime === null)
            return false
        }

        // Date logic (Start Date, Due Date, Created, Updated, Closed)
        else if (
          key === GANTT_FILTER_KEY.DATE_START ||
          key === GANTT_FILTER_KEY.DATE_DUE ||
          key === GANTT_FILTER_KEY.DATE_CREATED ||
          key === GANTT_FILTER_KEY.DATE_UPDATED ||
          key === GANTT_FILTER_KEY.DATE_CLOSED
        ) {
          const dateMap: Record<string, string | null> = {
            [GANTT_FILTER_KEY.DATE_START]: task.startDate,
            [GANTT_FILTER_KEY.DATE_DUE]: task.dueDate,
            [GANTT_FILTER_KEY.DATE_CREATED]: task.createdAt,
            [GANTT_FILTER_KEY.DATE_UPDATED]: task.updatedAt,
            [GANTT_FILTER_KEY.DATE_CLOSED]: task.completedAt,
          }
          const taskDateStr = dateMap[key] ?? null

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
            if (filter.operator === GANTT_FILTER_OPERATOR.ANY) continue // matches any
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
  }, [tasks, appliedFilterKeys, appliedFilterStates, user?.id])

  // Flatten tree array builder (subtask tree structure support)
  const treeTasks = useMemo(() => {
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

    // Include orphan child tasks (if parentTask is missing from project tasks somehow)
    const processedIds = new Set(result.map((r) => r.id))
    filteredTasks.forEach((t: Task) => {
      if (!processedIds.has(t.id)) {
        result.push({ ...t, depth: 0 })
      }
    })

    return result
  }, [filteredTasks])

  // Navigate timeline view
  const shiftTimeline = (days: number) => {
    setTimelineStart((prev) => addDays(prev, days))
    setTimelineEnd((prev) => addDays(prev, days))
  }

  // Reset timeline to project start
  const resetTimelineToProjectStart = () => {
    const start = project.startDate ? new Date(project.startDate) : new Date()
    const duration = differenceInDays(timelineEnd, timelineStart)
    setTimelineStart(start)
    setTimelineEnd(addDays(start, duration))
  }

  // Check roles/permissions
  const isLeader = project.teamLeaderId === user?.id
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])

  // Overlap leave days check removed per user request

  // Helper to render task bar position and duration with parent task roll-up support
  const getTaskGridStyle = (task: Task) => {
    let earliestStart = task.startDate ? new Date(task.startDate) : null
    let latestEnd = task.dueDate ? new Date(task.dueDate) : null

    // Roll-up child task dates for parent task bar
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

    // Check if task falls completely out of timeline view
    if (taskEnd < timelineStart || taskStart > timelineEnd) {
      return null
    }

    // Calculate grid positions (1-indexed columns, 1 column per day)
    let startCol = differenceInDays(taskStart, timelineStart) + 1
    let span = differenceInDays(taskEnd, taskStart) + 1

    // Crop to timeline bounds
    if (startCol < 1) {
      span += startCol - 1
      startCol = 1
    }
    const maxCols = timelineDays.length
    if (startCol + span > maxCols + 1) {
      span = maxCols + 1 - startCol
    }

    if (span <= 0) return null

    return {
      gridColumnStart: startCol,
      gridColumnEnd: startCol + span,
    }
  }

  // Change task date duration (shifting task days) with parent-child boundary check
  const shiftTaskDates = (task: Task, days: number) => {
    if (!task.startDate || !task.dueDate) return
    const newStart = addDays(new Date(task.startDate), days)
    const newDue = addDays(new Date(task.dueDate), days)

    // 1. If child task, validate it stays within parent bounds
    if (task.parentTaskId) {
      const parent = tasks.find((t: Task) => t.id === task.parentTaskId)
      if (parent) {
        if (parent.startDate && newStart < new Date(parent.startDate)) {
          toast.warning(
            `${PROJECT_MESSAGES.CHILD_START_BEFORE_PARENT} (${format(new Date(parent.startDate), "dd/MM/yyyy")})`
          )
          return
        }
        if (parent.dueDate && newDue > new Date(parent.dueDate)) {
          toast.warning(
            `${PROJECT_MESSAGES.CHILD_DUE_AFTER_PARENT} (${format(new Date(parent.dueDate), "dd/MM/yyyy")})`
          )
          return
        }
      }
    }

    // 2. If parent task, validate it still encompasses all its children
    const children = tasks.filter((t: Task) => t.parentTaskId === task.id)
    if (children.length > 0) {
      for (const child of children) {
        if (child.startDate && newStart > new Date(child.startDate)) {
          toast.warning(
            `${PROJECT_MESSAGES.PARENT_TIME_MUST_COVER_CHILD} "${child.title}" (bắt đầu ${format(new Date(child.startDate), "dd/MM/yyyy")})`
          )
          return
        }
        if (child.dueDate && newDue < new Date(child.dueDate)) {
          toast.warning(
            `${PROJECT_MESSAGES.PARENT_TIME_MUST_COVER_CHILD} "${child.title}" (hạn hoàn thành ${format(new Date(child.dueDate), "dd/MM/yyyy")})`
          )
          return
        }
      }
    }

    updateTaskMutation.mutate({
      taskId: task.id,
      data: {
        startDate: format(newStart, "yyyy-MM-dd"),
        dueDate: format(newDue, "yyyy-MM-dd"),
      },
    })
  }

  // Shift timeline start by a specific number of months
  const shiftTimelineByMonth = (months: number) => {
    setTimelineStart((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + months, 1)
      setMonthInput(newDate.getMonth())
      setYearInput(newDate.getFullYear())
      const duration = differenceInDays(timelineEnd, prev)
      setTimelineEnd(addDays(newDate, duration))
      return newDate
    })
  }

  // Helper to get month label relative to current timelineStart
  const getMonthOffsetLabel = (offset: number) => {
    const d = new Date(timelineStart.getFullYear(), timelineStart.getMonth() + offset, 1)
    const months = [
      "Tháng một",
      "Tháng hai",
      "Tháng ba",
      "Tháng tư",
      "Tháng năm",
      "Tháng sáu",
      "Tháng bảy",
      "Tháng tám",
      "Tháng chín",
      "Tháng mười",
      "Tháng mười một",
      "Tháng mười hai",
    ]
    return months[d.getMonth()]
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setDayWidth((prev) => Math.min(prev + 4, 48))
  }
  const handleZoomOut = () => {
    setDayWidth((prev) => Math.max(prev - 4, 16))
  }

  // Apply filters
  const handleApplyFilters = () => {
    const range = parseInt(monthsInput) || 6
    setMonthsRange(range)
    const newStart = new Date(yearInput, monthInput, 1)
    setTimelineStart(newStart)
    setTimelineEnd(addDays(newStart, range * 30 - 1))

    // Apply filters
    setAppliedFilterKeys([...activeFilterKeys])
    setAppliedFilterStates(JSON.parse(JSON.stringify(filterStates)))
    
    // Clear queryId from URL
    if (urlQueryId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("queryId")
      setSearchParams(newParams)
      setAppliedUrlQueryId(null)
    }
    
    toast.success("Đã áp dụng bộ lọc và dòng thời gian")
  }

  // Clear/Reset filters
  const handleClearFilters = () => {
    if (tasks && tasks.length > 0) {
      let minStart: Date | null = null
      let maxEnd: Date | null = null

      for (const t of tasks) {
        if (t.startDate) {
          const d = new Date(t.startDate)
          if (!minStart || d.getTime() < minStart.getTime()) minStart = d
        }
        const dates: Date[] = []
        if (t.updatedAt) dates.push(new Date(t.updatedAt))
        if (t.completedAt) dates.push(new Date(t.completedAt))
        if (t.dueDate) dates.push(new Date(t.dueDate))
        for (const d of dates) {
          if (!maxEnd || d.getTime() > maxEnd.getTime()) maxEnd = d
        }
      }

      if (minStart) {
        setTimelineStart(minStart)
        setMonthInput(minStart.getMonth())
        setYearInput(minStart.getFullYear())
      }
      if (minStart && maxEnd) {
        const bufferedEnd = addDays(maxEnd, 2)
        setTimelineEnd(bufferedEnd)
        const days = differenceInDays(bufferedEnd, minStart) + 1
        const months = Math.max(1, Math.ceil(days / 30))
        setMonthsInput(months.toString())
        setMonthsRange(months)
      }
    } else {
      setMonthsInput("6")
      setMonthsRange(6)
      if (project.startDate) {
        const pStart = new Date(project.startDate)
        setTimelineStart(pStart)
        setTimelineEnd(addDays(pStart, 6 * 30 - 1))
        setMonthInput(pStart.getMonth())
        setYearInput(pStart.getFullYear())
      } else {
        const today = new Date()
        setTimelineStart(today)
        setTimelineEnd(addDays(today, 6 * 30 - 1))
        setMonthInput(today.getMonth())
        setYearInput(today.getFullYear())
      }
    }

    // Reset filters
    setActiveFilterKeys(["status"])
    const defaultStates = {
      status: { enabled: true, operator: "open", value: "" },
      tracker: { enabled: true, operator: "is", value: TASK_TRACKER.TASK },
      priority: { enabled: true, operator: "is", value: TASK_PRIORITY.MEDIUM },
      assignee: { enabled: true, operator: "is", value: "" },
    }
    setFilterStates(defaultStates)
    setAppliedFilterKeys(["status"])
    setAppliedFilterStates(defaultStates)
    
    // Clear queryId from URL
    if (urlQueryId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("queryId")
      setSearchParams(newParams)
      setAppliedUrlQueryId(null)
    }
    
    toast.info("Đã khôi phục bộ lọc mặc định")
  }

  // Quick Query Sidebar Handler
  const handleQuickQuery = (type: string) => {
    // Clear queryId from URL on quick query
    if (urlQueryId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("queryId")
      setSearchParams(newParams)
      setAppliedUrlQueryId(null)
    }

    if (type === QUICK_QUERY_TYPE.ASSIGNED_TO_ME) {
      setActiveFilterKeys([GANTT_FILTER_KEY.STATUS, GANTT_FILTER_KEY.ASSIGNEE])
      const states = {
        [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: "open", value: "" },
        [GANTT_FILTER_KEY.TRACKER]: { enabled: false, operator: "is", value: TASK_TRACKER.TASK },
        [GANTT_FILTER_KEY.PRIORITY]: {
          enabled: false,
          operator: "is",
          value: TASK_PRIORITY.MEDIUM,
        },
        [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: true, operator: "tôi", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys([GANTT_FILTER_KEY.STATUS, GANTT_FILTER_KEY.ASSIGNEE])
      setAppliedFilterStates(states)
      toast.success("Đã áp dụng: Công việc phân công cho tôi")
    } else if (type === QUICK_QUERY_TYPE.REPORTED_ISSUES) {
      setActiveFilterKeys([GANTT_FILTER_KEY.STATUS])
      const states = {
        [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: "open", value: "" },
        [GANTT_FILTER_KEY.TRACKER]: { enabled: false, operator: "is", value: TASK_TRACKER.TASK },
        [GANTT_FILTER_KEY.PRIORITY]: {
          enabled: false,
          operator: "is",
          value: TASK_PRIORITY.MEDIUM,
        },
        [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys([GANTT_FILTER_KEY.STATUS, GANTT_FILTER_KEY.QUICK_REPORTED])
      setAppliedFilterStates({
        ...states,
        [GANTT_FILTER_KEY.QUICK_REPORTED]: { enabled: true, operator: "is", value: user?.id || "" },
      })
      toast.success("Đã áp dụng: Công việc do tôi tạo")
    } else if (type === QUICK_QUERY_TYPE.UPDATED_ISSUES) {
      setActiveFilterKeys([GANTT_FILTER_KEY.STATUS])
      const states = {
        [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: "open", value: "" },
        [GANTT_FILTER_KEY.TRACKER]: { enabled: false, operator: "is", value: TASK_TRACKER.TASK },
        [GANTT_FILTER_KEY.PRIORITY]: {
          enabled: false,
          operator: "is",
          value: TASK_PRIORITY.MEDIUM,
        },
        [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys([GANTT_FILTER_KEY.STATUS, GANTT_FILTER_KEY.QUICK_UPDATED])
      setAppliedFilterStates({
        ...states,
        [GANTT_FILTER_KEY.QUICK_UPDATED]: { enabled: true, operator: "is", value: "" },
      })
      toast.success("Đã áp dụng: Công việc được cập nhật gần đây")
    } else if (type === QUICK_QUERY_TYPE.WATCHED_ISSUES) {
      setActiveFilterKeys([GANTT_FILTER_KEY.STATUS])
      const states = {
        [GANTT_FILTER_KEY.STATUS]: { enabled: true, operator: "open", value: "" },
        [GANTT_FILTER_KEY.TRACKER]: { enabled: false, operator: "is", value: TASK_TRACKER.TASK },
        [GANTT_FILTER_KEY.PRIORITY]: {
          enabled: false,
          operator: "is",
          value: TASK_PRIORITY.MEDIUM,
        },
        [GANTT_FILTER_KEY.ASSIGNEE]: { enabled: false, operator: "is", value: "" },
      }
      setFilterStates(states)
      setAppliedFilterKeys([GANTT_FILTER_KEY.STATUS, GANTT_FILTER_KEY.QUICK_WATCHED])
      setAppliedFilterStates({
        ...states,
        [GANTT_FILTER_KEY.QUICK_WATCHED]: { enabled: true, operator: "is", value: user?.id || "" },
      })
      toast.success("Đã áp dụng: Công việc tôi quan tâm")
    }
  }

  return {
    timelineStart,
    setTimelineStart,
    selectedTaskForReview,
    setSelectedTaskForReview,
    isOptionsExpanded,
    setIsOptionsExpanded,
    showEstTime,
    setShowEstTime,
    showAssignee,
    setShowAssignee,
    showProgress,
    setShowProgress,
    monthsInput,
    setMonthsInput,
    monthInput,
    setMonthInput,
    yearInput,
    setYearInput,
    monthsRange,
    isFiltersExpanded,
    setIsFiltersExpanded,
    activeFilterKeys,
    setActiveFilterKeys,
    filterStates,
    setFilterStates,
    appliedFilterKeys,
    appliedFilterStates,
    isSidebarExpanded,
    setIsSidebarExpanded,
    dayWidth,
    ganttData,
    isLoading,
    savedQueries,
    saveQueryMutation,
    deleteQueryMutation,
    updateTaskMutation,
    applySavedQuery,
    handleSaveQuery,
    assignees,
    statuses,
    isLoadingStatuses,
    getDefaultOperator,
    getDefaultValue,
    timelineDays,
    monthSpans,
    treeTasks,
    shiftTimeline,
    resetTimelineToProjectStart,
    isLeader,
    isAdminOrGM,
    getTaskGridStyle,
    shiftTaskDates,
    shiftTimelineByMonth,
    getMonthOffsetLabel,
    handleZoomIn,
    handleZoomOut,
    handleApplyFilters,
    handleClearFilters,
    handleQuickQuery,
  }
}
