import LogTimeModal from "@/components/features/project/LogTimeModal"
import { TaskContextMenu } from "@/components/features/project/context-menu/TaskContextMenu"
import type { ProjectMember } from "@/types/project.types"

import { CreateCustomQueryDialog } from "./issues/CreateCustomQueryDialog"
import { IssuesFilterToolbar } from "./issues/IssuesFilterToolbar"
import { IssuesPagination } from "./issues/IssuesPagination"
import { IssuesSidebarQueries } from "./issues/IssuesSidebarQueries"
import { IssuesTable } from "./issues/IssuesTable"
import { useProjectIssuesTab } from "./issues/useProjectIssuesTab"

export interface ProjectIssuesTabProps {
  projectId: string
  members: ProjectMember[]
  teamLeader?: {
    id: string
    fullName: string
    email: string
  } | null
  user: {
    id: string
    role?: string
    fullName: string
  } | null
}

/** Main issues management workspace housing query filters, issue table, and pagination. */
export function ProjectIssuesTab(props: ProjectIssuesTabProps) {
  const { projectId, members, teamLeader, user } = props
  const tab = useProjectIssuesTab({ projectId, members, teamLeader, user })

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main Issues list table container */}
      <div className="col-span-12 lg:col-span-9 space-y-4">
        <IssuesFilterToolbar
          issueSearch={tab.issueSearch}
          setIssueSearch={tab.setIssueSearch}
          trackerFilter={tab.trackerFilter}
          setTrackerFilter={tab.setTrackerFilter}
          statusFilter={tab.statusFilter}
          setStatusFilter={tab.setStatusFilter}
          priorityFilter={tab.priorityFilter}
          setPriorityFilter={tab.setPriorityFilter}
          assigneeFilter={tab.assigneeFilter}
          setAssigneeFilter={tab.setAssigneeFilter}
          statuses={tab.statuses}
          teamLeader={teamLeader}
          members={members}
        />

        <div className="space-y-4">
          <IssuesTable
            isLoadingTasks={tab.isLoadingTasks}
            tasks={tab.tasks}
            displayColumns={tab.displayColumns}
            statuses={tab.statuses}
            onOpenContextMenu={(task, x, y) => {
              tab.setContextMenu({ isOpen: true, x, y, task })
            }}
          />

          <IssuesPagination
            currentPage={tab.currentPage}
            setCurrentPage={tab.setCurrentPage}
            pageSize={tab.pageSize}
            setPageSize={tab.setPageSize}
            totalItems={tab.totalItems}
            totalPages={tab.totalPages}
            startRange={tab.startRange}
            endRange={tab.endRange}
          />
        </div>
      </div>

      {/* Sidebar Queries filters section */}
      <IssuesSidebarQueries
        user={user}
        assigneeFilter={tab.assigneeFilter}
        setAssigneeFilter={tab.setAssigneeFilter}
        createdByIdFilter={tab.createdByIdFilter}
        setCreatedByIdFilter={tab.setCreatedByIdFilter}
        sortBy={tab.sortBy}
        setSortBy={tab.setSortBy}
        sortOrder={tab.sortOrder}
        setSortOrder={tab.setSortOrder}
        clearAllFilters={tab.clearAllFilters}
        savedQueries={tab.savedQueries}
        applySavedQuery={tab.applySavedQuery}
        onDeleteQuery={(id) => {
          tab.deleteQueryMutation.mutate(id)
        }}
        onOpenNewQueryDialog={() => {
          tab.setIsNewQueryOpen(true)
        }}
      />

      {/* Dialog for Creating New Custom Query */}
      <CreateCustomQueryDialog
        isOpen={tab.isNewQueryOpen}
        onOpenChange={tab.setIsNewQueryOpen}
        newQueryName={tab.newQueryName}
        setNewQueryName={tab.setNewQueryName}
        newQueryDesc={tab.newQueryDesc}
        setNewQueryDesc={tab.setNewQueryDesc}
        newQueryForAll={tab.newQueryForAll}
        setNewQueryForAll={tab.setNewQueryForAll}
        newQueryDefaultCols={tab.newQueryDefaultCols}
        setNewQueryDefaultCols={tab.setNewQueryDefaultCols}
        newQuerySelectedCols={tab.newQuerySelectedCols}
        setNewQuerySelectedCols={tab.setNewQuerySelectedCols}
        availSelectedKey={tab.availSelectedKey}
        setAvailSelectedKey={tab.setAvailSelectedKey}
        selSelectedKey={tab.selSelectedKey}
        setSelSelectedKey={tab.setSelSelectedKey}
        newQueryFilters={tab.newQueryFilters}
        setNewQueryFilters={tab.setNewQueryFilters}
        onSubmit={tab.handleSubmitSaveQuery}
        isSubmitting={tab.isSavingQuery}
        statuses={tab.statuses}
        teamLeader={teamLeader}
        members={members}
      />

      {/* Floating Task Context Menu with Auto Positioning */}
      <TaskContextMenu
        isOpen={tab.contextMenu.isOpen}
        x={tab.contextMenu.x}
        y={tab.contextMenu.y}
        task={tab.contextMenu.task}
        projectMembers={members}
        statuses={tab.statuses}
        onClose={() => {
          tab.setContextMenu({ isOpen: false, x: 0, y: 0, task: null })
        }}
        onUpdateTask={tab.handleUpdateTask}
        onLogTime={(t: { id: string; title: string }) => {
          tab.setLogTimeTask(t)
          tab.setIsLogTimeOpen(true)
        }}
      />

      {/* Log Time Modal */}
      {tab.logTimeTask && (
        <LogTimeModal
          open={tab.isLogTimeOpen}
          onOpenChange={tab.setIsLogTimeOpen}
          taskId={tab.logTimeTask.id}
          taskTitle={tab.logTimeTask.title}
        />
      )}
    </div>
  )
}
