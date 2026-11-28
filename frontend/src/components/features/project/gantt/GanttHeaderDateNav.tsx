import { Button } from "@/components/ui/button"

import { addDays, format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface GanttHeaderDateNavProps {
  timelineStart: Date
  timelineDaysLength: number
  resetTimelineToProjectStart: () => void
  shiftTimeline: (days: number) => void
}

/** Navigation header allowing date shifting, month jumps, and today reset. */
export function GanttHeaderDateNav({
  timelineStart,
  timelineDaysLength,
  resetTimelineToProjectStart,
  shiftTimeline,
}: GanttHeaderDateNavProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-3">
      <div className="flex items-center gap-3">
        <Calendar className="size-5 text-primary" />
        <div>
          <h4 className="text-sm font-semibold text-foreground">Dòng thời gian dự án</h4>
          <p className="text-xs text-muted-foreground">
            Từ {format(timelineStart, "dd/MM/yyyy")} đến{" "}
            {format(addDays(timelineStart, timelineDaysLength - 1), "dd/MM/yyyy")}
          </p>
        </div>
      </div>

      {/* Top View Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetTimelineToProjectStart}
          className="rounded-full text-xs cursor-pointer"
        >
          Về ngày bắt đầu dự án
        </Button>
        <div className="flex items-center bg-secondary rounded-full p-0.5 border border-border/40">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full cursor-pointer"
            onClick={() => {
              shiftTimeline(-7)
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs font-semibold px-2">Di chuyển</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full cursor-pointer"
            onClick={() => {
              shiftTimeline(7)
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
