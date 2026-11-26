import { usePermission } from "@/hooks/use-permission"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"
import type { Task } from "@/types/task.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  task: Task | null
}

/**
 * Tier 1 Business Hook coordinating user task assignments, reported tasks, project list,
 * context menu state, and log-time modals for the Project Dashboard.
 */
export function useProjectDashboard() {
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    task: null,
  })

  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeTask, setLogTimeTask] = useState<{ id: string; title: string } | null>(null)

  const [assignedPage, setAssignedPage] = useState(1)
  const [assignedLimit, setAssignedLimit] = useState(10)
  const [reportedPage, setReportedPage] = useState(1)
  const [reportedLimit, setReportedLimit] = useState(10)

  const { data: assignedTasksData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ["tasks", "assigned", user?.id, assignedPage, assignedLimit],
    queryFn: () => taskApi.list({ assigneeId: user?.id, page: assignedPage, limit: assignedLimit }),
    enabled: !!user?.id,
  })

  const { data: reportedTasksData, isLoading: isLoadingReported } = useQuery({
    queryKey: ["tasks", "reported", user?.id, reportedPage, reportedLimit],
    queryFn: () =>
      taskApi.list({ createdById: user?.id, page: reportedPage, limit: reportedLimit }),
    enabled: !!user?.id,
  })

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "dashboard", user?.id],
    queryFn: () => projectApi.list({ limit: 100 }),
    enabled: !!user?.id,
  })

  const { data: activeProjectMembers } = useQuery({
    queryKey: ["members", contextMenu.task?.projectId],
    queryFn: () => projectApi.getMembers(contextMenu.task?.projectId || ""),
    enabled: !!contextMenu.task?.projectId,
  })

  const assignedTasks = assignedTasksData?.data || []
  const reportedTasks = reportedTasksData?.data || []
  const projects = projectsData?.data || []

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const menu = document.getElementById("dashboard-context-menu")
      if (menu && !menu.contains(e.target as Node)) {
        setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
      }
    }
    if (contextMenu.isOpen) {
      document.addEventListener("click", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick)
    }
  }, [contextMenu.isOpen])

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; data: Record<string, unknown> }) => {
      return taskApi.update(payload.taskId, payload.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Issue updated successfully")
      setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to update issue"
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } })
          .response
        if (response?.data?.error?.message) {
          errorMessage = response.data.error.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      toast.error(errorMessage)
    },
  })

  const handleUpdateTask = useCallback(
    (data: Record<string, unknown>) => {
      if (!contextMenu.task) return
      updateTaskMutation.mutate({ taskId: contextMenu.task.id, data })
    },
    [contextMenu.task, updateTaskMutation],
  )

  const handleRowContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault()
    let x = e.clientX
    let y = e.clientY
    const menuHeight = 300
    const menuWidth = 160

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }

    setContextMenu({
      isOpen: true,
      x,
      y,
      task,
    })
  }, [])

  const handleOpenActionMenu = useCallback((task: Task, rect: DOMRect) => {
    setContextMenu({
      isOpen: true,
      x: rect.left - 120,
      y: rect.bottom + 5,
      task,
    })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
  }, [])

  const handleOpenLogTime = useCallback((task: { id: string; title: string }) => {
    setLogTimeTask(task)
    setIsLogTimeOpen(true)
  }, [])

  return {
    user,
    hasAnyPermission,
    navigate,
    contextMenu,
    handleCloseContextMenu,
    isLogTimeOpen,
    setIsLogTimeOpen,
    logTimeTask,
    handleOpenLogTime,
    assignedPage,
    setAssignedPage,
    assignedLimit,
    setAssignedLimit,
    reportedPage,
    setReportedPage,
    reportedLimit,
    setReportedLimit,
    assignedTasks,
    assignedTasksData,
    isLoadingAssigned,
    reportedTasks,
    reportedTasksData,
    isLoadingReported,
    projects,
    isLoadingProjects,
    activeProjectMembers,
    handleUpdateTask,
    handleRowContextMenu,
    handleOpenActionMenu,
  }
}
