import { useProjectTrackers } from "@/hooks/project/use-project-tracker"
import { usePermission } from "@/hooks/use-permission"
import { useProfile } from "@/hooks/use-profile"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import type { TaskPriority, TaskTracker } from "@/types/task.types"
import {
  computeAllowedTrackers,
  validateTaskDateConstraints,
} from "@/utils/project/task-form-validation.util"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

/**
 * Hook managing the creation form state, validation, date constraints, and submission mutation for new project tasks.
 */
export function useNewTaskForm() {
  const { id: projectId } = useParams<{ id: string }>()
  const pId = projectId || sessionStorage.getItem("activeProjectId") || ""
  const [searchParams] = useSearchParams()
  const { hasAnyPermission } = usePermission()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const parentTaskId =
    searchParams.get("parentTaskId") || sessionStorage.getItem("parentTaskId") || ""
  useEffect(() => {
    sessionStorage.removeItem("parentTaskId")
  }, [])

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskTracker, setTaskTracker] = useState<TaskTracker>("feature")
  const [taskStatusId, setTaskStatusId] = useState<string>("")
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium")
  const [taskAssignee, setTaskAssignee] = useState("none")
  const [taskStart, setTaskStart] = useState("")
  const [taskDue, setTaskDue] = useState("")
  const [taskEstimate, setTaskEstimate] = useState("")
  const [taskProgress, setTaskProgress] = useState("0")
  const [parentTask, setParentTask] = useState(parentTaskId || "none")
  const [taskError, setTaskError] = useState<string | null>(null)

  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const { data: project } = useQuery({
    queryKey: ["project", pId],
    queryFn: () => projectApi.getOne(pId),
    enabled: Boolean(pId),
  })

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", pId],
    queryFn: () => projectApi.getMembers(pId),
    enabled: Boolean(pId),
  })

  const { data: projectTasksData } = useQuery({
    queryKey: ["project-tasks", pId],
    queryFn: () => taskApi.list({ projectId: pId, limit: 100 }),
    enabled: Boolean(pId),
  })
  const projectTasks = useMemo(() => projectTasksData?.data || [], [projectTasksData?.data])

  const { data: statusesData } = useQuery({
    queryKey: ["projectStatuses", pId],
    queryFn: () => projectTaskStatusApi.list(pId),
    enabled: Boolean(pId),
  })
  const statuses = useMemo(() => statusesData || [], [statusesData])

  const { user } = useAuthStore()
  const { data: profile } = useProfile()
  const { data: trackers = [] } = useProjectTrackers(pId || "")

  const allowedTrackers = useMemo(() => {
    return computeAllowedTrackers({
      trackers,
      project,
      user,
      profile,
      members,
      isAdminOrGM: hasAnyPermission(["project.update", "project.task.approve"]),
    })
  }, [trackers, project, user, profile, members, hasAnyPermission])

  useEffect(() => {
    if (statuses.length > 0 && !taskStatusId) {
      const defaultStatus = statuses.find((s: ProjectTaskStatus) => s.isDefault) || statuses[0]
      setTaskStatusId(defaultStatus.id)
    }
  }, [statuses, taskStatusId])

  useEffect(() => {
    if (allowedTrackers.length > 0 && !allowedTrackers.includes(taskTracker)) {
      setTaskTracker(allowedTrackers[0] as TaskTracker)
    }
  }, [allowedTrackers, taskTracker])

  const handleSelectAllWatchers = useCallback(() => {
    if (!members) return
    if (selectedWatchers.length === members.length) {
      setSelectedWatchers([])
    } else {
      setSelectedWatchers(members.map((m) => m.employeeId))
    }
  }, [members, selectedWatchers.length])

  const handleToggleWatcher = useCallback((empId: string) => {
    setSelectedWatchers((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId],
    )
  }, [])

  const createTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; andAnother: boolean }) => {
      const parsedEstimate = taskEstimate ? parseFloat(taskEstimate) : null
      if (parsedEstimate !== null && (isNaN(parsedEstimate) || parsedEstimate < 0)) {
        throw new Error("Thời gian ước tính phải là một số không âm")
      }
      return taskApi.create({
        projectId: pId,
        title: payload.title.trim(),
        description: taskDesc.trim() || null,
        tracker: taskTracker,
        priority: taskPriority,
        statusId: taskStatusId || null,
        assigneeId: taskAssignee === "none" ? null : taskAssignee,
        startDate: taskStart || null,
        dueDate: taskDue || null,
        estimatedTime: parsedEstimate,
        progress: Number(taskProgress),
        parentTaskId: parentTask === "none" ? null : parentTask,
      })
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", pId] })
      toast.success(`Tạo công việc thành công: ${variables.title}`)

      if (variables.andAnother) {
        setTaskTitle("")
        setTaskDesc("")
        setParentTask("none")
        setSelectedFiles([])
      } else {
        navigate(`/project/${pId}/issues`)
      }
    },
    onError: (err: unknown) => {
      let message = "Tạo công việc thất bại"
      if (err instanceof Error) {
        message = err.message
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
        if (axiosErr.response?.data?.error?.message) {
          message = axiosErr.response.data.error.message
        }
      }
      setTaskError(message)
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent, andAnother: boolean) => {
      e.preventDefault()
      setTaskError(null)
      if (!taskTitle.trim()) return setTaskError("Vui lòng nhập tiêu đề")
      if (!validateTaskDateConstraints(taskStart, taskDue, parentTask, projectTasks)) return
      createTaskMutation.mutate({ title: taskTitle, andAnother })
    },
    [taskTitle, taskStart, taskDue, parentTask, projectTasks, createTaskMutation],
  )

  const handleSubmitAnother = useCallback(() => {
    setTaskError(null)
    if (!taskTitle.trim()) return setTaskError("Vui lòng nhập tiêu đề")
    if (!validateTaskDateConstraints(taskStart, taskDue, parentTask, projectTasks)) return
    createTaskMutation.mutate({ title: taskTitle, andAnother: true })
  }, [taskTitle, taskStart, taskDue, parentTask, projectTasks, createTaskMutation])

  const formatTracker = useCallback(
    (trackerCode: string) => {
      const dbTracker = trackers.find((t) => t.code === trackerCode)
      return dbTracker ? dbTracker.name : trackerCode
    },
    [trackers],
  )

  return {
    pId,
    project,
    members: members || [],
    isLoadingMembers,
    projectTasks,
    statuses,
    trackers,
    allowedTrackers,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskTracker,
    setTaskTracker,
    taskStatusId,
    setTaskStatusId,
    taskPriority,
    setTaskPriority,
    taskAssignee,
    setTaskAssignee,
    taskStart,
    setTaskStart,
    taskDue,
    setTaskDue,
    taskEstimate,
    setTaskEstimate,
    taskProgress,
    setTaskProgress,
    parentTask,
    setParentTask,
    taskError,
    selectedWatchers,
    selectedFiles,
    setSelectedFiles,
    isDragOver,
    setIsDragOver,
    isPending: createTaskMutation.isPending,
    handleSubmit,
    handleSubmitAnother,
    formatTracker,
    handleSelectAllWatchers,
    handleToggleWatcher,
  }
}
