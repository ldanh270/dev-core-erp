import { PageCard, SafeHtml, StatusPill } from "@/components/common"
import LogTimeModal from "@/components/features/project/LogTimeModal"
import { TaskAssigneeAiModal } from "./components/task-assignee-ai-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SPENT_TIME_STATUS,
  TASK_PRIORITIES,
  TASK_STATUS,
  getSpentTimeStatusLabel,
  PROJECT_ROLE,
} from "@/config/entities/project.config"
import { SPENT_TIME_UI, getSpentTimeStatusPillVariant } from "@/config/rules/spent-time.config"
import { usePermission } from "@/hooks/use-permission"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import { useProfile } from "@/hooks/use-profile"
import { useProjectTrackers } from "@/pages/project/hooks/use-project-tracker"
// Import React Query hooks for fetching and mutations
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// Import toast notification client
import { toast } from "sonner"
import { extractErrorMessage } from "@/utils/error-helper"
import type { SpentTime } from "@/types/spent-time.types"
import type { TaskTracker, TaskPriority } from "@/types/task.types"

import { useEffect, useState } from "react"

import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Edit,
  Folder,
  History,
  Plus,
  Trash2,
  User,
  X,
  Brain,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

/**
 * Helper function for cleanHtml.
 */
const cleanHtml = (html: string) => {
  if (!html) return null
  let insideTag = false
  let textLength = 0
  for (let i = 0; i < html.length; i++) {
    const char = html.charAt(i)
    if (char === "<") {
      insideTag = true
    } else if (char === ">") {
      insideTag = false
    } else if (!insideTag && /\S/.test(char)) {
      textLength++
    }
  }
  return textLength === 0 ? null : html.trim()
}

/**
 * Component representing the task detail view.
 * Enables team members to view detailed specifications, update metadata (trackers, status, assignee, priority, description),
 * log/review spent time records, and post/cancel review status checks.
 */
export default function TaskDetail() {
  // Initialize query client, route navigation, and auth store
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()

  // Extract task ID from URL parameters
  const { id: taskId } = useParams<{ id: string }>()

  // Resolve active task ID: prefer URL param, then sessionStorage
  const activeTaskId = taskId || sessionStorage.getItem("activeTaskId") || ""

  // Redirect to task-specific URL if accessing /project/task without an ID
  useEffect(() => {
    if (!taskId) {
      if (activeTaskId) {
        navigate(`/project/task/${activeTaskId}`, { replace: true })
      } else {
        toast.error("Vui lòng chọn một công việc để xem chi tiết")
        navigate("/project/list", { replace: true })
      }
    } else {
      sessionStorage.setItem("activeTaskId", taskId)
    }
  }, [taskId, activeTaskId, navigate])

  const id = taskId || activeTaskId

  // State hooks to control dialog modal views
  const [isOpenLogTimeModal, setIsOpenLogTimeModal] = useState(false) // Visibility of log time modal
  const [isOpenEditModal, setIsOpenEditModal] = useState(false) // Visibility of edit task modal
  const [isOpenAiModal, setIsOpenAiModal] = useState(false) // Visibility of AI suggestion modal
  const [editingSpentTime, setEditingSpentTime] = useState<SpentTime | undefined>(undefined) // Target log record to modify

  // State hooks to bind edit task form inputs
  const [taskTitle, setTaskTitle] = useState("") // Title text
  const [taskDesc, setTaskDesc] = useState("") // Description text
  const [taskTracker, setTaskTracker] = useState("") // Task tracker
  const [taskPriority, setTaskPriority] = useState("") // Task priority
  const [taskStatusId, setTaskStatusId] = useState("") // Custom status ID
  const [taskAssignee, setTaskAssignee] = useState("") // Task assignee ID
  const [taskStart, setTaskStart] = useState("") // Start date
  const [taskDue, setTaskDue] = useState("") // Due date
  const [taskEstimate, setTaskEstimate] = useState("") // Time estimate
  const [taskProgress, setTaskProgress] = useState(0) // Completion progress percentage
  const [resultNotes, setResultNotes] = useState("") // Product result notes
  const [resultUrl, setResultUrl] = useState("") // Product result URL
  const [resultTab, setResultTab] = useState<"report" | "optional">("optional") // Tab for result notes: "report" or "optional"
  const [editError, setEditError] = useState<string | null>(null) // Errors during form submission

  // 1. Query hook to fetch detailed data for the targeted task
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task", id],
    queryFn: () => taskApi.getOne(id),
    enabled: !!id,
  })

  // Capture project ID associated with this task
  const projectId = task?.projectId || ""

  // Synchronize active project ID with sessionStorage
  useEffect(() => {
    if (task?.projectId) {
      sessionStorage.setItem("activeProjectId", task.projectId)
    }
  }, [task?.projectId])

  // Query hook to fetch spent time records log belonging to this task (PT primary input)
  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", id],
    queryFn: () => taskApi.listSpentTimes({ taskId: id }),
    enabled: !!id,
  })

  // 3. Query hook to fetch active project members (populate assignee list)
  const { data: members } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  // 4. Query hook to fetch parent project details (permissions validation)
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  // 5. Query hook to fetch siblings tasks under the same project (enables prev/next navigations)
  const { data: siblingTasksData } = useQuery({
    queryKey: ["tasks", "siblings", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: !!projectId,
  })

  // Query hook to fetch project custom statuses
  const { data: statusesData } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })
  const statuses = statusesData || []

  // Auth context
  const { data: profile } = useProfile()

  // Fetch dynamic project trackers
  const { data: trackers = [] } = useProjectTrackers(projectId || "")

  // Helper to determine allowed trackers for the current user in this project
  const allowedTrackers = (() => {
    const activeTrackers = trackers.map(t => t.code)

    // Default allowed trackers based on project configuration (or fallback to all if empty)
    const projectAllowed = project?.allowedTaskTrackers && project.allowedTaskTrackers.length > 0
      ? project.allowedTaskTrackers
      : activeTrackers

    const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])

    const currentEmpId = profile?.personalEmployeeId || user?.personalEmployeeId || profile?.id || user?.id
    const currentMember = members?.find((m) => m.employeeId === currentEmpId)
    const isLeader = project?.teamLeaderId === user?.personalEmployeeId ||
                     project?.teamLeaderId === profile?.personalEmployeeId ||
                     project?.teamLeaderId === user?.id ||
                     project?.teamLeaderId === profile?.id ||
                     currentMember?.role?.code === PROJECT_ROLE.LEADER

    if (isAdminOrGM || isLeader) {
      return projectAllowed
    }

    const role = currentMember?.role
    if (role?.code === PROJECT_ROLE.VIEWER) {
      return []
    }

    if (role) {
      if (role.allowedTaskTrackers && role.allowedTaskTrackers.length > 0) {
        return role.allowedTaskTrackers.filter(tr => activeTrackers.length === 0 || activeTrackers.includes(tr))
      }
      return projectAllowed
    }

    return projectAllowed
  })()

  // Format helper for display
  const formatTracker = (trackerCode: string) => {
    const dbTracker = trackers.find(t => t.code === trackerCode)
    return dbTracker ? dbTracker.name : trackerCode
  }

  // Ensure current task tracker is included even if not allowed by current rules
  const trackersToDisplay = allowedTrackers.includes(taskTracker)
    ? allowedTrackers
    : taskTracker
      ? [taskTracker, ...allowedTrackers.filter(t => t !== taskTracker)]
      : allowedTrackers

  // PT task totals exclude rejected logs; pending + approved count toward estimate cap
  const totalSpentHours =
    spentTimes
      ?.filter((st) => st.status !== SPENT_TIME_STATUS.REJECTED)
      .reduce((sum, st) => sum + st.hours, 0) || 0

  // Check roles/permissions
  const isCreator = task?.createdById === user?.id
  const isAssignee = task?.assigneeId === user?.id
  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])

  // Who can edit this task: Admin/GM, TL, Creator, Assignee
  const canEditTask = isAdminOrGM || isLeader || isCreator || isAssignee

  // Open edit modal and populate state
  const handleOpenEdit = () => {
    if (!task) return
    setTaskTitle(task.title)
    setTaskDesc(task.description || "")
    setTaskTracker(task.tracker)
    setTaskPriority(task.priority)
    setTaskStatusId(task.statusId || "")
    setTaskAssignee(task.assigneeId || "none")
    setTaskStart(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "")
    setTaskDue(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    setTaskEstimate(task.estimatedTime ? String(task.estimatedTime) : "")
    setTaskProgress(task.progress)
    setResultNotes(task.resultNotes || "")
    setResultUrl(task.resultUrl || "")
    setResultTab(task.resultNotes || task.resultUrl ? "report" : "optional")
    setIsOpenEditModal(true)
  }

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return taskApi.update(id, {
        title: taskTitle,
        description: cleanHtml(taskDesc),
        tracker: taskTracker as TaskTracker,
        priority: taskPriority as TaskPriority,
        statusId: taskStatusId || null,
        assigneeId: taskAssignee === "none" ? null : taskAssignee,
        startDate: taskStart || null,
        dueDate: taskDue || null,
        estimatedTime: taskEstimate ? parseFloat(taskEstimate) : null,
        progress: Number(taskProgress),
        resultUrl: resultTab === "report" ? (resultUrl.trim() || null) : null,
        resultNotes: resultTab === "report" ? cleanHtml(resultNotes) : null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", id] })
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      setIsOpenEditModal(false)
      setEditError(null)
    },
    onError: (err: unknown) => {
      let errorMessage = "Đã xảy ra lỗi"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } })
          .response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setEditError(errorMessage)
    },
  })

  // Lead approval is required before PT hours flow into payroll
  const canApproveSpentTime = isAdminOrGM || isLeader

  const approveSpentTimeMutation = useMutation({
    mutationFn: (logId: string) => taskApi.approveSpentTime(logId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", id] })
      toast.success(SPENT_TIME_UI.TASK_TOAST_APPROVED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const rejectSpentTimeMutation = useMutation({
    mutationFn: ({ logId, reason }: { logId: string; reason: string }) =>
      taskApi.rejectSpentTime(logId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", id] })
      toast.success(SPENT_TIME_UI.TASK_TOAST_REJECTED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  // Delete Spent Time log mutation
  const deleteSpentTimeMutation = useMutation({
    mutationFn: async (logId: string) => {
      return taskApi.deleteSpentTime(logId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", id] })
      void queryClient.invalidateQueries({ queryKey: ["project"] })
    },
  })

  // Delete Task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return taskApi.delete(id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      navigate(`/project/${projectId}/overview`)
    },
  })

  const handleDeleteTask = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
      deleteTaskMutation.mutate()
    }
  }

  const siblingTasks = siblingTasksData?.data || []
  const currentTaskIndex = siblingTasks.findIndex((t) => t.id === id)
  const prevTaskId = currentTaskIndex > 0 ? siblingTasks[currentTaskIndex - 1].id : null
  const nextTaskId =
    currentTaskIndex < siblingTasks.length - 1 && currentTaskIndex !== -1
      ? siblingTasks[currentTaskIndex + 1].id
      : null

  if (isLoadingTask) {
    return (
      <div className="container p-8 space-y-6">
        <Skeleton className="h-10 w-1/3 rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container p-8 text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Không tìm thấy công việc</h3>
        <p className="text-sm text-muted-foreground">Công việc không tồn tại hoặc đã bị xóa.</p>
        <Button
          onClick={() => {
            navigate(-1)
          }}
          className="rounded-full"
        >
          Quay lại
        </Button>
      </div>
    )
  }

  // Formatting helpers
  const formatStatus = (status: string) => {
    if (status === TASK_STATUS.TODO) return "Đang mở"
    if (status === TASK_STATUS.IN_PROGRESS) return "Đang làm"
    if (status === TASK_STATUS.IN_REVIEW) return "Đánh giá"
    if (status === TASK_STATUS.DONE) return "Hoàn thành"
    if (status === TASK_STATUS.CANCELLED) return "Đã hủy"
    if (status === TASK_STATUS.REOPENED) return "Mở lại"
    return status
  }

  const formatPriority = (priority: string) => {
    if (priority === "low") return "Thấp"
    if (priority === "medium") return "Trung bình"
    if (priority === "high") return "Cao"
    if (priority === "urgent") return "Khẩn cấp"
    return priority
  }

  const getPriorityColor = (priority: string) => {
    if (priority === "urgent") return "bg-destructive/10 text-destructive border-destructive/20"
    if (priority === "high")
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
    if (priority === "medium")
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
    return "bg-secondary text-secondary-foreground"
  }

  const formatActivity = (act: string) => {
    if (act === "develop") return "Phát triển (Develop)"
    if (act === "design") return "Thiết kế (Design)"
    if (act === "test") return "Kiểm thử (Test)"
    if (act === "manage") return "Quản lý (Manage)"
    if (act === "other") return "Khác (Other)"
    return act
  }

  return (
    <div className="container p-8 space-y-6">
      {/* Top Header/Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 w-full md:min-w-[450px]">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link
                to="/project/list"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Folder className="size-3.5" />
                Dự án
              </Link>
              <span>/</span>
              <Link to={`/project/${projectId}/overview`} className="hover:text-primary transition-colors font-semibold">
                {task.project?.name || "Chi tiết dự án"}
              </Link>
              <span>/</span>
              <span className="font-mono text-muted-foreground">#{task.id.substring(0, 5)}</span>
            </div>

            {siblingTasks.length > 1 && (
              <div className="flex items-center gap-1 bg-secondary/50 border border-border/40 rounded-full px-2 py-0.5">
                <Button
                  variant="ghost"
                  disabled={!prevTaskId}
                  onClick={() => {
                    if (prevTaskId) {
                      sessionStorage.setItem("activeTaskId", prevTaskId)
                      navigate(`/project/task/${prevTaskId}`)
                    }
                  }}
                  className="rounded-full h-5 px-1.5 text-[9px] font-bold disabled:opacity-40 hover:bg-background cursor-pointer"
                >
                  « Trước
                </Button>
                <span className="text-muted-foreground font-mono text-[9px] px-1 select-none">
                  {currentTaskIndex !== -1 ? `${currentTaskIndex + 1}/${siblingTasks.length}` : "-"}
                </span>
                <Button
                  variant="ghost"
                  disabled={!nextTaskId}
                  onClick={() => {
                    if (nextTaskId) {
                      sessionStorage.setItem("activeTaskId", nextTaskId)
                      navigate(`/project/task/${nextTaskId}`)
                    }
                  }}
                  className="rounded-full h-5 px-1.5 text-[9px] font-bold disabled:opacity-40 hover:bg-background cursor-pointer"
                >
                  Sau »
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              {task.tracker}
            </Badge>
            <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingSpentTime(undefined)
              setIsOpenLogTimeModal(true)
            }}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 text-xs px-4"
          >
            <Plus className="size-4" />
            Ghi nhận thời gian (Log Time)
          </Button>

          {canEditTask && (
            <Button
              variant="outline"
              onClick={handleOpenEdit}
              className="rounded-full border-border hover:bg-muted/50 flex items-center gap-1.5 h-10 text-xs px-4"
            >
              <Edit className="size-4" />
              Chỉnh sửa
            </Button>
          )}

          {(isAdminOrGM || isLeader || isCreator) && (
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              className="rounded-full flex items-center gap-1.5 h-10 text-xs px-4 bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20 cursor-pointer"
            >
              <Trash2 className="size-4" />
              Xóa công việc
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Task Detail details */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main info panel */}
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
              Thông tin công việc
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Trạng thái:</span>
                {(() => {
                  const customStatus = statuses.find(
                    (s: ProjectTaskStatus) => s.id === task.statusId,
                  )
                  const label = customStatus ? customStatus.name : formatStatus(task.status)
                  const isCompleted = customStatus
                    ? customStatus.isCompleted
                    : task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.CANCELLED
                  const variant = isCompleted
                    ? "success"
                    : customStatus?.name.toLowerCase().includes("progress")
                      ? "warning"
                      : "info"
                  return <StatusPill label={label} variant={variant} />
                })()}
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Độ ưu tiên:</span>
                <Badge
                  variant="outline"
                  className={`rounded-full text-[10px] ${getPriorityColor(task.priority)}`}
                >
                  {formatPriority(task.priority)}
                </Badge>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Người thực hiện:</span>
                {task.assignee ? (
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <User className="size-3.5 text-muted-foreground" />
                    {task.assignee.fullName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Chưa chỉ định</span>
                )}
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Người báo cáo:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground" />
                  {task.createdBy?.fullName || "N/A"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Ngày bắt đầu:</span>
                <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Hạn hoàn thành:</span>
                <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Thời gian ước tính:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {task.estimatedTime ? `${task.estimatedTime} giờ` : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-muted-foreground">Tiến độ (% Done):</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">{task.progress}%</span>
                  <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PageCard>

          {/* Task description */}
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-3 border-b border-border pb-2">
              Mô tả chi tiết
            </h3>
            {task.description ? (
              <SafeHtml
                content={task.description}
                className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed"
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Không có mô tả chi tiết cho công việc này.
              </p>
            )}
          </PageCard>

          {/* Task results */}
          {task.resultNotes && (
            <PageCard className="p-6">
              <h3 className="font-bold text-base text-foreground mb-3 border-b border-border pb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                Kết quả công việc
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Ghi chú kết quả:
                  </span>
                  <SafeHtml
                    content={task.resultNotes}
                    className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40"
                  />
                </div>
              </div>
            </PageCard>
          )}
        </div>

        {/* Right Side: Spent Time logs — PT employees log here; lead approves before payroll */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <PageCard className="p-6">
            <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-muted-foreground" />
                {SPENT_TIME_UI.TASK_SECTION_TITLE}
              </span>
              <span className="text-xs bg-primary/10 text-primary font-bold rounded-full px-2.5 py-0.5">
                {totalSpentHours.toFixed(1)} {SPENT_TIME_UI.TASK_HOURS_SUFFIX}
              </span>
            </h3>

            {isLoadingSpent ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : !spentTimes || spentTimes.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                {SPENT_TIME_UI.TASK_EMPTY_LIST}
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {spentTimes.map((st) => {
                  const isLogOwner = st.employeeId === user?.id
                  const isPending = st.status === SPENT_TIME_STATUS.PENDING
                  const canDeleteLog = (isAdminOrGM || isLogOwner) && isPending
                  const canEditLog = canDeleteLog

                  const statusVariant = getSpentTimeStatusPillVariant(st.status)

                  return (
                    <div
                      key={st.id}
                      className="border border-border/60 rounded-xl p-3 bg-muted/10 hover:bg-muted/30 transition-colors space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {st.employee?.fullName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(st.date).toLocaleDateString("vi-VN")}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusPill
                            variant={statusVariant}
                            className="text-[9px] px-2 py-0"
                            label={getSpentTimeStatusLabel(st.status)}
                          />
                          <Badge
                            variant="outline"
                            className="rounded-full text-[9px] bg-primary/5 text-primary border-primary/10 font-black"
                          >
                            {st.hours} {SPENT_TIME_UI.TASK_HOURS_BADGE_SUFFIX}
                          </Badge>

                          {canApproveSpentTime && isPending && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-primary hover:bg-primary/10 rounded-full cursor-pointer size-6 p-0"
                                title={SPENT_TIME_UI.APPROVE_ACTION_TITLE}
                                onClick={() => {
                                  approveSpentTimeMutation.mutate(st.id)
                                }}
                                aria-label="Chỉnh sửa nhật ký thời gian"
                              >
                                <Check className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer size-6 p-0"
                                aria-label="Xóa nhật ký thời gian"
                                title={SPENT_TIME_UI.REJECT_ACTION_TITLE}
                                onClick={() => {
                                  const reason = window.prompt(SPENT_TIME_UI.REJECT_REASON_PROMPT)
                                  if (reason?.trim()) {
                                    rejectSpentTimeMutation.mutate({
                                      logId: st.id,
                                      reason: reason.trim(),
                                    })
                                  }
                                }}
                              >
                                <X className="size-3" />
                              </Button>
                            </>
                          )}

                          {canEditLog && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary hover:bg-primary/10 rounded-full cursor-pointer size-6 p-0"
                              onClick={() => {
                                setEditingSpentTime(st)
                                setIsOpenLogTimeModal(true)
                              }}
                            >
                              <Edit className="size-3" />
                            </Button>
                          )}
                          {canDeleteLog && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:bg-destructive/10 rounded-full cursor-pointer size-6 p-0"
                              onClick={() => {
                                if (window.confirm(SPENT_TIME_UI.TASK_DELETE_CONFIRM)) {
                                  deleteSpentTimeMutation.mutate(st.id)
                                }
                              }}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <History className="size-3 text-muted-foreground" />
                        {formatActivity(st.activity)}
                        {st.workTimeType === "overtime" ? " · OT" : ""}
                      </div>

                      {st.rejectionReason && (
                        <div className="text-[10px] text-destructive italic">
                          Lý do từ chối: {st.rejectionReason}
                        </div>
                      )}

                      {st.comment && (
                        <div className="text-xs text-muted-foreground italic bg-background/50 border border-border/40 p-2 rounded-lg mt-1">
                          "{st.comment}"
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </PageCard>
        </div>
      </div>

      {/* LOG TIME MODAL */}
      <LogTimeModal
        open={isOpenLogTimeModal}
        onOpenChange={setIsOpenLogTimeModal}
        taskId={task.id}
        taskTitle={task.title}
        spentTime={editingSpentTime}
        estimatedTime={task.estimatedTime}
        loggedHours={totalSpentHours}
      />

      {/* AI ASSIGNEE MODAL */}
      <TaskAssigneeAiModal
        isOpen={isOpenAiModal}
        onOpenChange={setIsOpenAiModal}
        taskId={task.id}
        onAssign={setTaskAssignee}
      />

      {/* EDIT TASK DIALOG */}
      <Dialog open={isOpenEditModal} onOpenChange={setIsOpenEditModal}>
        <DialogContent className="sm:max-w-[650px] rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Chỉnh sửa công việc
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cập nhật các thông tin chi tiết và tiến độ cho công việc này.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setEditError(null)
              if (!taskTitle.trim()) {
                setEditError("Vui lòng nhập tiêu đề công việc")
                return
              }
              if (taskStart && taskDue && new Date(taskStart) > new Date(taskDue)) {
                toast.warning("Ngày bắt đầu không được sau hạn hoàn thành")
                return
              }
              updateMutation.mutate()
            }}
            className="space-y-4 pt-3"
          >
            {editError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="editTitle" className="text-xs font-semibold text-muted-foreground">
                Tiêu đề công việc <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editTitle"
                value={taskTitle}
                onChange={(e) => {
                  setTaskTitle(e.target.value)
                }}
                className="h-10 text-sm border-border rounded-full px-4"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editDesc" className="text-xs font-semibold text-muted-foreground">
                Mô tả chi tiết
              </Label>
              <RichTextEditor
                value={taskDesc}
                onChange={setTaskDesc}
                placeholder="Cung cấp chi tiết các bước, ngữ cảnh hoặc yêu cầu..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="editTracker"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Tracker
                </Label>
                <Select value={taskTracker} onValueChange={setTaskTracker}>
                  <SelectTrigger
                    id="editTracker"
                    className="w-full h-10 border-border rounded-full px-4 bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                    {trackersToDisplay.map((tr) => (
                      <SelectItem key={tr} value={tr} className="rounded-lg">
                        {formatTracker(tr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="editPriority"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Độ ưu tiên
                </Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger
                    id="editPriority"
                    className="w-full h-10 border-border rounded-full px-4 bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                    {TASK_PRIORITIES.map((pr) => (
                      <SelectItem key={pr} value={pr} className="rounded-lg">
                        {formatPriority(pr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStatus" className="text-xs font-semibold text-muted-foreground">
                  Trạng thái
                </Label>
                <Select value={taskStatusId} onValueChange={setTaskStatusId}>
                  <SelectTrigger
                    id="editStatus"
                    className="w-full h-10 border-border rounded-full px-4 bg-background"
                  >
                    <SelectValue placeholder="Chọn trạng thái..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                    {statuses.map((st: ProjectTaskStatus) => (
                      <SelectItem key={st.id} value={st.id} className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: st.color }}
                          />
                          {st.name} {st.isDefault && " (Mặc định)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="editAssignee"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Người thực hiện (Assignee)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] font-bold text-primary px-1.5 rounded-full flex items-center gap-1 hover:bg-primary/10"
                    onClick={() => {
                      setIsOpenAiModal(true)
                    }}
                  >
                    <Brain className="h-3 w-3" />
                    AI gợi ý
                  </Button>
                </div>
                <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                  <SelectTrigger
                    id="editAssignee"
                    className="w-full h-10 border-border rounded-full px-4 bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border bg-popover">
                    <SelectItem value="none" className="rounded-lg">
                      Không phân công
                    </SelectItem>
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.employeeId} className="rounded-lg">
                        {m.employee?.fullName || "Chưa rõ"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="editProgress"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Tiến độ (% Done)
                </Label>
                <Input
                  id="editProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => {
                    setTaskProgress(Number(e.target.value))
                  }}
                  className="h-10 text-sm border-border rounded-full px-4"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editStart" className="text-xs font-semibold text-muted-foreground">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="editStart"
                  type="date"
                  value={taskStart}
                  onChange={(e) => {
                    setTaskStart(e.target.value)
                  }}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editDue" className="text-xs font-semibold text-muted-foreground">
                  Hạn hoàn thành
                </Label>
                <Input
                  id="editDue"
                  type="date"
                  value={taskDue}
                  onChange={(e) => {
                    setTaskDue(e.target.value)
                  }}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="editEstimate"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Ước tính (Giờ)
                </Label>
                <Input
                  id="editEstimate"
                  type="number"
                  step="0.5"
                  min="0"
                  value={taskEstimate}
                  onChange={(e) => {
                    setTaskEstimate(e.target.value)
                  }}
                  className="h-10 text-sm border-border rounded-full px-4"
                />
              </div>
            </div>

            <div className="border-t border-border/60 pt-3 space-y-3">
              <div className="text-xs font-bold text-foreground">Kết quả công việc</div>
              <Tabs value={resultTab} onValueChange={(val) => { setResultTab(val as "report" | "optional") }} className="w-full animate-in fade-in duration-300">
                <TabsList className="grid w-full grid-cols-2 rounded-full h-9 p-1 bg-muted/60 border border-border/40">
                  <TabsTrigger value="report" className="rounded-full text-xs py-1">
                    Báo cáo kết quả
                  </TabsTrigger>
                  <TabsTrigger value="optional" className="rounded-full text-xs py-1">
                    Không yêu cầu kết quả (Optional)
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="report" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="editResultUrl" className="text-xs font-semibold text-muted-foreground">
                      Đường dẫn sản phẩm (resultUrl)
                    </Label>
                    <Input
                      id="editResultUrl"
                      type="text"
                      placeholder="https://github.com/... hoặc link sản phẩm..."
                      value={resultUrl}
                      onChange={(e) => {
                        setResultUrl(e.target.value)
                      }}
                      className="h-10 text-sm border-border rounded-full px-4 bg-background"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="editResultNotes" className="text-xs font-semibold text-muted-foreground">
                      Ghi chú kết quả (resultNotes)
                    </Label>
                    <RichTextEditor
                      value={resultNotes}
                      onChange={setResultNotes}
                      placeholder="Mô tả kết quả công việc, tính năng đã hoàn thiện hoặc hướng dẫn test..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="optional" className="pt-3">
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-xl border border-border/40 text-center">
                    Công việc này không yêu cầu đính kèm kết quả hoặc ghi chú bàn giao.
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpenEditModal(false)
                }}
                className="h-10 rounded-full px-5 text-sm"
                disabled={updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
