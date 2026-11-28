import { useTaskUrlFilters } from "@/hooks/project/use-task-url-filters"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { taskApi } from "@/lib/api/task.api"
import type { ProjectMember } from "@/types/project.types"
import type { Task, TaskPriority, TaskTracker } from "@/types/task.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useEffect, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ALL_FILTER_VALUE } from "./issue-columns.config"
import { useIssuesCustomQueries } from "./useIssuesCustomQueries"
import { useIssuesCustomQueryForm } from "./useIssuesCustomQueryForm"

const DEFAULT_COLUMNS = ["id", "tracker", "title", "assignee", "status", "priority", "progress"]

export interface UseProjectIssuesTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role?: string
    fullName: string
  } | null
}

/** Tier 1 Business Hook coordinating issues list querying, sorting, filtering, and pagination. */
export function useProjectIssuesTab({ projectId, user }: UseProjectIssuesTabProps) {
  const queryClient = useQueryClient()

  const {
    issueSearch,
    setIssueSearch,
    trackerFilter,
    setTrackerFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    createdByIdFilter,
    setCreatedByIdFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = useTaskUrlFilters()

  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<string>("desc")

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    task: Task | null
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    task: null,
  })

  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeTask, setLogTimeTask] = useState<{ id: string; title: string } | null>(null)
  const [displayColumns, setDisplayColumns] = useState<string[]>(DEFAULT_COLUMNS)

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; data: Record<string, unknown> }) => {
      return taskApi.update(payload.taskId, payload.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks", "overview", projectId] })
      toast.success("Cập nhật công việc thành công")
      setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const handleUpdateTask = (data: Record<string, unknown>) => {
    if (!contextMenu.task) return
    updateTaskMutation.mutate({ taskId: contextMenu.task.id, data })
  }

  const queryForm = useIssuesCustomQueryForm()

  const customQueries = useIssuesCustomQueries({
    projectId,
    user,
    statusFilter,
    trackerFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
    setStatusFilter,
    setTrackerFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setCreatedByIdFilter,
    setDisplayColumns,
    onSaveSuccess: queryForm.resetForm,
  })

  const handleSubmitSaveQuery = (e: React.FormEvent) => {
    queryForm.handleSubmitSaveQuery(
      e,
      (payload) => {
        customQueries.saveQueryMutation.mutate(payload)
      },
      projectId,
    )
  }

  const { data: statuses = [] } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [
    issueSearch,
    trackerFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
    setCurrentPage,
  ])

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: [
      "tasks",
      "project",
      projectId,
      currentPage,
      pageSize,
      issueSearch,
      trackerFilter,
      statusFilter,
      priorityFilter,
      assigneeFilter,
      createdByIdFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      taskApi.list({
        projectId,
        page: currentPage,
        limit: pageSize,
        search: issueSearch || undefined,
        tracker: trackerFilter === ALL_FILTER_VALUE ? undefined : (trackerFilter as TaskTracker),
        statusId: statusFilter === ALL_FILTER_VALUE ? undefined : statusFilter,
        priority:
          priorityFilter === ALL_FILTER_VALUE ? undefined : (priorityFilter as TaskPriority),
        assigneeId: assigneeFilter === ALL_FILTER_VALUE ? undefined : assigneeFilter,
        createdById: createdByIdFilter === ALL_FILTER_VALUE ? undefined : createdByIdFilter,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      }),
    enabled: !!projectId,
  })

  const tasks = tasksData?.data || []
  const totalItems = tasksData?.meta.total || 0
  const totalPages = tasksData?.meta.totalPages || 1
  const startRange = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRange = Math.min(currentPage * pageSize, totalItems)

  const clearAllFilters = () => {
    setAssigneeFilter(ALL_FILTER_VALUE)
    setCreatedByIdFilter(ALL_FILTER_VALUE)
    setTrackerFilter(ALL_FILTER_VALUE)
    setStatusFilter(ALL_FILTER_VALUE)
    setPriorityFilter(ALL_FILTER_VALUE)
    setIssueSearch("")
    setSortBy("createdAt")
    setSortOrder("desc")
    setDisplayColumns(DEFAULT_COLUMNS)
  }

  return {
    issueSearch,
    setIssueSearch,
    trackerFilter,
    setTrackerFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    createdByIdFilter,
    setCreatedByIdFilter,
    clearAllFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    displayColumns,
    setDisplayColumns,
    tasks,
    statuses,
    isLoadingTasks,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    startRange,
    endRange,
    ...customQueries,
    ...queryForm,
    handleSubmitSaveQuery,
    isSavingQuery: customQueries.saveQueryMutation.isPending,
    contextMenu,
    setContextMenu,
    handleUpdateTask,
    isLogTimeOpen,
    setIsLogTimeOpen,
    logTimeTask,
    setLogTimeTask,
  }
}
