import { PROJECT_ROLE } from "@/config/entities/project.config"
import type { Project, ProjectMember } from "@/types/project.types"
import type { Task } from "@/types/task.types"
import { toast } from "sonner"

/**
 * Parameters for calculating permitted task trackers based on user role and project policy.
 */
interface ComputeAllowedTrackersParams {
  trackers: Array<{ code: string }>
  project?: Project | null
  user?: { personalEmployeeId?: string | null; id?: string | null } | null
  profile?: { personalEmployeeId?: string | null; id?: string | null } | null
  members?: ProjectMember[]
  isAdminOrGM: boolean
}

/**
 * Calculates allowable task trackers for the current user based on RBAC rules,
 * project configuration, and team role restrictions.
 */
export function computeAllowedTrackers({
  trackers,
  project,
  user,
  profile,
  members,
  isAdminOrGM,
}: ComputeAllowedTrackersParams): string[] {
  const activeTrackers = trackers.map((t) => t.code)

  const projectAllowed =
    project?.allowedTaskTrackers && project.allowedTaskTrackers.length > 0
      ? project.allowedTaskTrackers
      : activeTrackers

  const currentEmpId =
    profile?.personalEmployeeId || user?.personalEmployeeId || profile?.id || user?.id
  const currentMember = members?.find((m) => m.employeeId === currentEmpId)
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
}

/**
 * Validates logical bounds for task start and due dates relative to each other and optional parent task dates.
 */
export function validateTaskDateConstraints(
  taskStart: string,
  taskDue: string,
  parentTaskId: string,
  projectTasks: Task[],
): boolean {
  if (taskStart && taskDue && new Date(taskStart) > new Date(taskDue)) {
    toast.warning("Ngày bắt đầu không được sau hạn hoàn thành")
    return false
  }

  if (parentTaskId && parentTaskId !== "none") {
    const selectedParent = projectTasks.find((t) => t.id === parentTaskId)
    if (selectedParent) {
      if (
        selectedParent.startDate &&
        taskStart &&
        new Date(taskStart) < new Date(selectedParent.startDate)
      ) {
        toast.warning(
          `Ngày bắt đầu của công việc con không được trước ngày bắt đầu của công việc cha (${new Date(selectedParent.startDate).toLocaleDateString("vi-VN")})`,
        )
        return false
      }
      if (
        selectedParent.dueDate &&
        taskDue &&
        new Date(taskDue) > new Date(selectedParent.dueDate)
      ) {
        toast.warning(
          `Hạn hoàn thành của công việc con không được sau hạn hoàn thành của công việc cha (${new Date(selectedParent.dueDate).toLocaleDateString("vi-VN")})`,
        )
        return false
      }
    }
  }

  return true
}
