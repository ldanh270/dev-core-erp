import type { Project } from "@/types/project.types"

import { Clock } from "lucide-react"

import { GanttLeftTaskList } from "./gantt/GanttLeftTaskList"
import { GanttSaveQueryDialog } from "./gantt/GanttSaveQueryDialog"
import { GanttSidebarQueries } from "./gantt/GanttSidebarQueries"
import { GanttTaskHoverTooltip } from "./gantt/GanttTaskHoverTooltip"
import { GanttTimelineGrid } from "./gantt/GanttTimelineGrid"
import { GanttToolbar } from "./gantt/GanttToolbar"
import { useProjectGanttTabState } from "./gantt/useProjectGanttTabState"
import { TaskReviewModal } from './TaskReviewModal'

/**
 * Properties for ProjectGanttTab component.
 */
interface ProjectGanttTabProps {
  projectId: string
  project: Project
}

/**
 * Gantt timeline tab component. Allows project managers and team members to visualize,
 * track, plan, and manage task schedules dynamically across a grid-based timeline.
 */
export function ProjectGanttTab({ projectId, project }: ProjectGanttTabProps) {
  const state = useProjectGanttTabState({ projectId, project })

  if (state.isLoading || state.isLoadingStatuses) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Clock className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu Gantt...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        <GanttToolbar
          timelineStart={state.timelineStart}
          timelineDaysLength={state.timelineDays.length}
          resetTimelineToProjectStart={state.resetTimelineToProjectStart}
          shiftTimeline={state.shiftTimeline}
          isFiltersExpanded={state.isFiltersExpanded}
          setIsFiltersExpanded={state.setIsFiltersExpanded}
          activeFilterKeys={state.activeFilterKeys}
          setActiveFilterKeys={state.setActiveFilterKeys}
          filterStates={state.filterStates}
          setFilterStates={state.setFilterStates}
          assignees={state.assignees}
          getDefaultOperator={state.getDefaultOperator}
          getDefaultValue={state.getDefaultValue}
          isOptionsExpanded={state.isOptionsExpanded}
          setIsOptionsExpanded={state.setIsOptionsExpanded}
          showEstTime={state.showEstTime}
          setShowEstTime={state.setShowEstTime}
          showAssignee={state.showAssignee}
          setShowAssignee={state.setShowAssignee}
          showProgress={state.showProgress}
          setShowProgress={state.setShowProgress}
          monthsInput={state.monthsInput}
          setMonthsInput={state.setMonthsInput}
          monthInput={state.monthInput}
          setMonthInput={state.setMonthInput}
          yearInput={state.yearInput}
          setYearInput={state.setYearInput}
          availableYears={state.availableYears}
          handleApplyFilters={state.handleApplyFilters}
          handleClearFilters={state.handleClearFilters}
          handleOpenSaveDialog={state.handleOpenSaveDialog}
          handleZoomIn={state.handleZoomIn}
          handleZoomOut={state.handleZoomOut}
          shiftTimelineByMonth={state.shiftTimelineByMonth}
          getMonthOffsetLabel={state.getMonthOffsetLabel}
          statuses={state.statuses}
        />

        {/* Main Gantt Grid Container */}
        <div className="rounded-xl border border-border/40 shadow-sm overflow-hidden bg-background">
          <div className="grid grid-cols-12 min-w-225 divide-x divide-border/40">
            <GanttLeftTaskList
              treeTasks={state.treeTasks}
              showEstTime={state.showEstTime}
              showAssignee={state.showAssignee}
              onSelectTaskForReview={(task) => {
                state.setSelectedTaskForReview(task)
              }}
            />

            <GanttTimelineGrid
              timelineDays={state.timelineDays}
              dayWidth={state.dayWidth}
              monthSpans={state.monthSpans}
              treeTasks={state.treeTasks}
              getTaskGridStyle={state.getTaskGridStyle}
              statuses={state.statuses}
              showProgress={state.showProgress}
              onSelectTaskForReview={(task) => {
                state.setSelectedTaskForReview(task)
              }}
              onHoverTask={state.setHoveredTask}
            />
          </div>
        </div>
      </div>

      {/* Sidebar for Quick Queries */}
      <GanttSidebarQueries
        isSidebarExpanded={state.isSidebarExpanded}
        setIsSidebarExpanded={state.setIsSidebarExpanded}
        handleQuickQuery={state.handleQuickQuery}
        savedQueries={state.savedQueries}
        applySavedQuery={state.applySavedQuery}
        deleteQueryMutation={state.deleteQueryMutation}
      />

      {/* Review & Deliverable submission Modal */}
      {state.selectedTaskForReview && (
        <TaskReviewModal
          isOpen={!!state.selectedTaskForReview}
          onOpenChange={(open) => {
            if (!open) state.setSelectedTaskForReview(null)
          }}
          task={state.selectedTaskForReview}
          projectId={projectId}
          isLeader={state.isLeader}
          isAdminOrGM={state.isAdminOrGM}
        />
      )}

      {/* Save Custom Query Dialog */}
      <GanttSaveQueryDialog
        isOpen={state.isSaveQueryOpen}
        onOpenChange={state.setIsSaveQueryOpen}
        newQueryName={state.newQueryName}
        setNewQueryName={state.setNewQueryName}
        newQueryDesc={state.newQueryDesc}
        setNewQueryDesc={state.setNewQueryDesc}
        newQueryForAll={state.newQueryForAll}
        setNewQueryForAll={state.setNewQueryForAll}
        newQueryDefaultCols={state.newQueryDefaultCols}
        setNewQueryDefaultCols={state.setNewQueryDefaultCols}
        newQuerySelectedCols={state.newQuerySelectedCols}
        setNewQuerySelectedCols={state.setNewQuerySelectedCols}
        availSelectedKey={state.availSelectedKey}
        setAvailSelectedKey={state.setAvailSelectedKey}
        selSelectedKey={state.selSelectedKey}
        setSelSelectedKey={state.setSelSelectedKey}
        newQueryFilterKeys={state.newQueryFilterKeys}
        setNewQueryFilterKeys={state.setNewQueryFilterKeys}
        newQueryFilters={state.newQueryFilters}
        setNewQueryFilters={state.setNewQueryFilters}
        onSubmit={state.handleSubmitSaveQuery}
        isSubmitting={state.saveQueryMutation.isPending}
        assignees={state.assignees}
        getDefaultOperator={state.getDefaultOperator}
        getDefaultValue={state.getDefaultValue}
      />

      {/* Floating Mouse Cursor Tooltip for Gantt Task Bar */}
      <GanttTaskHoverTooltip hoveredTask={state.hoveredTask} />
    </div>
  )
}

