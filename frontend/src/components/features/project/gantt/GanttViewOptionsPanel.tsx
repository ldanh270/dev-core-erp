interface GanttViewOptionsPanelProps {
  showEstTime: boolean
  setShowEstTime: (show: boolean) => void
  showAssignee: boolean
  setShowAssignee: (show: boolean) => void
  showProgress: boolean
  setShowProgress: (show: boolean) => void
}

/** Popover panel configuring column visibility and display options for Gantt charts. */
export function GanttViewOptionsPanel({
  showEstTime,
  setShowEstTime,
  showAssignee,
  setShowAssignee,
  showProgress,
  setShowProgress,
}: GanttViewOptionsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/10 p-4 rounded-xl border border-border/40 text-xs">
      <div className="space-y-2">
        <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
          Cột hiển thị
        </h5>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEstTime}
              onChange={(e) => {
                setShowEstTime(e.target.checked)
              }}
              className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
            />
            <span>Ước lượng thời gian & log time (Est)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAssignee}
              onChange={(e) => {
                setShowAssignee(e.target.checked)
              }}
              className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
            />
            <span>Người thực hiện nhiệm vụ (Assignee)</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">Tiến độ</h5>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showProgress}
              onChange={(e) => {
                setShowProgress(e.target.checked)
              }}
              className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
            />
            <span>Hiển thị nhãn tiến độ dòng thời gian</span>
          </label>
        </div>
      </div>
    </div>
  )
}
