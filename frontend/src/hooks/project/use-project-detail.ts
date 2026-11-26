import { useConfirm } from "@/components/common"
import { usePermission } from "@/hooks/use-permission"
import { employeeApi } from "@/lib/api/employee.api"
import { projectApi } from "@/lib/api/project.api"
import { taskApi } from "@/lib/api/task.api"
import {
  type ActivityItem,
  PROJECT_TABS,
  type ProjectTab,
  buildActivitiesList,
} from "@/pages/project/types/project-detail.types"
import {
  computeTaskCounts,
  computeTotalSpentHours,
  computeTrackerStats,
} from "@/pages/project/utils/project-statistics.util"
import { useAuthStore } from "@/store/auth-store"
import type { ProjectMember } from "@/types/project.types"
import { extractErrorMessage } from "@/utils/error-helper"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

export { type ActivityItem, PROJECT_TABS, type ProjectTab }

/**
 * Tier 1 Business Hook coordinating project workspace details, member permissions,
 * task statistics, tab routing, and modal overlays.
 */
export function useProjectDetail() {
  const { id, tab } = useParams<{ id: string; tab?: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const openCreateParam = searchParams.get("createTask") === "true"
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  const confirm = useConfirm()

  const projectId = id || sessionStorage.getItem("activeProjectId") || ""

  useEffect(() => {
    if (projectId) {
      sessionStorage.setItem("activeProjectId", projectId)
    }
  }, [projectId])

  const isTabValid = tab ? (Object.values(PROJECT_TABS) as readonly string[]).includes(tab) : false
  const activeTab: ProjectTab = isTabValid ? (tab as ProjectTab) : PROJECT_TABS.OVERVIEW

  const [isOpenMemberModal, setIsOpenMemberModal] = useState(false)
  const [isOpenEditProjectModal, setIsOpenEditProjectModal] = useState(false)
  const [isAiDecomposeOpen, setIsAiDecomposeOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null)

  useEffect(() => {
    const searchStr = window.location.search
    if (!projectId) {
      toast.error("Vui lòng chọn một dự án để xem chi tiết")
      navigate("/project/list", { replace: true })
      return
    }
    const correctPath = `/project/${projectId}/${activeTab}`
    const currentPath = window.location.pathname
    if (currentPath !== correctPath) {
      navigate(`${correctPath}${searchStr}`, { replace: true })
    }
  }, [tab, projectId, activeTab, navigate])

  const {
    data: project,
    isError: isProjectError,
    isLoading: isLoadingProject,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  useEffect(() => {
    if (isProjectError && projectId) {
      sessionStorage.removeItem("activeProjectId")
    }
  }, [isProjectError, projectId])

  const { data: overviewTasksData } = useQuery({
    queryKey: ["tasks", "overview", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!project,
  })

  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", "project", projectId],
    queryFn: () => taskApi.listSpentTimes({ projectId }),
    enabled: !!project,
  })

  const { data: members } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!project,
  })

  const { data: allEmployeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeApi.list({ limit: 200 }),
    enabled: true,
  })

  const overviewTasks = useMemo(() => overviewTasksData?.data || [], [overviewTasksData?.data])
  const allEmployees = useMemo(() => allEmployeesData?.data || [], [allEmployeesData?.data])
  const projectMembers = useMemo(() => members || [], [members])

  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
  const isProjectMember = projectMembers.some((m) => m.employeeId === user?.id) || isLeader
  const canManageRules = isAdminOrGM || isLeader

  const canCreateTask =
    isAdminOrGM || isLeader || (isProjectMember && project?.taskCreationPolicy === "all_members")

  useEffect(() => {
    if (openCreateParam && canCreateTask) {
      navigate("/project/task/new", { replace: true })
    }
  }, [openCreateParam, canCreateTask, navigate])

  const canManageMembers = isAdminOrGM || isLeader

  const { openTasksCount, closedTasksCount, totalTasksCount, totalEstimatedHours } = useMemo(
    () => computeTaskCounts(overviewTasks),
    [overviewTasks],
  )

  const trackerStats = useMemo(() => computeTrackerStats(overviewTasks), [overviewTasks])

  const totalSpentHours = useMemo(() => computeTotalSpentHours(spentTimes), [spentTimes])

  const removeMemberMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      return projectApi.removeMember(projectId, employeeId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      toast.success("Đã xóa thành viên khỏi dự án")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const handleRemoveMember = useCallback(
    async (employeeId: string) => {
      const memberName =
        projectMembers.find((m) => m.employeeId === employeeId)?.employee?.fullName ||
        "thành viên này"

      const ok = await confirm({
        title: "Xóa thành viên khỏi dự án",
        description: `Bạn có chắc chắn muốn xóa thành viên ${memberName} ra khỏi dự án này?`,
        variant: "destructive",
      })
      if (ok) {
        removeMemberMutation.mutate(employeeId)
      }
    },
    [confirm, projectMembers, removeMemberMutation],
  )

  const handleTabChange = useCallback(
    (newTab: string) => {
      navigate(`/project/${projectId}/${newTab}`)
    },
    [navigate, projectId],
  )

  const activitiesList = useMemo(
    () => buildActivitiesList(spentTimes, overviewTasks),
    [spentTimes, overviewTasks],
  )

  return {
    projectId,
    activeTab,
    project,
    isProjectError,
    isLoadingProject,
    overviewTasks,
    allEmployees,
    projectMembers,
    user,
    canCreateTask,
    canManageMembers,
    canManageRules,
    openTasksCount,
    closedTasksCount,
    totalTasksCount,
    trackerStats,
    totalEstimatedHours,
    totalSpentHours,
    isLoadingSpent,
    activitiesList,
    isOpenMemberModal,
    setIsOpenMemberModal,
    isOpenEditProjectModal,
    setIsOpenEditProjectModal,
    isAiDecomposeOpen,
    setIsAiDecomposeOpen,
    editingMember,
    setEditingMember,
    handleRemoveMember,
    handleTabChange,
  }
}
