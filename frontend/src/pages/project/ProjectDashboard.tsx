import { PageContainer, PageHeader } from "@/components/common"
import { DashboardTaskTablesLayout } from "@/components/features/project/DashboardTaskTablesLayout"
import LogTimeModal from "@/components/features/project/LogTimeModal"
import { ProjectGridCards } from "@/components/features/project/ProjectGridCards"
import { useTaskTableColumns } from "@/components/features/project/use-task-table-columns"
import { useProjectDashboard } from "@/hooks/project/use-project-dashboard"

import { TaskContextMenu } from "@/components/features/project/context-menu/TaskContextMenu"

/**
 * Tier 2 Page Orchestrator for personal project dashboard, task queues, and quick actions.
 */
export default function ProjectDashboard() {
  const {
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
  } = useProjectDashboard()

  const taskColumns = useTaskTableColumns({ onOpenActionMenu: handleOpenActionMenu })

  return (
    <PageContainer variant="table">
      <PageHeader
        title="Tổng quan của tôi (My Page)"
        description="Quản lý các dự án và công việc được phân công cho bạn"
      />

      <ProjectGridCards
        projects={projects}
        isLoading={isLoadingProjects}
        currentUserId={user?.id}
        hasAnyPermission={hasAnyPermission}
        onSelectProject={(projectId) => {
          sessionStorage.setItem("activeProjectId", projectId)
          navigate(`/project/${projectId}/overview`)
        }}
      />

      <DashboardTaskTablesLayout
        taskColumns={taskColumns}
        assignedTasks={assignedTasks}
        assignedTotal={assignedTasksData?.meta.total || 0}
        assignedTotalPages={assignedTasksData?.meta.totalPages || 0}
        assignedPage={assignedPage}
        assignedLimit={assignedLimit}
        isLoadingAssigned={isLoadingAssigned}
        onAssignedPageChange={setAssignedPage}
        onAssignedLimitChange={(newLimit) => {
          setAssignedLimit(newLimit)
          setAssignedPage(1)
        }}
        reportedTasks={reportedTasks}
        reportedTotal={reportedTasksData?.meta.total || 0}
        reportedTotalPages={reportedTasksData?.meta.totalPages || 0}
        reportedPage={reportedPage}
        reportedLimit={reportedLimit}
        isLoadingReported={isLoadingReported}
        onReportedPageChange={setReportedPage}
        onReportedLimitChange={(newLimit) => {
          setReportedLimit(newLimit)
          setReportedPage(1)
        }}
        onRowContextMenu={handleRowContextMenu}
        activeContextMenuTaskId={contextMenu.isOpen ? contextMenu.task?.id : null}
      />

      <TaskContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        task={contextMenu.task}
        projectMembers={activeProjectMembers}
        onClose={handleCloseContextMenu}
        onUpdateTask={handleUpdateTask}
        onLogTime={handleOpenLogTime}
      />

      {logTimeTask && (
        <LogTimeModal
          open={isLogTimeOpen}
          onOpenChange={setIsLogTimeOpen}
          taskId={logTimeTask.id}
          taskTitle={logTimeTask.title}
        />
      )}
    </PageContainer>
  )
}
