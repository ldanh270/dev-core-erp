import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  MoreVertical,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Save,
} from "lucide-react"
import { toast } from "sonner"

import { PageCard, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { customQueryApi } from "@/lib/api/custom-query.api"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import { taskApi } from "@/lib/api/task.api"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { extractErrorMessage } from "@/utils/error-helper"
import {
  TASK_TRACKERS,
  TASK_PRIORITIES,
} from "@/config/entities/project.config"
import type { Task, TaskTracker, TaskPriority } from "@/types/task.types"
import type { ProjectMember } from "@/types/project.types"
import LogTimeModal from "@/components/features/project/LogTimeModal"
import { TaskContextMenu } from "./task-context-menu"
import { useTaskUrlFilters } from "../hooks/use-task-url-filters"

/**
 * Properties for ProjectIssuesTab component.
 */
interface ProjectIssuesTabProps {
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

const ALL_FILTER_VALUE = "all"

/**
 * Issues list tab component. Handles searching, sorting, advanced filters,
 * custom query persistence, pagination, and deletion of project tasks.
 */

const formatStatus = (status: string) => {
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

const AVAILABLE_COLUMNS = [
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
  { key: "updatedAt", label: "Cập nhật" }
]

const COLUMN_METADATA = {
  id: {
    label: "ID",
    className: "w-16 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">
        #{task.id.substring(0, 5)}
      </TableCell>
    )
  },
  tracker: {
    label: "Kiểu công việc",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => {
      let trackerColor = "bg-secondary text-secondary-foreground border-border"
      if (task.tracker === "bug") {
        trackerColor = "bg-destructive/10 text-destructive border-destructive/20"
      } else if (task.tracker === "feature") {
        trackerColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
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
    }
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
    )
  },
  assignee: {
    label: "Người thực hiện",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs">
        {task.assignee ? (
          <span className="font-semibold text-foreground">
            {task.assignee.fullName}
          </span>
        ) : (
          <span className="text-muted-foreground italic">Không chỉ định</span>
        )}
      </TableCell>
    )
  },
  status: {
    label: "Trạng thái",
    className: "w-28 font-semibold text-xs",
    render: (task: Task, statuses: { id: string; name: string; isCompleted: boolean }[]) => {
      const customStatus = statuses.find((s) => s.id === task.statusId)
      const label = customStatus ? customStatus.name : formatStatus(task.status)
      const isCompleted = customStatus ? customStatus.isCompleted : (task.status === "done" || task.status === "cancelled")
      const variant = isCompleted ? "success" : (customStatus?.name.toLowerCase().includes("progress") ? "warning" : "info")
      return (
        <TableCell>
          <StatusPill
            label={label}
            variant={variant}
          />
        </TableCell>
      )
    }
  },
  priority: {
    label: "Mức ưu tiên",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => {
      let priorityColor = "bg-secondary text-secondary-foreground"
      if (task.priority === "urgent") {
        priorityColor = "bg-destructive/10 text-destructive border-destructive/20"
      } else if (task.priority === "high") {
        priorityColor =
          "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
      } else if (task.priority === "medium") {
        priorityColor =
          "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
      }
      return (
        <TableCell>
          <Badge variant="outline" className={`rounded-full text-[9px] ${priorityColor}`}>
            {task.priority}
          </Badge>
        </TableCell>
      )
    }
  },
  progress: {
    label: "Tiến độ",
    className: "w-16 text-right font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-right font-bold text-xs">
        {task.progress}%
      </TableCell>
    )
  },
  author: {
    label: "Tác giả",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-foreground font-semibold">
        {task.createdBy ? task.createdBy.fullName : "Chưa rõ"}
      </TableCell>
    )
  },
  startDate: {
    label: "Bắt đầu",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    )
  },
  dueDate: {
    label: "Hết hạn",
    className: "w-24 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    )
  },
  estimatedTime: {
    label: "Thời gian ước lượng",
    className: "w-24 font-semibold text-xs text-right",
    render: (task: Task) => (
      <TableCell className="text-xs text-right font-mono font-semibold">
        {task.estimatedTime ? `${task.estimatedTime}h` : "-"}
      </TableCell>
    )
  },
  updatedAt: {
    label: "Cập nhật",
    className: "w-28 font-semibold text-xs",
    render: (task: Task) => (
      <TableCell className="text-xs text-muted-foreground font-mono">
        {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("vi-VN") : "-"}
      </TableCell>
    )
  }
}

export function ProjectIssuesTab({
  projectId,
  members,
  teamLeader,
  user,
}: ProjectIssuesTabProps) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedUrlQueryId, setAppliedUrlQueryId] = useState<string | null>(null)

  // Filter & Pagination States with 2-way URL synchronization
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

  // Context Menu & Log Time States
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

  // Display Columns State
  const [displayColumns, setDisplayColumns] = useState<string[]>([
    "id",
    "tracker",
    "title",
    "assignee",
    "status",
    "priority",
    "progress",
  ])

  // New Query Form States
  const [isNewQueryOpen, setIsNewQueryOpen] = useState(false)
  const [newQueryName, setNewQueryName] = useState("")
  const [newQueryDesc, setNewQueryDesc] = useState("")
  const [newQueryForAll, setNewQueryForAll] = useState(false)
  const [newQueryDefaultCols, setNewQueryDefaultCols] = useState(true)
  const [newQueryShowRelated, setNewQueryShowRelated] = useState(true)
  const [newQueryShowProgress, setNewQueryShowProgress] = useState(false)

  
  const [newQuerySelectedCols, setNewQuerySelectedCols] = useState<string[]>([
    "id",
    "tracker",
    "title",
    "assignee",
    "status",
    "priority",
    "progress",
  ])
  const [availSelectedKey, setAvailSelectedKey] = useState<string | null>(null)
  const [selSelectedKey, setSelSelectedKey] = useState<string | null>(null)

  const [newQueryFilters, setNewQueryFilters] = useState({
    status: { enabled: true, value: "open" },
    tracker: { enabled: false, value: "all" },
    priority: { enabled: false, value: "all" },
    assignee: { enabled: false, value: "all" },
    createdBy: { enabled: false, value: "all" }
  })

  // Fetch custom queries for this project and type 'issues'
  const { data: savedQueries = [] } = useQuery({
    queryKey: ["customQueries", projectId, "issues"],
    queryFn: () => customQueryApi.list(projectId, "issues"),
    enabled: !!projectId,
  })

  const urlQueryId = searchParams.get("queryId")

  useEffect(() => {
    if (urlQueryId && savedQueries.length > 0 && urlQueryId !== appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          
          if (data.defaultColumns) {
// eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayColumns(["id", "tracker", "title", "assignee", "status", "priority", "progress"])
          } else if (Array.isArray(data.selectedColumns)) {
            setDisplayColumns(data.selectedColumns)
          }
          
          if (data.filters) {
            if (data.filters.status?.enabled) {
              setStatusFilter(data.filters.status.value)
            } else {
              setStatusFilter(ALL_FILTER_VALUE)
            }
            if (data.filters.tracker?.enabled) {
              setTrackerFilter(data.filters.tracker.value)
            } else {
              setTrackerFilter(ALL_FILTER_VALUE)
            }
            if (data.filters.priority?.enabled) {
              setPriorityFilter(data.filters.priority.value)
            } else {
              setPriorityFilter(ALL_FILTER_VALUE)
            }
            if (data.filters.assignee?.enabled) {
              setAssigneeFilter(data.filters.assignee.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.assignee.value)
            } else {
              setAssigneeFilter(ALL_FILTER_VALUE)
            }
            if (data.filters.createdBy?.enabled) {
              setCreatedByIdFilter(data.filters.createdBy.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.createdBy.value)
            } else {
              setCreatedByIdFilter(ALL_FILTER_VALUE)
            }
          }
          setAppliedUrlQueryId(urlQueryId)
          toast.success(`Đã tự động áp dụng truy vấn: ${matched.name}`)
        } catch (e) {
          console.error("Error parsing URL query data", e)
        }
      }
    }
  }, [urlQueryId, savedQueries, appliedUrlQueryId, user])

  // Clear URL queryId when filters are manually changed
  useEffect(() => {
    if (urlQueryId && appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          const matchStatus = data.filters?.status?.enabled ? data.filters.status.value : ALL_FILTER_VALUE
          const matchTracker = data.filters?.tracker?.enabled ? data.filters.tracker.value : ALL_FILTER_VALUE
          const matchPriority = data.filters?.priority?.enabled ? data.filters.priority.value : ALL_FILTER_VALUE
          const matchAssignee = data.filters?.assignee?.enabled ? (data.filters.assignee.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.assignee.value) : ALL_FILTER_VALUE
          const matchCreatedBy = data.filters?.createdBy?.enabled ? (data.filters.createdBy.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.createdBy.value) : ALL_FILTER_VALUE

          if (
            statusFilter !== matchStatus ||
            trackerFilter !== matchTracker ||
            priorityFilter !== matchPriority ||
            assigneeFilter !== matchAssignee ||
            createdByIdFilter !== matchCreatedBy
          ) {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete("queryId")
            setSearchParams(newParams)
// eslint-disable-next-line react-hooks/set-state-in-effect
            setAppliedUrlQueryId(null)
          }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // ignore
        }
      }
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    trackerFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
    urlQueryId,
    appliedUrlQueryId,
    savedQueries,
    user
  ])

  // Save query mutation
  const saveQueryMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: string | null; queryData: string }) => {
      return customQueryApi.create({
        name: data.name,
        type: "issues",
        projectId: data.projectId,
        queryData: data.queryData,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customQueries", projectId, "issues"] })
      toast.success("Đã lưu truy vấn thành công")
      setIsNewQueryOpen(false)
      // Reset form
      setNewQueryName("")
      setNewQueryDesc("")
      setNewQueryForAll(false)
      setNewQueryDefaultCols(true)
      setNewQueryShowRelated(true)
      setNewQueryShowProgress(false)

      setNewQuerySelectedCols(["id", "tracker", "title", "assignee", "status", "priority", "progress"])
      setNewQueryFilters({
        status: { enabled: true, value: "open" },
        tracker: { enabled: false, value: "all" },
        priority: { enabled: false, value: "all" },
        assignee: { enabled: false, value: "all" },
        createdBy: { enabled: false, value: "all" }
      })
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  // Delete query mutation
  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      return customQueryApi.delete(id)
    },
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ["customQueries", projectId, "issues"] })
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

  // Apply saved query
  const applySavedQuery = (q: CustomQuery) => {
    try {
      const data = JSON.parse(q.queryData)
      
      // Set columns
      if (data.defaultColumns) {
        setDisplayColumns(["id", "tracker", "title", "assignee", "status", "priority", "progress"])
      } else if (Array.isArray(data.selectedColumns)) {
        setDisplayColumns(data.selectedColumns)
      }
      
      // Set filters
      if (data.filters) {
        if (data.filters.status?.enabled) {
          setStatusFilter(data.filters.status.value)
        } else {
          setStatusFilter(ALL_FILTER_VALUE)
        }
        if (data.filters.tracker?.enabled) {
          setTrackerFilter(data.filters.tracker.value)
        } else {
          setTrackerFilter(ALL_FILTER_VALUE)
        }
        if (data.filters.priority?.enabled) {
          setPriorityFilter(data.filters.priority.value)
        } else {
          setPriorityFilter(ALL_FILTER_VALUE)
        }
        if (data.filters.assignee?.enabled) {
          setAssigneeFilter(data.filters.assignee.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.assignee.value)
        } else {
          setAssigneeFilter(ALL_FILTER_VALUE)
        }
        if (data.filters.createdBy?.enabled) {
          setCreatedByIdFilter(data.filters.createdBy.value === "me" ? (user?.id || ALL_FILTER_VALUE) : data.filters.createdBy.value)
        } else {
          setCreatedByIdFilter(ALL_FILTER_VALUE)
        }
      }

      setAppliedUrlQueryId(q.id)
      const newParams = new URLSearchParams(searchParams)
      newParams.set("queryId", q.id)
      setSearchParams(newParams)

      toast.success(`Đã áp dụng truy vấn: ${q.name}`)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      toast.error("Không thể đọc dữ liệu truy vấn đã lưu")
    }
  }

  const handleSubmitSaveQuery = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueryName.trim()) return

    const queryDataObj = {
      description: newQueryDesc.trim(),
      defaultColumns: newQueryDefaultCols,
      selectedColumns: newQuerySelectedCols,
      filters: newQueryFilters,
    }

    saveQueryMutation.mutate({
      name: newQueryName.trim(),
      projectId: newQueryForAll ? null : projectId,
      queryData: JSON.stringify(queryDataObj),
    })
  }

  // Fetch project statuses
  const { data: statuses = [] } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  // Reset page number back to 1 when filters are updated
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1)
  }, [
    issueSearch,
    trackerFilter,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
  ])

  // Fetch paginated, filtered tasks list
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
        priority: priorityFilter === ALL_FILTER_VALUE ? undefined : (priorityFilter as TaskPriority),
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

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    return pages
  }


  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main Issues list table container */}
      <div className="col-span-12 lg:col-span-9 space-y-4">
        {/* Filters Toolbar */}
        <PageCard className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm công việc..."
              value={issueSearch}
              onChange={(e) => { setIssueSearch(e.target.value); }}
              className="pl-11 h-9 text-xs border-border rounded-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tracker Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tracker:
              </Label>
              <Select value={trackerFilter} onValueChange={setTrackerFilter}>
                <SelectTrigger className="w-24 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {TASK_TRACKERS.map((tr) => (
                    <SelectItem key={tr} value={tr}>{tr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái:
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {statuses.map((st) => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Độ ưu tiên:
              </Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-28 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {TASK_PRIORITIES.map((pr) => (
                    <SelectItem key={pr} value={pr}>{pr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Người thực hiện:
              </Label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-32 h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-popover">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
                  {teamLeader && (
                    <SelectItem value={teamLeader.id}>
                      {teamLeader.fullName} (TL)
                    </SelectItem>
                  )}
                  {members.map((m) => (
                    <SelectItem key={m.employeeId} value={m.employeeId}>
                      {m.employee?.fullName || "Chưa rõ"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PageCard>

        {/* Issues table card */}
        <PageCard className="p-6">
          {isLoadingTasks ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-secondary p-3 mb-4 text-muted-foreground">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Không tìm thấy công việc nào</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hãy thiết lập bộ lọc khác hoặc tạo công việc mới.
              </p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent h-10">
                      {displayColumns.map((colKey) => {
                        const col = COLUMN_METADATA[colKey as keyof typeof COLUMN_METADATA]
                        return (
                          <TableHead key={colKey} className={col.className}>
                            {col.label}
                          </TableHead>
                        )
                      })}
                      <TableHead className="w-10 font-semibold text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className="h-14 hover:bg-muted/30 cursor-pointer"
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            isOpen: true,
                            x: e.clientX,
                            y: e.clientY,
                            task,
                          })
                        }}
                      >
                        {displayColumns.map((colKey) => {
                          const col = COLUMN_METADATA[colKey as keyof typeof COLUMN_METADATA]
                          const renderFn = col.render as (t: Task, s?: typeof statuses) => React.ReactNode
                          if (colKey === "status") {
                            return renderFn(task, statuses)
                          }
                          return renderFn(task)
                        })}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setContextMenu({
                                isOpen: true,
                                x: rect.left,
                                y: rect.bottom,
                                task,
                              })
                            }}
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-semibold">
                  Hiện tổng: {startRange}-{endRange}/{totalItems}
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-full p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                    >
                      «
                    </Button>
                    {getPageNumbers().map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="text-xs text-muted-foreground font-semibold px-2"
                          >
                            ...
                          </span>
                        )
                      }
                      const pageNum = p as number
                      const isCurrent = pageNum === currentPage
                      return (
                        <Button
                          key={`page-${pageNum}`}
                          variant={isCurrent ? "default" : "ghost"}
                          size="icon"
                          onClick={() => {
                            setCurrentPage(pageNum)
                          }}
                          className={`rounded-full size-7 p-0 text-xs font-bold ${
                            isCurrent
                              ? "bg-primary text-primary-foreground hover:bg-primary/95"
                              : "hover:bg-background"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
                    >
                      »
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Mỗi trang:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-16 h-8 border-border rounded-full text-xs font-bold bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover">
                      {["10", "25", "50", "100"].map((size) => (
                        <SelectItem key={size} value={size} className="rounded-lg text-xs font-semibold">
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </PageCard>
      </div>

      {/* Sidebar Queries filters section */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <PageCard className="p-4 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            Truy vấn nhanh
          </h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setAssigneeFilter(user?.id || ALL_FILTER_VALUE)
                setCreatedByIdFilter(ALL_FILTER_VALUE)
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                assigneeFilter === user?.id && createdByIdFilter === ALL_FILTER_VALUE
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Phân công cho tôi
            </button>
            <button
              onClick={() => {
                setCreatedByIdFilter(user?.id || ALL_FILTER_VALUE)
                setAssigneeFilter(ALL_FILTER_VALUE)
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                createdByIdFilter === user?.id && assigneeFilter === ALL_FILTER_VALUE
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Do tôi tạo
            </button>
            <button
              onClick={() => {
                setSortBy("updatedAt")
                setSortOrder("desc")
              }}
              className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                sortBy === "updatedAt" && sortOrder === "desc"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              Cập nhật gần đây
            </button>
            <button
              onClick={() => {
                setAssigneeFilter(ALL_FILTER_VALUE)
                setCreatedByIdFilter(ALL_FILTER_VALUE)
                setTrackerFilter(ALL_FILTER_VALUE)
                setStatusFilter(ALL_FILTER_VALUE)
                setPriorityFilter(ALL_FILTER_VALUE)
                setIssueSearch("")
                setSortBy("createdAt")
                setSortOrder("desc")
                setDisplayColumns([
                  "id",
                  "tracker",
                  "title",
                  "assignee",
                  "status",
                  "priority",
                  "progress",
                ])
              }}
              className="text-left text-xs font-semibold px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-dashed border-border mt-2 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        </PageCard>

        {/* Saved Custom Queries Card */}
        <PageCard className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Truy vấn riêng
            </h4>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => { setIsNewQueryOpen(true); }}
              className="rounded-full cursor-pointer hover:bg-muted text-primary"
              title="Tạo truy vấn mới"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            {savedQueries && savedQueries.length > 0 ? (
              savedQueries.map((q) => (
                <div key={q.id} className="flex items-center justify-between group">
                  <button
                    onClick={() => { applySavedQuery(q); }}
                    className="text-left text-xs font-semibold px-2 py-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:underline truncate max-w-[170px]"
                    title={q.name}
                  >
                    {q.name}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Bạn chắc chắn muốn xóa truy vấn "${q.name}"?`)) {
                        deleteQueryMutation.mutate(q.id)
                      }
                    }}
                    className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0 cursor-pointer"
                    title="Xóa truy vấn này"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic px-2">Chưa có truy vấn nào được lưu</span>
            )}
          </div>
        </PageCard>
      </div>

      {/* Dialog for Creating New Custom Query */}
      <Dialog open={isNewQueryOpen} onOpenChange={setIsNewQueryOpen}>
        <DialogContent className="max-w-3xl rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Save className="size-4 text-primary" />
              Truy vấn mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitSaveQuery} className="space-y-4 pt-2">
            {/* Top inputs block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="query-name" className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                  Tên truy vấn <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="query-name"
                  value={newQueryName}
                  onChange={(e) => { setNewQueryName(e.target.value); }}
                  placeholder="Ví dụ: Công việc mở tuần này..."
                  className="h-9 text-xs rounded-full border-border"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="query-desc" className="text-xs font-semibold text-foreground">
                  Mô tả
                </Label>
                <Input
                  id="query-desc"
                  value={newQueryDesc}
                  onChange={(e) => { setNewQueryDesc(e.target.value); }}
                  placeholder="Mô tả mục đích của truy vấn..."
                  className="h-9 text-xs rounded-full border-border"
                />
              </div>
            </div>

            {/* Checkbox For All Projects */}
            <div className="flex items-center gap-2">
              <input
                id="query-for-all"
                type="checkbox"
                checked={newQueryForAll}
                onChange={(e) => { setNewQueryForAll(e.target.checked); }}
                className="rounded border-border size-4"
              />
              <Label htmlFor="query-for-all" className="text-xs font-semibold cursor-pointer">
                Cho mọi dự án
              </Label>
            </div>

            {/* Options section */}
            <div className="border-t border-border pt-3 space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tùy chọn</span>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="query-default-cols"
                    type="checkbox"
                    checked={newQueryDefaultCols}
                    onChange={(e) => {
                      setNewQueryDefaultCols(e.target.checked)
                      if (e.target.checked) {
                        setNewQuerySelectedCols(["id", "tracker", "title", "assignee", "status", "priority", "progress"])
                      }
                    }}
                    className="rounded border-border size-4"
                  />
                  <Label htmlFor="query-default-cols" className="text-xs font-semibold cursor-pointer">
                    Cột mặc định
                  </Label>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold pl-1">
                  <span className="text-muted-foreground">Hiện:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQueryShowRelated}
                      onChange={(e) => { setNewQueryShowRelated(e.target.checked); }}
                      className="rounded border-border size-3.5"
                    />
                    Liên quan
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQueryShowProgress}
                      onChange={(e) => { setNewQueryShowProgress(e.target.checked); }}
                      className="rounded border-border size-3.5"
                    />
                    Tiến độ
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!newQueryDefaultCols}
                      onChange={(e) => {
                        setNewQueryDefaultCols(!e.target.checked)
                        if (!e.target.checked) {
                          setNewQuerySelectedCols(["id", "tracker", "title", "assignee", "status", "priority", "progress"])
                        }
                      }}
                      className="rounded border-border size-3.5"
                    />
                    Các cột được lựa chọn
                  </label>
                </div>
              </div>
            </div>

            {/* Filters section */}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bộ lọc</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thêm lọc:</span>
                  <Select
                    value=""
                    onValueChange={(filterKey) => {
                      setNewQueryFilters(prev => ({
                        ...prev,
                        [filterKey]: { ...prev[filterKey as keyof typeof prev], enabled: true }
                      }))
                    }}
                  >
                    <SelectTrigger className="w-36 h-7 text-[10px] border-border rounded-full bg-background">
                      <SelectValue placeholder="Chọn bộ lọc..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-popover">
                      {!newQueryFilters.status.enabled && <SelectItem value="status" className="text-xs">Trạng thái</SelectItem>}
                      {!newQueryFilters.tracker.enabled && <SelectItem value="tracker" className="text-xs">Kiểu công việc</SelectItem>}
                      {!newQueryFilters.priority.enabled && <SelectItem value="priority" className="text-xs">Mức ưu tiên</SelectItem>}
                      {!newQueryFilters.assignee.enabled && <SelectItem value="assignee" className="text-xs">Người thực hiện</SelectItem>}
                      {!newQueryFilters.createdBy.enabled && <SelectItem value="createdBy" className="text-xs">Tác giả</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {newQueryFilters.status.enabled && (
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
                      <input
                        type="checkbox"
                        checked={newQueryFilters.status.enabled}
                        onChange={(e) => {
                          setNewQueryFilters(prev => ({
                            ...prev,
                            status: { ...prev.status, enabled: e.target.checked }
                          }))
                        }}
                        className="rounded border-border size-3.5"
                      />
                      Trạng thái
                    </label>
                    <Select
                      value={newQueryFilters.status.value}
                      onValueChange={(val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          status: { ...prev.status, value: val }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        <SelectItem value="open">mở (open)</SelectItem>
                        <SelectItem value="all">tất cả (all)</SelectItem>
                        {statuses.map(st => (
                          <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newQueryFilters.tracker.enabled && (
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
                      <input
                        type="checkbox"
                        checked={newQueryFilters.tracker.enabled}
                        onChange={(e) => {
                          setNewQueryFilters(prev => ({
                            ...prev,
                            tracker: { ...prev.tracker, enabled: e.target.checked }
                          }))
                        }}
                        className="rounded border-border size-3.5"
                      />
                      Kiểu công việc
                    </label>
                    <Select
                      value={newQueryFilters.tracker.value}
                      onValueChange={(val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          tracker: { ...prev.tracker, value: val }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        <SelectItem value="all">tất cả</SelectItem>
                        {TASK_TRACKERS.map(tr => (
                          <SelectItem key={tr} value={tr}>{tr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newQueryFilters.priority.enabled && (
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
                      <input
                        type="checkbox"
                        checked={newQueryFilters.priority.enabled}
                        onChange={(e) => {
                          setNewQueryFilters(prev => ({
                            ...prev,
                            priority: { ...prev.priority, enabled: e.target.checked }
                          }))
                        }}
                        className="rounded border-border size-3.5"
                      />
                      Mức ưu tiên
                    </label>
                    <Select
                      value={newQueryFilters.priority.value}
                      onValueChange={(val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          priority: { ...prev.priority, value: val }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        <SelectItem value="all">tất cả</SelectItem>
                        {TASK_PRIORITIES.map(pr => (
                          <SelectItem key={pr} value={pr}>{pr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newQueryFilters.assignee.enabled && (
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
                      <input
                        type="checkbox"
                        checked={newQueryFilters.assignee.enabled}
                        onChange={(e) => {
                          setNewQueryFilters(prev => ({
                            ...prev,
                            assignee: { ...prev.assignee, enabled: e.target.checked }
                          }))
                        }}
                        className="rounded border-border size-3.5"
                      />
                      Người thực hiện
                    </label>
                    <Select
                      value={newQueryFilters.assignee.value}
                      onValueChange={(val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          assignee: { ...prev.assignee, value: val }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        <SelectItem value="all">tất cả</SelectItem>
                        <SelectItem value="me">Tôi (Người đăng nhập)</SelectItem>
                        {teamLeader && (
                          <SelectItem value={teamLeader.id}>
                            {teamLeader.fullName} (TL)
                          </SelectItem>
                        )}
                        {members.map(m => (
                          <SelectItem key={m.employeeId} value={m.employeeId}>
                            {m.employee?.fullName || "Chưa rõ"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newQueryFilters.createdBy.enabled && (
                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-2 text-xs font-semibold w-32 shrink-0">
                      <input
                        type="checkbox"
                        checked={newQueryFilters.createdBy.enabled}
                        onChange={(e) => {
                          setNewQueryFilters(prev => ({
                            ...prev,
                            createdBy: { ...prev.createdBy, enabled: e.target.checked }
                          }))
                        }}
                        className="rounded border-border size-3.5"
                      />
                      Tác giả
                    </label>
                    <Select
                      value={newQueryFilters.createdBy.value}
                      onValueChange={(val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          createdBy: { ...prev.createdBy, value: val }
                        }))
                      }}
                    >
                      <SelectTrigger className="w-44 h-8 text-xs border-border rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-popover">
                        <SelectItem value="all">tất cả</SelectItem>
                        <SelectItem value="me">Tôi (Người tạo)</SelectItem>
                        {teamLeader && (
                          <SelectItem value={teamLeader.id}>
                            {teamLeader.fullName} (TL)
                          </SelectItem>
                        )}
                        {members.map(m => (
                          <SelectItem key={m.employeeId} value={m.employeeId}>
                            {m.employee?.fullName || "Chưa rõ"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Columns selection section */}
            {!newQueryDefaultCols && (
              <div className="space-y-2 border-t border-border pt-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cột</span>
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Available */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Các cột có sẵn</label>
                    <select
                      multiple
                      size={6}
                      value={availSelectedKey ? [availSelectedKey] : []}
                      onChange={(e) => { setAvailSelectedKey(e.target.value); }}
                      className="w-full text-xs p-2 border border-border rounded-xl h-32 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {AVAILABLE_COLUMNS.filter(col => !newQuerySelectedCols.includes(col.key)).map(col => (
                        <option key={col.key} value={col.key} className="p-1 rounded-lg hover:bg-muted cursor-pointer">
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transfer buttons */}
                  <div className="col-span-2 flex flex-col gap-2 items-center justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!availSelectedKey}
                      onClick={() => {
                        if (availSelectedKey) {
                          setNewQuerySelectedCols(prev => [...prev, availSelectedKey])
                          setAvailSelectedKey(null)
                        }
                      }}
                      className="rounded-full h-8 w-8"
                    >
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => prev.filter(k => k !== selSelectedKey))
                          setSelSelectedKey(null)
                        }
                      }}
                      className="rounded-full h-8 w-8"
                    >
                      <ArrowLeft className="size-3.5" />
                    </Button>
                  </div>

                  {/* Selected */}
                  <div className="col-span-4 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Các cột được lựa chọn</label>
                    <select
                      multiple
                      size={6}
                      value={selSelectedKey ? [selSelectedKey] : []}
                      onChange={(e) => { setSelSelectedKey(e.target.value); }}
                      className="w-full text-xs p-2 border border-border rounded-xl h-32 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {newQuerySelectedCols.map(colKey => {
                        const col = AVAILABLE_COLUMNS.find(c => c.key === colKey)
                        return (
                          <option key={colKey} value={colKey} className="p-1 rounded-lg hover:bg-muted cursor-pointer">
                            {col ? col.label : colKey}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Reorder buttons */}
                  <div className="col-span-1 flex flex-col gap-1.5 items-center justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === 0}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const filtered = prev.filter(k => k !== selSelectedKey)
                            return [selSelectedKey, ...filtered]
                          })
                        }
                      }}
                      title="Đưa lên đầu"
                      className="rounded-full h-7 w-7"
                    >
                      <ChevronsUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === 0}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const idx = prev.indexOf(selSelectedKey)
                            if (idx > 0) {
                              const copy = [...prev]
                              copy[idx] = copy[idx - 1]
                              copy[idx - 1] = selSelectedKey
                              return copy
                            }
                            return prev
                          })
                        }
                      }}
                      title="Lên một vị trí"
                      className="rounded-full h-7 w-7"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === newQuerySelectedCols.length - 1}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const idx = prev.indexOf(selSelectedKey)
                            if (idx < prev.length - 1) {
                              const copy = [...prev]
                              copy[idx] = copy[idx + 1]
                              copy[idx + 1] = selSelectedKey
                              return copy
                            }
                            return prev
                          })
                        }
                      }}
                      title="Xuống một vị trí"
                      className="rounded-full h-7 w-7"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === newQuerySelectedCols.length - 1}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const filtered = prev.filter(k => k !== selSelectedKey)
                            return [...filtered, selSelectedKey]
                          })
                        }
                      }}
                      title="Đưa xuống cuối"
                      className="rounded-full h-7 w-7"
                    >
                      <ChevronsDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsNewQueryOpen(false); }}
                className="h-9 text-xs rounded-full cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!newQueryName.trim() || saveQueryMutation.isPending}
                className="h-9 text-xs rounded-full cursor-pointer"
              >
                {saveQueryMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Task Context Menu with Auto Positioning */}
      <TaskContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        task={contextMenu.task}
        projectMembers={members}
        statuses={statuses}
        onClose={() => {
          setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
        }}
        onUpdateTask={handleUpdateTask}
        onLogTime={(t) => {
          setLogTimeTask(t)
          setIsLogTimeOpen(true)
        }}
      />

      {/* Log Time Modal */}
      {logTimeTask && (
        <LogTimeModal
          open={isLogTimeOpen}
          onOpenChange={setIsLogTimeOpen}
          taskId={logTimeTask.id}
          taskTitle={logTimeTask.title}
        />
      )}
    </div>
  )
}
