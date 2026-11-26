import { usePermission } from "@/hooks/use-permission"
import { projectTaskStatusApi } from "@/lib/api/project-task-status.api"
import { taskApi } from "@/lib/api/task.api"

import { useQuery } from "@tanstack/react-query"

import { useKanbanDragAndDrop } from "./use-kanban-drag-and-drop"
import { useKanbanStatusManagement } from "./use-kanban-status-management"

interface UseProjectKanbanProps {
  projectId: string
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role?: string
    roles?: string[]
    fullName: string
  } | null
}

/**
 * Custom hook to manage project kanban board, status columns and drag-and-drop operations.
 */
export function useProjectKanban({ projectId, teamLeader, user }: UseProjectKanbanProps) {
  const isLeader = teamLeader?.id === user?.id
  const { hasAnyPermission } = usePermission()
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
  const canManageStatuses = isAdminOrGM || isLeader

  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["projectStatuses", projectId],
    queryFn: () => projectTaskStatusApi.list(projectId),
    enabled: !!projectId,
  })

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", "kanban", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!projectId,
  })

  const tasks = tasksData?.data || []

  const statusManagement = useKanbanStatusManagement(projectId)
  const dragAndDrop = useKanbanDragAndDrop({
    projectId,
    tasks,
    statuses,
    canManageStatuses,
  })

  return {
    isLeader,
    isAdminOrGM,
    canManageStatuses,
    statuses,
    isLoadingStatuses,
    isLoadingTasks,
    tasks,
    ...statusManagement,
    ...dragAndDrop,
  }
}
