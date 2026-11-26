import { TASK_PRIORITY, TASK_TRACKER } from "@/config/entities/project.config"
import { usePermission } from "@/hooks/use-permission"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"
import type { Project } from "@/types/project.types"
import type { Task, UpdateTaskDto } from "@/types/task.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addDays, format } from "date-fns"
import { toast } from "sonner"

import {
  GANTT_FILTER_KEY,
  GANTT_FILTER_OPERATOR,
  PROJECT_QUERY_KEY,
  QUICK_QUERY_TYPE,
} from "../constants/gantt.constants"
import {
  buildGanttTaskTree,
  filterGanttTasks,
  getDefaultGanttOperator,
  getDefaultGanttValue,
  getGanttTaskGridStyle,
} from "../utils/gantt-task-calculations.util"
import { useGanttCustomQueries } from "./use-gantt-custom-queries"
import { useGanttTimelineRange } from "./use-gantt-timeline-range"

interface UseProjectGanttProps {
  projectId: string
  project: Project
}

/**
 * Hook coordinating data loading, timeline intervals, quick filters, custom queries,
 * and task status updates for the project Gantt chart workspace.
 */
export function useProjectGantt({ projectId, project }: UseProjectGanttProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()

  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null)
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false)
  const [showEstTime, setShowEstTime] = useState(true)
  const [showAssignee, setShowAssignee] = useState(true)
  const [showProgress, setShowProgress] = useState(true)

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([GANTT_FILTER_KEY.STATUS])
  const [filterStates, setFilterStates] = useState<
    Record<string, { enabled: boolean; operator: string; value: string } | undefined>
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
    Record<string, { enabled: boolean; operator: string; value: string } | undefined>
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

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  const { data: ganttData, isLoading } = useQuery({
    queryKey: [PROJECT_QUERY_KEY.GANTT, projectId],
    queryFn: () => projectApi.getGanttData(projectId),
    enabled: !!projectId,
  })

  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  const tasks = useMemo(() => ganttData?.tasks || [], [ganttData?.tasks])

  const assignees = useMemo(() => {
    const list: { id: string; fullName: string }[] = []
    if (project?.teamLeader) {
      list.push({ id: project.teamLeader.id, fullName: project.teamLeader.fullName })
    } else if (project?.teamLeaderId) {
      list.push({ id: project.teamLeaderId, fullName: "Team Leader" })
    }
    const members = ganttData?.members || []
    members.forEach((m) => {
      if (m && !list.some((item) => item.id === m.id)) {
        list.push({ id: m.id, fullName: m.fullName })
      }
    })
    return list
  }, [project, ganttData])

  const timelineRange = useGanttTimelineRange({ project, tasks })
  const customQueries = useGanttCustomQueries({
    projectId,
    setActiveFilterKeys,
    setFilterStates,
    setAppliedFilterKeys,
    setAppliedFilterStates,
    setShowEstTime,
    setShowAssignee,
    setShowProgress,
  })

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

  const filteredTasks = useMemo(() => {
    return filterGanttTasks(tasks, appliedFilterKeys, appliedFilterStates, user?.id)
  }, [tasks, appliedFilterKeys, appliedFilterStates, user?.id])

  const treeTasks = useMemo(() => {
    return buildGanttTaskTree(filteredTasks)
  }, [filteredTasks])

  const getTaskGridStyleFn = (task: Task) => {
    return getGanttTaskGridStyle(
      task,
      tasks,
      timelineRange.timelineStart,
      timelineRange.timelineEnd,
      timelineRange.timelineDays.length,
    )
  }

  const shiftTaskDates = (task: Task, days: number) => {
    if (!task.startDate || !task.dueDate) return
    const newStart = addDays(new Date(task.startDate), days)
    const newDue = addDays(new Date(task.dueDate), days)

    if (task.parentTaskId) {
      const parent = tasks.find((t: Task) => t.id === task.parentTaskId)
      if (parent) {
        if (parent.startDate && newStart < new Date(parent.startDate)) {
          toast.warning(
            `Ngày bắt đầu của công việc con không được trước ngày bắt đầu của công việc cha (${format(new Date(parent.startDate), "dd/MM/yyyy")})`,
          )
          return
        }
        if (parent.dueDate && newDue > new Date(parent.dueDate)) {
          toast.warning(
            `Hạn hoàn thành của công việc con không được sau hạn hoàn thành của công việc cha (${format(new Date(parent.dueDate), "dd/MM/yyyy")})`,
          )
          return
        }
      }
    }

    const children = tasks.filter((t: Task) => t.parentTaskId === task.id)
    if (children.length > 0) {
      for (const child of children) {
        if (child.startDate && newStart > new Date(child.startDate)) {
          toast.warning(
            `Khoảng thời gian công việc cha phải bao trùm công việc con "${child.title}" (bắt đầu ${format(new Date(child.startDate), "dd/MM/yyyy")})`,
          )
          return
        }
        if (child.dueDate && newDue < new Date(child.dueDate)) {
          toast.warning(
            `Khoảng thời gian công việc cha phải bao trùm công việc con "${child.title}" (hạn hoàn thành ${format(new Date(child.dueDate), "dd/MM/yyyy")})`,
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

  const handleApplyFilters = () => {
    const range = parseInt(timelineRange.monthsInput) || 6
    timelineRange.setMonthsRange(range)
    const newStart = new Date(timelineRange.yearInput, timelineRange.monthInput, 1)
    timelineRange.setTimelineStart(newStart)
    timelineRange.setTimelineEnd(addDays(newStart, range * 30 - 1))

    setAppliedFilterKeys([...activeFilterKeys])
    setAppliedFilterStates(JSON.parse(JSON.stringify(filterStates)))
    customQueries.clearUrlQueryId()
    toast.success("Đã áp dụng bộ lọc và dòng thời gian")
  }

  const handleClearFilters = () => {
    timelineRange.resetTimelineToProjectStart()
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
    customQueries.clearUrlQueryId()
    toast.info("Đã khôi phục bộ lọc mặc định")
  }

  const handleQuickQuery = (type: string) => {
    customQueries.clearUrlQueryId()

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
    ...timelineRange,
    ...customQueries,
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
    ganttData,
    isLoading,
    updateTaskMutation,
    assignees,
    statuses,
    isLoadingStatuses,
    getDefaultOperator: getDefaultGanttOperator,
    getDefaultValue: (key: string) => getDefaultGanttValue(key, assignees),
    treeTasks,
    isLeader: project.teamLeaderId === user?.id,
    isAdminOrGM: hasAnyPermission(["project.update", "project.task.approve"]),
    getTaskGridStyle: getTaskGridStyleFn,
    shiftTaskDates,
    handleApplyFilters,
    handleClearFilters,
    handleQuickQuery,
  }
}
