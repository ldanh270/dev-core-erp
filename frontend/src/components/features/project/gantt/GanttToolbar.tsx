import { ChevronDown, ChevronRight } from "lucide-react"

import { GanttFilterEditor } from "./GanttFilterEditor"
import { GanttHeaderDateNav } from "./GanttHeaderDateNav"
import { GanttMonthZoomControls } from "./GanttMonthZoomControls"
import { GanttViewOptionsPanel } from "./GanttViewOptionsPanel"

interface GanttToolbarProps {
  timelineStart: Date
  timelineDaysLength: number
  resetTimelineToProjectStart: () => void
  shiftTimeline: (days: number) => void
  isFiltersExpanded: boolean
  setIsFiltersExpanded: (expanded: boolean) => void
  activeFilterKeys: string[]
  setActiveFilterKeys: React.Dispatch<React.SetStateAction<string[]>>
  filterStates: Record<string, { enabled: boolean; operator: string; value: string } | undefined>
  setFilterStates: React.Dispatch<
    React.SetStateAction<
      Record<string, { enabled: boolean; operator: string; value: string } | undefined>
    >
  >
  assignees: { id: string; fullName: string }[]
  getDefaultOperator: (key: string) => string
  getDefaultValue: (key: string) => string
  isOptionsExpanded: boolean
  setIsOptionsExpanded: (expanded: boolean) => void
  showEstTime: boolean
  setShowEstTime: (show: boolean) => void
  showAssignee: boolean
  setShowAssignee: (show: boolean) => void
  showProgress: boolean
  setShowProgress: (show: boolean) => void
  monthsInput: string
  setMonthsInput: (val: string) => void
  monthInput: number
  setMonthInput: (val: number) => void
  yearInput: number
  setYearInput: (val: number) => void
  availableYears: number[]
  handleApplyFilters: () => void
  handleClearFilters: () => void
  handleOpenSaveDialog: () => void
  handleZoomIn: () => void
  handleZoomOut: () => void
  shiftTimelineByMonth: (months: number) => void
  getMonthOffsetLabel: (months: number) => string
  statuses: { id: string; name: string; color?: string }[]
}

/** Top toolbar housing quick query filters, zoom controls, and custom query actions. */
export function GanttToolbar({
  timelineStart,
  timelineDaysLength,
  resetTimelineToProjectStart,
  shiftTimeline,
  isFiltersExpanded,
  setIsFiltersExpanded,
  activeFilterKeys,
  setActiveFilterKeys,
  filterStates,
  setFilterStates,
  assignees,
  getDefaultOperator,
  getDefaultValue,
  isOptionsExpanded,
  setIsOptionsExpanded,
  showEstTime,
  setShowEstTime,
  showAssignee,
  setShowAssignee,
  showProgress,
  setShowProgress,
  monthsInput,
  setMonthsInput,
  monthInput,
  setMonthInput,
  yearInput,
  setYearInput,
  availableYears,
  handleApplyFilters,
  handleClearFilters,
  handleOpenSaveDialog,
  handleZoomIn,
  handleZoomOut,
  shiftTimelineByMonth,
  getMonthOffsetLabel,
  statuses,
}: GanttToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Gantt Header Tools */}
      <div className="flex flex-col gap-4 bg-background p-4 rounded-xl border border-border/40 shadow-sm">
        <GanttHeaderDateNav
          timelineStart={timelineStart}
          timelineDaysLength={timelineDaysLength}
          resetTimelineToProjectStart={resetTimelineToProjectStart}
          shiftTimeline={shiftTimeline}
        />

        {/* Collapsible Filters Toggle */}
        <div className="flex items-center">
          <button
            onClick={() => {
              setIsFiltersExpanded(!isFiltersExpanded)
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none cursor-pointer"
          >
            {isFiltersExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            Bộ lọc
          </button>
        </div>

        {/* Collapsible Filters Box */}
        {isFiltersExpanded && (
          <GanttFilterEditor
            activeFilterKeys={activeFilterKeys}
            setActiveFilterKeys={setActiveFilterKeys}
            filterStates={filterStates}
            setFilterStates={setFilterStates}
            assignees={assignees}
            getDefaultOperator={getDefaultOperator}
            getDefaultValue={getDefaultValue}
          />
        )}

        {/* Collapsible Options Toggle */}
        <div className="flex items-center">
          <button
            onClick={() => {
              setIsOptionsExpanded(!isOptionsExpanded)
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none cursor-pointer"
          >
            {isOptionsExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            Tùy chọn
          </button>
        </div>

        {/* Collapsible Options Box */}
        {isOptionsExpanded && (
          <GanttViewOptionsPanel
            showEstTime={showEstTime}
            setShowEstTime={setShowEstTime}
            showAssignee={showAssignee}
            setShowAssignee={setShowAssignee}
            showProgress={showProgress}
            setShowProgress={setShowProgress}
          />
        )}

        {/* Filter Controls & Zoom Bar */}
        <GanttMonthZoomControls
          monthsInput={monthsInput}
          setMonthsInput={setMonthsInput}
          monthInput={monthInput}
          setMonthInput={setMonthInput}
          yearInput={yearInput}
          setYearInput={setYearInput}
          availableYears={availableYears}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleClearFilters}
          handleOpenSaveDialog={handleOpenSaveDialog}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          shiftTimelineByMonth={shiftTimelineByMonth}
          getMonthOffsetLabel={getMonthOffsetLabel}
        />
      </div>

      {/* Gantt Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground px-1">
        {statuses.map((status) => (
          <div key={status.id} className="flex items-center gap-2">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: status.color || "hsl(var(--primary))" }}
            />
            <span>{status.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="size-3 rounded bg-rose-600 animate-pulse" />
          <span>Trễ hạn (Overdue)</span>
        </div>
      </div>
    </div>
  )
}
