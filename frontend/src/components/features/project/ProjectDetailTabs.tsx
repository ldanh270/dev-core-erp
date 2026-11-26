import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type ActivityItem, PROJECT_TABS } from "@/hooks/project/use-project-detail"
import { cn } from "@/lib/utils"
import { ProjectActivityTab } from '@/components/features/project/ProjectActivityTab'
import { ProjectGanttTab } from '@/components/features/project/ProjectGanttTab'
import { ProjectIssuesTab } from '@/components/features/project/ProjectIssuesTab'
import { ProjectKanbanTab } from '@/components/features/project/ProjectKanbanTab'
import { ProjectOverviewTab } from '@/components/features/project/ProjectOverviewTab'
import { ProjectPositionRules } from '@/components/features/project/ProjectPositionRules'
import type { Project, ProjectMember } from "@/types/project.types"
import type { Task } from "@/types/task.types"
import type { User } from "@/store/auth-store"

export interface ProjectDetailTabsProps {
  projectId: string
  activeTab: string
  onTabChange: (tab: string) => void
  project: Project
  overviewTasks: Task[]
  totalTasksCount: number
  openTasksCount: number
  closedTasksCount: number
  trackerStats: Map<string, { open: number; closed: number; total: number }>
  totalEstimatedHours: number
  totalSpentHours: number
  projectMembers: ProjectMember[]
  canManageMembers: boolean
  canManageRules: boolean
  onRemoveMember: (id: string) => void
  onEditMember: (member: ProjectMember) => void
  user: User | null
  activitiesList: ActivityItem[]
  isLoadingSpent: boolean
}

/** Tab navigation coordinator for the project detail workspace. */
export function ProjectDetailTabs({
  projectId,
  activeTab,
  onTabChange,
  project,
  overviewTasks,
  totalTasksCount,
  openTasksCount,
  closedTasksCount,
  trackerStats,
  totalEstimatedHours,
  totalSpentHours,
  projectMembers,
  canManageMembers,
  canManageRules,
  onRemoveMember,
  onEditMember,
  user,
  activitiesList,
  isLoadingSpent,
}: ProjectDetailTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className={cn(
        "space-y-6",
        activeTab === PROJECT_TABS.KANBAN && "flex min-h-0 flex-1 flex-col space-y-4",
      )}
    >
      <TabsList className="inline-flex shrink-0 self-start rounded-full border border-border/40 bg-secondary p-1">
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
          onRemoveMember={onRemoveMember}
          onEditMember={onEditMember}
        />
      </TabsContent>

      <TabsContent value={PROJECT_TABS.ISSUES}>
        <ProjectIssuesTab
          projectId={projectId}
          members={projectMembers}
          teamLeader={project.teamLeader}
          user={user}
        />
      </TabsContent>

      <TabsContent
        value={PROJECT_TABS.KANBAN}
        className="m-0 flex h-full min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <ProjectKanbanTab
          projectId={projectId}
          members={projectMembers}
          teamLeader={project.teamLeader}
          user={user}
        />
      </TabsContent>

      <TabsContent value={PROJECT_TABS.ACTIVITY}>
        <ProjectActivityTab activitiesList={activitiesList} isLoading={isLoadingSpent} />
      </TabsContent>

      <TabsContent value={PROJECT_TABS.GANTT}>
        <ProjectGanttTab projectId={projectId} project={project} />
      </TabsContent>

      {canManageRules && (
        <TabsContent value={PROJECT_TABS.RULES}>
          <ProjectPositionRules projectId={projectId} />
        </TabsContent>
      )}
    </Tabs>
  )
}


