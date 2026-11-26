import { taskApi } from "@/lib/api/task.api"
import type { Task, TaskPriority, TaskTracker } from "@/types/task.types"

import { useCallback, useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Strips empty HTML tags and returns trimmed content or null if blank.
 */
export const cleanHtml = (html: string) => {
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

interface UseTaskDetailEditFormProps {
  taskId: string
  task?: Task
  projectId: string
  statuses: { id: string; name: string; isDefault?: boolean; isCompleted?: boolean }[]
  siblingTasks: Task[]
}

/**
 * Tier 1 Business Hook managing state, validation, and submission for editing an existing task.
 */
export function useTaskDetailEditForm({
  taskId,
  task,
  projectId,
  statuses,
  siblingTasks,
}: UseTaskDetailEditFormProps) {
  const queryClient = useQueryClient()

  const [isOpenEditModal, setIsOpenEditModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskTracker, setTaskTracker] = useState("")
  const [taskPriority, setTaskPriority] = useState("")
  const [taskStatusId, setTaskStatusId] = useState("")
  const [taskAssignee, setTaskAssignee] = useState("")
  const [taskStart, setTaskStart] = useState("")
  const [taskDue, setTaskDue] = useState("")
  const [taskEstimate, setTaskEstimate] = useState("")
  const [taskProgress, setTaskProgress] = useState(0)
  const [resultNotes, setResultNotes] = useState("")
  const [resultUrl, setResultUrl] = useState("")
  const [resultTab, setResultTab] = useState<"report" | "optional">("optional")
  const [editError, setEditError] = useState<string | null>(null)

  const handleOpenEdit = useCallback(() => {
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
  }, [task])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (task?.statusId && taskStatusId && task.statusId !== taskStatusId) {
        const sourceStatus = statuses.find((s) => s.id === task.statusId)
        const targetStatus = statuses.find((s) => s.id === taskStatusId)
        if (sourceStatus && targetStatus) {
          const isMovingBackToDefault =
            !sourceStatus.isDefault && !sourceStatus.isCompleted && targetStatus.isDefault
          if (isMovingBackToDefault) {
            toast.warning(
              "Công việc đang thực hiện không thể chuyển ngược lại về cần làm theo quy trình",
            )
            throw new Error(
              "Công việc đang thực hiện không thể chuyển ngược lại về cần làm theo quy trình",
            )
          }
        }
      }
      return taskApi.update(taskId, {
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
        resultUrl: resultTab === "report" ? resultUrl.trim() || null : null,
        resultNotes: resultTab === "report" ? cleanHtml(resultNotes) : null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      void queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] })
      toast.success("Cập nhật công việc thành công")
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

  const handleUpdateSubmit = useCallback(
    (e: React.FormEvent) => {
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

      if (task?.parentTaskId) {
        const parentTask = siblingTasks.find((t) => t.id === task.parentTaskId)
        if (parentTask) {
          if (
            parentTask.startDate &&
            taskStart &&
            new Date(taskStart) < new Date(parentTask.startDate)
          ) {
            toast.warning(
              `Ngày bắt đầu của công việc con không được trước ngày bắt đầu của công việc cha (${new Date(parentTask.startDate).toLocaleDateString("vi-VN")})`,
            )
            return
          }
          if (
            parentTask.dueDate &&
            taskDue &&
            new Date(taskDue) > new Date(parentTask.dueDate)
          ) {
            toast.warning(
              `Hạn hoàn thành của công việc con không được sau hạn hoàn thành của công việc cha (${new Date(parentTask.dueDate).toLocaleDateString("vi-VN")})`,
            )
            return
          }
        }
      }

      const childTasks = siblingTasks.filter((t) => t.parentTaskId === taskId)
      if (childTasks.length > 0) {
        for (const child of childTasks) {
          if (
            child.startDate &&
            taskStart &&
            new Date(taskStart) > new Date(child.startDate)
          ) {
            toast.warning(
              `Khoảng thời gian công việc cha phải bao trùm công việc con "${child.title}" (bắt đầu ${new Date(child.startDate).toLocaleDateString("vi-VN")})`,
            )
            return
          }
          if (child.dueDate && taskDue && new Date(taskDue) < new Date(child.dueDate)) {
            toast.warning(
              `Khoảng thời gian công việc cha phải bao trùm công việc con "${child.title}" (hạn hoàn thành ${new Date(child.dueDate).toLocaleDateString("vi-VN")})`,
            )
            return
          }
        }
      }

      updateMutation.mutate()
    },
    [taskId, siblingTasks, task, taskDue, taskStart, taskTitle, updateMutation],
  )

  return {
    isOpenEditModal,
    setIsOpenEditModal,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskTracker,
    setTaskTracker,
    taskPriority,
    setTaskPriority,
    taskStatusId,
    setTaskStatusId,
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
    resultNotes,
    setResultNotes,
    resultUrl,
    setResultUrl,
    resultTab,
    setResultTab,
    editError,
    handleOpenEdit,
    handleUpdateSubmit,
    isUpdating: updateMutation.isPending,
  }
}
