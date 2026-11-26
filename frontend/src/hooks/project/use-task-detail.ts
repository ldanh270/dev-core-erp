import { PROJECT_ROLE } from "@/config/entities/project.config"
import { usePermission } from "@/hooks/use-permission"
import { useProfile } from "@/hooks/use-profile"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useProjectTrackers } from "@/hooks/project/use-project-tracker"
import { useAuthStore } from "@/store/auth-store"
import type { Task } from "@/types/task.types"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { useTaskDetailEditForm } from "./useTaskDetailEditForm"
import { useTaskSpentTimeActions } from "./useTaskSpentTimeActions"

export { cleanHtml } from "./useTaskDetailEditForm"

/**
 * Tier 1 Business Hook managing task details, sibling navigation, tracker permissions,
 * and associated spent-time records.
 */
export function useTaskDetail() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  const { data: profile } = useProfile()

  const { id: taskId } = useParams<{ id: string }>()
  const activeTaskId = taskId || sessionStorage.getItem("activeTaskId") || ""

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
  const [isOpenAiModal, setIsOpenAiModal] = useState(false)

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task", id],
    queryFn: () => taskApi.getOne(id),
    enabled: !!id,
  })

  const projectId = task?.projectId || ""

  useEffect(() => {
    if (task?.projectId) {
      sessionStorage.setItem("activeProjectId", task.projectId)
    }
  }, [task?.projectId])

  const { data: members = [] } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  const { data: siblingTasksData } = useQuery({
    queryKey: ["tasks", "siblings", projectId],
    queryFn: () =>
      taskApi.list({ projectId, limit: 1000, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: !!projectId,
  })

  const siblingTasks = useMemo(() => siblingTasksData?.data || [], [siblingTasksData?.data])

  const { data: statusesData } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })
  const statuses = useMemo(() => statusesData || [], [statusesData])

  const { data: trackers = [] } = useProjectTrackers(projectId || "")

  const spentTimeActions = useTaskSpentTimeActions(id)
  const editForm = useTaskDetailEditForm({
    taskId: id,
    task,
    projectId,
    statuses,
    siblingTasks,
  })

  const allowedTrackers = useMemo(() => {
    const activeTrackers = trackers.map((t) => t.code)
    const projectAllowed =
      project?.allowedTaskTrackers && project.allowedTaskTrackers.length > 0
        ? project.allowedTaskTrackers
        : activeTrackers

    const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
    const currentEmpId =
      profile?.personalEmployeeId || user?.personalEmployeeId || profile?.id || user?.id
    const currentMember = members.find((m) => m.employeeId === currentEmpId)
    const isLeader =
      project?.teamLeaderId === user?.personalEmployeeId ||
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
        return role.allowedTaskTrackers.filter(
          (tr) => activeTrackers.length === 0 || activeTrackers.includes(tr),
        )
      }
      return projectAllowed
    }

    return projectAllowed
  }, [
    trackers,
    project,
    hasAnyPermission,
    profile?.personalEmployeeId,
    profile?.id,
    user?.personalEmployeeId,
    user?.id,
    members,
  ])

  const formatTracker = useCallback(
    (trackerCode: string) => {
      const dbTracker = trackers.find((t) => t.code === trackerCode)
      return dbTracker ? dbTracker.name : trackerCode
    },
    [trackers],
  )

  const trackersToDisplay = useMemo(() => {
    return allowedTrackers.includes(editForm.taskTracker)
      ? allowedTrackers
      : editForm.taskTracker
        ? [editForm.taskTracker, ...allowedTrackers.filter((t) => t !== editForm.taskTracker)]
        : allowedTrackers
  }, [allowedTrackers, editForm.taskTracker])

  const isCreator = task?.createdById === user?.id
  const isAssignee = task?.assigneeId === user?.id
  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])

  const canEditTask = isAdminOrGM || isLeader || isCreator || isAssignee
  const canApproveSpentTime = isAdminOrGM || isLeader

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return taskApi.delete(id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      navigate(`/project/${projectId}/overview`)
    },
  })

  const handleDeleteTask = useCallback(() => {
    if (window.confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
      deleteTaskMutation.mutate()
    }
  }, [deleteTaskMutation])

  const currentTaskIndex = siblingTasks.findIndex((t: Task) => t.id === id)
  const prevTaskId = currentTaskIndex > 0 ? siblingTasks[currentTaskIndex - 1].id : null
  const nextTaskId =
    currentTaskIndex < siblingTasks.length - 1 && currentTaskIndex !== -1
      ? siblingTasks[currentTaskIndex + 1].id
      : null

  const handleNavigateSibling = useCallback(
    (targetId: string | null) => {
      if (!targetId) return
      sessionStorage.setItem("activeTaskId", targetId)
      navigate(`/project/task/${targetId}`)
    },
    [navigate],
  )

  return {
    id,
    projectId,
    task,
    isLoadingTask,
    members,
    project,
    statuses,
    siblingTasks,
    prevTaskId,
    nextTaskId,
    currentTaskIndex,
    trackersToDisplay,
    formatTracker,
    canEditTask,
    isAdminOrGM,
    isLeader,
    isCreator,
    canApproveSpentTime,
    user,
    isOpenAiModal,
    setIsOpenAiModal,
    handleDeleteTask,
    handleNavigateSibling,
    ...spentTimeActions,
    ...editForm,
  }
}

