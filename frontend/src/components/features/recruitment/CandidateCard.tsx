import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { routerNavigate } from "@/lib/router-navigator"
import type { KanbanApplication, RecruitmentPipelineStage } from "@/types/recruitment.types"

import type { DragEventHandler } from "react"
import { format } from "date-fns"
import { Calendar } from "lucide-react"

export interface CandidateCardProps {
  application: KanbanApplication
  stages: RecruitmentPipelineStage[]
  canManageStages: boolean
  isMoving: boolean
  onMove: (stageId: string) => void
  isDragging: boolean
  draggable: boolean
  onClick?: () => void
  onDragStart: DragEventHandler
  onDragEnd: DragEventHandler
  onDragOver: DragEventHandler
  onDragLeave: DragEventHandler
  onDrop: DragEventHandler
}

/**
 * Pure UI presenter rendering a draggable Kanban candidate card with
 * interview round badges, scheduled times, and stage movement select controls.
 */
export function CandidateCard({
  application,
  stages,
  canManageStages,
  isMoving,
  onMove,
  isDragging,
  draggable,
  onClick,
  ...events
}: CandidateCardProps) {
  const isInterviewStage =
    application.pipelineStage?.name?.toLowerCase().includes("phỏng vấn") ||
    application.pipelineStage?.name?.toLowerCase().includes("interview")
  const latestRound = application.interviewRounds?.[application.interviewRounds.length - 1]
  const completedRounds =
    application.interviewRounds?.filter((round) => round.status === "completed").length ?? 0

  return (
    <div
      draggable={draggable}
      onClick={onClick}
      {...events}
      className={`group/card space-y-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "scale-[0.98] opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="rounded-full px-1.5 py-0 text-[9px] font-bold uppercase"
        >
          {application.source}
        </Badge>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            routerNavigate(`/recruitment/applications/${application.id}?tab=interviews`)
          }}
          className="transition-transform hover:scale-105 focus:outline-none"
          title="Xem chi tiết các vòng phỏng vấn"
        >
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              latestRound?.result === "pass"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                : isInterviewStage
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Calendar className="size-2.5" />
            {latestRound
              ? `Vòng ${latestRound.roundNumber}: ${
                  latestRound.result === "pass"
                    ? "Pass"
                    : latestRound.result === "fail"
                      ? "Fail"
                      : latestRound.status === "completed"
                        ? "Đã xong"
                        : "Chờ PV"
                }`
              : `${completedRounds} vòng PV`}
          </Badge>
        </button>
      </div>

      <div>
        <p className="line-clamp-2 text-xs font-bold text-foreground transition-colors group-hover/card:text-primary">
          {application.candidate.fullName}
        </p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {application.candidate.email}
        </p>
      </div>

      {isInterviewStage && latestRound && (
        <div className="rounded-lg bg-secondary/35 p-2 text-[10px] space-y-1 border border-border/40">
          <div className="flex items-center justify-between font-medium text-foreground">
            <span className="truncate font-semibold">{latestRound.title}</span>
            <span className="font-mono text-muted-foreground shrink-0 ml-1">
              {latestRound.scheduledAt
                ? format(new Date(latestRound.scheduledAt), "HH:mm, dd/MM")
                : "Chờ xếp lịch"}
            </span>
          </div>
          {latestRound.interviewers && latestRound.interviewers.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground truncate">
              <span>PV:</span>
              <span className="font-semibold text-foreground truncate">
                {latestRound.interviewers.map((i: { fullName: string }) => i.fullName).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {canManageStages && (
        <div
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <Label className="sr-only" htmlFor={`move-stage-${application.id}`}>
            Chuyển {application.candidate.fullName} sang giai đoạn khác
          </Label>
          <Select
            value={application.pipelineStage?.id ?? ""}
            onValueChange={onMove}
            disabled={isMoving}
          >
            <SelectTrigger id={`move-stage-${application.id}`} className="h-9 rounded-full text-xs">
              <SelectValue placeholder="Chuyển giai đoạn" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-[10px]">
        <span className="font-mono font-semibold text-muted-foreground/80">
          #{application.id.substring(0, 5)}
        </span>
        <span className="truncate font-semibold text-foreground">
          {application.assignedTo?.fullName ?? "Chưa phân công"}
        </span>
      </div>
    </div>
  )
}
