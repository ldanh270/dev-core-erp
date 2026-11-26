import { PageContainer } from "@/components/common"
import { PROJECT_TABS, useProjectDetail } from "@/hooks/project/use-project-detail"
import { cn } from "@/lib/utils"
import { ProjectDetailErrorState } from "@/components/features/project/ProjectDetailErrorState"
import { ProjectDetailModals } from "@/components/features/project/ProjectDetailModals"
import { ProjectDetailSkeleton } from "@/components/features/project/ProjectDetailSkeleton"
import { ProjectDetailTabs } from "@/pages/project/components/project-detail-tabs"
import { ProjectHeader } from "@/pages/project/components/project-header"

/**
 * Tier 2 Page Orchestrator for project detail workspace and multi-tab coordination.
 */
export default function ProjectDetail() {
  const {
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
  } = useProjectDetail()

  if (isLoadingProject) {
    return <ProjectDetailSkeleton />
  }

  if (isProjectError || !project) {
    return <ProjectDetailErrorState />
  }

  return (
    <PageContainer
      variant={activeTab === PROJECT_TABS.KANBAN ? "table" : "default"}
      className={cn("space-y-6", activeTab === PROJECT_TABS.KANBAN && "gap-4 space-y-4 p-4 md:p-6")}
    >
      <ProjectHeader
        projectId={projectId}
        name={project.name}
        description={project.description}
        canCreateTask={canCreateTask}
        canManageMembers={canManageMembers}
        onOpenEditProject={() => setIsOpenEditProjectModal(true)}
        onOpenAddMember={() => setIsOpenMemberModal(true)}
        onOpenAiDecompose={() => setIsAiDecomposeOpen(true)}
      />

      <ProjectDetailTabs
        projectId={projectId}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        project={project}
        overviewTasks={overviewTasks}
        totalTasksCount={totalTasksCount}
        openTasksCount={openTasksCount}
        closedTasksCount={closedTasksCount}
        trackerStats={trackerStats}
        totalEstimatedHours={totalEstimatedHours}
        totalSpentHours={totalSpentHours}
        projectMembers={projectMembers}
        canManageMembers={canManageMembers}
        canManageRules={canManageRules}
        onRemoveMember={handleRemoveMember}
        onEditMember={setEditingMember}
        user={user}
        activitiesList={activitiesList}
        isLoadingSpent={isLoadingSpent}
      />

      <ProjectDetailModals
        projectId={projectId}
        project={project}
        projectMembers={projectMembers}
        allEmployees={allEmployees}
        isOpenMemberModal={isOpenMemberModal}
        onOpenMemberModalChange={setIsOpenMemberModal}
        editingMember={editingMember}
        onEditingMemberChange={setEditingMember}
        isOpenEditProjectModal={isOpenEditProjectModal}
        onOpenEditProjectModalChange={setIsOpenEditProjectModal}
        isAiDecomposeOpen={isAiDecomposeOpen}
        onAiDecomposeOpenChange={setIsAiDecomposeOpen}
      />
    </PageContainer>
  )
}
