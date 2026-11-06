import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { usePermission } from "@/hooks/use-permission"
import { TASK_TRACKERS, SPENT_TIME_STATUS } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import { employeeApi } from "@/lib/api/employee.api"
import { taskApi } from "@/lib/api/task.api"
import { useAuthStore } from "@/store/auth-store"

import { extractErrorMessage } from "@/utils/error-helper"
import { PageContainer, useConfirm } from "@/components/common"

// Sub-components imports
import { ProjectHeader } from "./components/project-header"
import { AddMemberModal } from "./components/add-member-modal"
import { EditMemberModal } from "./components/edit-member-modal"
import { EditProjectModal } from "./components/edit-project-modal"
import { ProjectOverviewTab } from "./components/project-overview-tab"
import { ProjectIssuesTab } from "./components/project-issues-tab"
import { ProjectKanbanTab } from "./components/project-kanban-tab"
import { ProjectActivityTab } from "./components/project-activity-tab"
import { ProjectGanttTab } from "./components/project-gantt-tab"
import { ProjectPositionRules } from "./components/project-position-rules"
import { ProjectTaskGeneratorModal } from "./components/project-task-generator-modal"
import type { ProjectMember } from "@/types/project.types"

interface ActivityItem {
  id: string
  type: "spent_time" | "task"
  user: string
  text: string
  date: Date
  comment?: string | null
  hours?: number
}

const PROJECT_TABS = {
  OVERVIEW: "overview",
  ISSUES: "issues",
  KANBAN: "kanban",
  ACTIVITY: "activity",
  GANTT: "gantt",
  RULES: "rules",
} as const

type ProjectTab = typeof PROJECT_TABS[keyof typeof PROJECT_TABS]

/**
 * ProjectDetail Component.
 */
export default function ProjectDetail() {
  const { id, tab } = useParams<{ id: string; tab?: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const openCreateParam = searchParams.get("createTask") === "true"
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermission()
  const confirm = useConfirm()

  const projectId = id || sessionStorage.getItem("activeProjectId") || ""

  // Store in sessionStorage to sync with other components
  useEffect(() => {
    if (projectId) {
      sessionStorage.setItem("activeProjectId", projectId)
    }
  }, [projectId])

  const isTabValid = tab ? (Object.values(PROJECT_TABS) as readonly string[]).includes(tab) : false
  const activeTab: ProjectTab =
    isTabValid ? (tab as ProjectTab) : PROJECT_TABS.OVERVIEW

  const [isOpenMemberModal, setIsOpenMemberModal] = useState(false)
  const [isOpenEditProjectModal, setIsOpenEditProjectModal] = useState(false)
  const [isAiDecomposeOpen, setIsAiDecomposeOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null)

  // Redirect to canonical /project/:tab — fix invalid tab or missing project
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

  // Fetch active project metadata
  const {
    data: project,
    isError: isProjectError,
    isLoading: isLoadingProject,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  // A failed project lookup means a seed/reset removed the stored project; clear only that stale pointer.
  useEffect(() => {
    if (isProjectError && projectId) {
      sessionStorage.removeItem("activeProjectId")
    }
  }, [isProjectError, projectId])

  // Fetch all tasks for overview statistics mapping (without pagination)
  const { data: overviewTasksData } = useQuery({
    queryKey: ["tasks", "overview", projectId],
    queryFn: () => taskApi.list({ projectId, limit: 1000 }),
    enabled: !!project,
  })

  // All project Spent Time logs — used for overview totals and lead approval tab
  const { data: spentTimes, isLoading: isLoadingSpent } = useQuery({
    queryKey: ["spentTimes", "project", projectId],
    queryFn: () => taskApi.listSpentTimes({ projectId }),
    enabled: !!project,
  })

  // Fetch members currently assigned to the project
  const { data: members } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!project,
  })

  // Fetch all active employees (for dropdown select in manager operations)
  const { data: allEmployeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeApi.list({ limit: 200 }),
    enabled: true,
  })

  const overviewTasks = overviewTasksData?.data || []
  const allEmployees = allEmployeesData?.data || []
  const projectMembers = members || []

  // Check roles/permissions
  const isLeader = project?.teamLeaderId === user?.id
  const isAdminOrGM = hasAnyPermission(["project.update", "project.task.approve"])
  const isProjectMember = projectMembers.some((m) => m.employeeId === user?.id) || isLeader
  const canManageRules = isAdminOrGM || isLeader

  // Enforce task creation policy based on user roles and project configuration settings
  const canCreateTask =
    isAdminOrGM ||
    isLeader ||
    (isProjectMember && project?.taskCreationPolicy === "all_members")

  // Auto-redirect to task creation screen if search parameter 'createTask' is present and user has permission
  useEffect(() => {
    if (openCreateParam && canCreateTask) {
      navigate("/project/task/new", { replace: true })
    }
  }, [openCreateParam, canCreateTask, navigate])

  // Determine if the current user is allowed to manage project members
  const canManageMembers = isAdminOrGM || isLeader

  // Calculate statistics for the Overview Tab
  const openTasksCount = overviewTasks.filter((t) =>
    ["todo", "in_progress", "in_review", "reopened"].includes(t.status)
  ).length
  const closedTasksCount = overviewTasks.filter((t) =>
    ["done", "cancelled"].includes(t.status)
  ).length
  const totalTasksCount = overviewTasks.length

  // Calculate task counts and statuses grouped by tracker types
  const trackerStats = TASK_TRACKERS.reduce((acc, tr) => {
    const trTasks = overviewTasks.filter((t) => t.tracker === tr)
    const open = trTasks.filter((t) =>
      ["todo", "in_progress", "in_review", "reopened"].includes(t.status)
    ).length
    const closed = trTasks.filter((t) => ["done", "cancelled"].includes(t.status)).length
    acc.set(tr, { open, closed, total: trTasks.length })
    return acc
  }, new Map<string, { open: number; closed: number; total: number }>())

  // Compute total estimated time and actual spent time hours for the project
  const totalEstimatedHours = overviewTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0)
  // Exclude rejected logs from overview spent total — only approved/pending count toward progress.
  const totalSpentHours =
    spentTimes
      ?.filter((st) => st.status !== SPENT_TIME_STATUS.REJECTED)
      .reduce((sum, st) => sum + st.hours, 0) || 0

  // Delete project member relationship from team membership list mutation
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

  // Loading state placeholder view using Skeleton structure panels
  if (isLoadingProject) {
    return (
      <PageContainer variant="default" className="space-y-6">
        <Skeleton className="h-14 w-1/3 rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-xl" />
          <Skeleton className="h-64 col-span-1 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  // Error feedback view if the target project record is not found in database.
  if (isProjectError || !project) {
    return (
      <PageContainer variant="default" className="text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Không tìm thấy dự án</h3>
        <p className="text-sm text-muted-foreground">
          Dự án không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Button asChild className="rounded-full">
          <Link to="/project/list">Quay lại danh sách</Link>
        </Button>
      </PageContainer>
    )
  }

  // Activity list builder: combine spent time logs and task updates
  const activitiesList: ActivityItem[] = []

  spentTimes?.forEach((st) => {
    activitiesList.push({
      id: st.id,
      type: "spent_time",
      user: st.employee?.fullName || "Thành viên",
      text: `đã ghi nhận ${st.hours} giờ (${st.activity}) vào công việc`,
      date: new Date(st.createdAt),
      comment: st.comment,
      hours: st.hours,
    })
  })

  overviewTasks.forEach((t) => {
    activitiesList.push({
      id: `task-create-${t.id}`,
      type: "task",
      user: t.createdBy?.fullName || "Thành viên",
      text: `đã tạo công việc mới [${t.tracker}] "${t.title}"`,
      date: new Date(t.createdAt),
    })
  })

  // Sort consolidated activity records chronological from most recent to oldest
  activitiesList.sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <PageContainer variant="default" className="space-y-6">
      {/* Top Header Section */}
      <ProjectHeader
        projectId={projectId}
        name={project.name}
        description={project.description}
        canCreateTask={canCreateTask}
        canManageMembers={canManageMembers}
        onOpenEditProject={() => {
          setIsOpenEditProjectModal(true)
        }}
        onOpenAddMember={() => {
          setIsOpenMemberModal(true)
        }}
        onOpenAiDecompose={() => {
          setIsAiDecomposeOpen(true)
        }}
      />

      {/* Tabs navigation panel: switches between Overview, Issues, and Activity views */}
      <Tabs value={activeTab} onValueChange={(newTab) => { navigate(`/project/${projectId}/${newTab}`); }} className="space-y-6">
        <TabsList className="bg-secondary rounded-full p-1 border border-border/40 inline-flex">
          <TabsTrigger
            value={PROJECT_TABS.OVERVIEW}
            className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Tổng quan (Overview)
          </TabsTrigger>
          <TabsTrigger
            value={PROJECT_TABS.ISSUES}
            className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Công việc (Issues)
          </TabsTrigger>
          <TabsTrigger
            value={PROJECT_TABS.KANBAN}
            className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Bảng Kanban
          </TabsTrigger>
          <TabsTrigger
            value={PROJECT_TABS.ACTIVITY}
            className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Hoạt động (Activity)
          </TabsTrigger>
          <TabsTrigger
            value={PROJECT_TABS.GANTT}
            className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Biểu đồ Gantt
          </TabsTrigger>
          {canManageRules && (
            <TabsTrigger
              value={PROJECT_TABS.RULES}
              className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Cấu hình quyền (Rules)
            </TabsTrigger>
          )}
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value={PROJECT_TABS.OVERVIEW}>
          <ProjectOverviewTab
            project={project}
            projectId={projectId}
            tasks={overviewTasks}
            totalTasksCount={totalTasksCount}
            openTasksCount={openTasksCount}
            closedTasksCount={closedTasksCount}
            trackerStats={trackerStats}
            totalEstimatedHours={totalEstimatedHours}
            totalSpentHours={totalSpentHours}
            members={projectMembers}
            canManageMembers={canManageMembers}
            onRemoveMember={async (employeeId) => {
              // Retrieve employee full name for descriptive warning message
              const memberName = projectMembers.find((m) => m.employeeId === employeeId)?.employee?.fullName || "thành viên này"
              
              // Prompt user with unified custom confirm modal before calling delete mutation
              const ok = await confirm({
                title: "Xóa thành viên khỏi dự án",
                description: `Bạn có chắc chắn muốn xóa thành viên ${memberName} ra khỏi dự án này?`,
                variant: "destructive",
              })
              if (ok) {
                removeMemberMutation.mutate(employeeId)
              }
            }}
            onEditMember={(member) => {
              setEditingMember(member)
            }}
          />
        </TabsContent>



        {/* ISSUES TAB */}
        <TabsContent value={PROJECT_TABS.ISSUES}>
          <ProjectIssuesTab
            projectId={projectId}
            members={projectMembers}
            teamLeader={project.teamLeader}
            user={user}
          />
        </TabsContent>

        {/* KANBAN TAB */}
        <TabsContent value={PROJECT_TABS.KANBAN}>
          <ProjectKanbanTab
            projectId={projectId}
            members={projectMembers}
            teamLeader={project.teamLeader}
            user={user}
          />
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value={PROJECT_TABS.ACTIVITY}>
          <ProjectActivityTab
            activitiesList={activitiesList}
            isLoading={isLoadingSpent}
          />
        </TabsContent>

        {/* GANTT TAB */}
        <TabsContent value={PROJECT_TABS.GANTT}>
          <ProjectGanttTab
            projectId={projectId}
            project={project}
          />
        </TabsContent>

        {/* RULES TAB */}
        {canManageRules && (
          <TabsContent value={PROJECT_TABS.RULES}>
            <ProjectPositionRules projectId={projectId} />
          </TabsContent>
        )}
      </Tabs>

      {/* MEMBER MODAL: Dialog overlay to add a member to the active project team */}
      <AddMemberModal
        isOpen={isOpenMemberModal}
        onOpenChange={setIsOpenMemberModal}
        projectId={projectId}
        members={projectMembers}
        allEmployees={allEmployees}
        teamLeaderId={project.teamLeaderId}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null)
        }}
        projectId={projectId}
        member={editingMember}
        allEmployees={allEmployees}
      />

      {/* EDIT PROJECT DIALOG: Dialog overlay to update project config properties */}
      <EditProjectModal
        isOpen={isOpenEditProjectModal}
        onOpenChange={setIsOpenEditProjectModal}
        projectId={projectId}
        project={project}
        allEmployees={allEmployees}
      />

      {/* AI TASK DECOMPOSITION MODAL: Dialog overlay for AI project task breakdown */}
      <ProjectTaskGeneratorModal
        projectId={projectId}
        isOpen={isAiDecomposeOpen}
        onOpenChange={setIsAiDecomposeOpen}
      />
    </PageContainer>
  )
}
