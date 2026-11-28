import type { HoveredTaskState } from "@/types/gantt.types"
import type { Task } from "@/types/task.types"

import React from "react"

import { differenceInDays, format } from "date-fns"
import { vi } from "date-fns/locale"
import { CheckCircle2, Clock, FileText } from "lucide-react"

interface GanttTimelineGridProps {
  timelineDays: Date[]
  dayWidth: number
  monthSpans: { label: string; startCol: number; endCol: number }[]
  treeTasks: (Task & { depth: number })[]
  getTaskGridStyle: (task: Task) => React.CSSProperties | null
  statuses: { id: string; name: string; color?: string; isCompleted: boolean }[]
  showProgress: boolean
  onSelectTaskForReview: (task: Task) => void
  onHoverTask: (state: HoveredTaskState | null) => void
}

/** Main interactive timeline grid rendering calendar columns and task milestone bars. */
export function GanttTimelineGrid({
  timelineDays,
  dayWidth,
  monthSpans,
  treeTasks,
  getTaskGridStyle,
  statuses,
  showProgress,
  onSelectTaskForReview,
  onHoverTask,
}: GanttTimelineGridProps) {
  const getDueDateCol = (dueDateStr: string | null | undefined) => {
    if (!dueDateStr) return null
    const dueDate = new Date(dueDateStr)
    const idx = timelineDays.findIndex(
      (day) =>
        day.getDate() === dueDate.getDate() &&
        day.getMonth() === dueDate.getMonth() &&
        day.getFullYear() === dueDate.getFullYear(),
    )
    return idx !== -1 ? idx + 1 : null
  }

  const getHexOpacity = (hex: string, opacityHex: string) => {
    if (hex.startsWith("#")) {
      return `${hex}${opacityHex}`
    }
    return hex
  }

  return (
    <div className="col-span-8 overflow-x-auto">
      <div style={{ width: `${timelineDays.length * dayWidth}px` }} className="flex flex-col">
        {/* Header: Months/Years and Days column labels */}
        <div className="h-16 flex flex-col border-b border-border/40 bg-muted/20">
          {/* Month/Year Span Header Row */}
          <div
            className="h-6 border-b border-border/20 grid text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none"
            style={{
              gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)`,
            }}
          >
            {monthSpans.map((span, idx) => (
              <div
                key={idx}
                style={{
                  gridColumnStart: span.startCol,
                  gridColumnEnd: span.endCol,
                }}
                className="flex items-center justify-center h-full truncate px-1 text-center bg-muted/10 border-r border-border/20"
                title={span.label}
              >
                {span.label}
              </div>
            ))}
          </div>

          {/* Days column labels */}
          <div
            className="flex-1 grid"
            style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)` }}
          >
            {timelineDays.map((day, idx) => {
              const dayName = format(day, "EEEEE", { locale: vi })
              const dayNum = format(day, "d")
              const isWeekend =
                ["T7", "CN", "S", "Su"].includes(dayName) ||
                day.getDay() === 0 ||
                day.getDay() === 6
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center border-r border-border/20 text-[10px] font-semibold py-0.5 h-full ${
                    isWeekend ? "bg-muted/30 text-rose-500/80" : "text-muted-foreground"
                  }`}
                >
                  {dayWidth >= 20 && <span>{dayName}</span>}
                  <span className={`${dayWidth < 20 ? "text-[9px]" : "text-[11px]"} font-bold`}>
                    {dayNum}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rows: Task bars display */}
        <div className="flex flex-col relative">
          {treeTasks.map((task: Task) => {
            const gridStyle = getTaskGridStyle(task)
            const isOverdue =
              task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()

            let isCompletedEarly = false
            let earlyCompletionRatio = 0
            if (task.status === "done" && task.completedAt && task.startDate && task.dueDate) {
              const taskStart = new Date(task.startDate)
              const taskDue = new Date(task.dueDate)
              const taskDone = new Date(task.completedAt)
              if (taskDone < taskDue) {
                isCompletedEarly = true
                const totalDays = differenceInDays(taskDue, taskStart) + 1
                const doneDays = differenceInDays(taskDone, taskStart) + 1
                if (totalDays > 0) {
                  earlyCompletionRatio = Math.max(0, Math.min(1, doneDays / totalDays))
                }
              }
            }

            const matchedStatus = statuses.find(
              (s) => s.id === task.statusId || s.name.toLowerCase() === task.status.toLowerCase(),
            )
            const statusColor = matchedStatus?.color || "hsl(var(--primary))"
            const isCompletedStatus = matchedStatus?.isCompleted === true || task.status === "done"

            let containerStyle: React.CSSProperties = {
              backgroundColor: getHexOpacity(statusColor, "15"),
              borderColor: getHexOpacity(statusColor, "40"),
              color: statusColor,
            }
            let progressStyle: React.CSSProperties = {
              backgroundColor: statusColor,
            }
            let progressVal = task.progress

            if (isCompletedStatus) {
              if (isCompletedEarly) {
                containerStyle = {
                  backgroundColor: "rgba(100, 116, 139, 0.15)",
                  borderColor: "rgba(100, 116, 139, 0.3)",
                  color: "inherit",
                }
                progressStyle = {
                  backgroundColor: statusColor,
                }
                progressVal = Math.round(earlyCompletionRatio * 100)
              } else {
                containerStyle = {
                  backgroundColor: statusColor,
                  borderColor: "transparent",
                  color: "hsl(var(--primary-foreground))",
                }
                progressStyle = {
                  backgroundColor: statusColor,
                }
                progressVal = 100
              }
            } else if (isOverdue) {
              containerStyle = {
                backgroundColor: "hsl(var(--destructive))",
                borderColor: "transparent",
                color: "hsl(var(--destructive-foreground))",
              }
              progressStyle = {
                backgroundColor: statusColor,
              }
            }

            return (
              <div
                key={task.id}
                className="h-16 relative grid items-center border-b border-border/40 hover:bg-muted/5 transition-colors"
                style={{
                  gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)`,
                }}
              >
                {/* Background Day Columns */}
                {timelineDays.map((day, idx) => {
                  const dayName = format(day, "EEEEE", { locale: vi })
                  const isWeekend =
                    ["T7", "CN", "S", "Su"].includes(dayName) ||
                    day.getDay() === 0 ||
                    day.getDay() === 6
                  return (
                    <div
                      key={idx}
                      style={{
                        gridColumnStart: idx + 1,
                        gridColumnEnd: idx + 2,
                        gridRowStart: 1,
                        gridRowEnd: 2,
                      }}
                      className={`h-full border-r border-border/10 pointer-events-none ${
                        isWeekend ? "bg-muted/10" : ""
                      }`}
                    />
                  )
                })}

                {/* Due Date vertical indicator line */}
                {(() => {
                  const dueDateCol = getDueDateCol(task.dueDate)
                  if (!dueDateCol) return null
                  return (
                    <div
                      style={{
                        left: `${(dueDateCol - 1) * dayWidth + dayWidth / 2}px`,
                        gridRowStart: 1,
                        gridRowEnd: 2,
                      }}
                      className="absolute top-0 h-full w-0 z-20 pointer-events-none overflow-visible"
                      title={`Hạn hoàn thành: ${task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : ""}`}
                    >
                      <div className="absolute top-4 left-0 h-[calc(100%-16px)] w-[1.5px] bg-rose-500/60" />
                      <div className="absolute top-1.5 -left-1.5 size-3.5 rounded-full bg-rose-500/40 animate-ping" />
                      <div className="absolute top-2 -left-1 size-2 rounded-full bg-rose-500 border border-white dark:border-background shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                    </div>
                  )
                })()}

                {/* Task Bar */}
                {gridStyle ? (
                  <div
                    style={{
                      ...gridStyle,
                      gridRowStart: 1,
                      gridRowEnd: 2,
                    }}
                    className="px-1 z-10 h-full flex items-center overflow-visible relative"
                  >
                    <div className="relative w-full flex items-center overflow-visible">
                      <div
                        className="h-7 w-full border rounded-full px-2.5 flex items-center justify-between text-[10px] font-medium shadow-sm select-none relative overflow-hidden group cursor-pointer"
                        style={containerStyle}
                        onDoubleClick={() => {
                          onSelectTaskForReview(task)
                        }}
                        onMouseEnter={(e) => {
                          onHoverTask({
                            task,
                            isOverdue: Boolean(isOverdue),
                            isCompletedEarly,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }}
                        onMouseMove={(e) => {
                          onHoverTask({
                            task,
                            isOverdue: Boolean(isOverdue),
                            isCompletedEarly,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }}
                        onMouseLeave={() => {
                          onHoverTask(null)
                        }}
                      >
                        {showProgress && (
                          <div
                            className="absolute top-0 left-0 h-full transition-all duration-300"
                            style={{ ...progressStyle, width: `${progressVal}%` }}
                          />
                        )}

                        <span className="truncate pr-1 z-10 text-[10px] font-semibold">
                          {task.title}
                        </span>

                        <div className="flex items-center gap-1 shrink-0 z-10">
                          {task.status === "in_review" && (
                            <FileText className="size-3 text-white/90" />
                          )}
                          {task.status === "done" && <CheckCircle2 className="size-3 text-white" />}
                          {isOverdue && <Clock className="size-3 text-white animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute left-4 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    Ngoài khoảng dòng thời gian hiển thị
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
