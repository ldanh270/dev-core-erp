import type { HoveredTaskState } from "@/types/gantt.types"

import { format } from "date-fns"

interface GanttTaskHoverTooltipProps {
  hoveredTask: HoveredTaskState | null
}

/** Hover tooltip displaying task progress, dates, and assignees over Gantt bars. */
export function GanttTaskHoverTooltip({ hoveredTask }: GanttTaskHoverTooltipProps) {
  if (!hoveredTask) return null

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200
  const leftPos = Math.min(Math.max(hoveredTask.x, 160), viewportWidth - 160)
  const isTopClose = hoveredTask.y < 140

  return (
    <div
      className="fixed pointer-events-none z-50 rounded-xl bg-foreground text-background p-3 shadow-2xl max-w-75 text-xs space-y-1 select-none border border-border/20 backdrop-blur-sm"
      style={{
        left: `${leftPos}px`,
        top: isTopClose ? `${hoveredTask.y + 16}px` : `${hoveredTask.y - 12}px`,
        transform: isTopClose ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
    >
      <p className="font-bold leading-snug">{hoveredTask.task.title}</p>
      <p className="text-background/80 font-medium text-[10px]">
        Lịch:{" "}
        {hoveredTask.task.startDate
          ? format(new Date(hoveredTask.task.startDate), "dd/MM/yyyy")
          : "?"}{" "}
        -{" "}
        {hoveredTask.task.dueDate ? format(new Date(hoveredTask.task.dueDate), "dd/MM/yyyy") : "?"}
      </p>
      <p className="font-medium text-[10px]">
        Tiến độ: {hoveredTask.task.progress}% (
        {hoveredTask.task.status === "done" && hoveredTask.isCompletedEarly
          ? "hoàn thành sớm"
          : hoveredTask.task.status}
        )
      </p>
      {hoveredTask.task.status === "done" &&
        hoveredTask.isCompletedEarly &&
        hoveredTask.task.completedAt && (
          <p className="text-emerald-400 font-semibold text-[10px]">
            Xong ngày: {format(new Date(hoveredTask.task.completedAt), "dd/MM/yyyy")}
          </p>
        )}
      {hoveredTask.isOverdue && (
        <p className="text-rose-400 font-bold text-[10px]">Cảnh báo: Đã quá hạn hoàn thành!!!</p>
      )}
    </div>
  )
}
