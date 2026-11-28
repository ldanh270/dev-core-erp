import type { DataTableColumn } from "@/components/common"
import { StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import type { InterviewRound } from "@/types/recruitment.types"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Eye, MapPin, Video } from "lucide-react"

const resultVariantMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  [INTERVIEW_RESULT.PASS]: "success",
  [INTERVIEW_RESULT.FAIL]: "danger",
  [INTERVIEW_RESULT.PENDING]: "warning",
  [INTERVIEW_RESULT.NO_SHOW]: "danger",
}

export interface InterviewsColumnsOptions {
  onViewDetails: (interview: InterviewRound) => void
}

/**
 * Factory function defining data table column schema for interview rounds.
 */
export function getInterviewsColumns({
  onViewDetails,
}: InterviewsColumnsOptions): DataTableColumn<InterviewRound>[] {
  return [
    {
      id: "candidate",
      header: "Ứng viên",
      minWidth: getTableColWidthPx("TITLE"),
      sticky: true,
      cell: (interview) => (
        <span className="font-medium text-foreground">{interview.candidateName}</span>
      ),
    },
    {
      id: "position",
      header: "Vị trí",
      minWidth: getTableColWidthPx("SCHEDULE"),
      hideBelow: "md",
      cell: (interview) => (
        <span className="text-muted-foreground text-sm">{interview.positionTitle}</span>
      ),
    },
    {
      id: "round",
      header: "Vòng",
      width: getTableColWidthPx("CODE"),
      cell: (interview) => (
        <Badge variant="outline" className="rounded-full text-[11px]">
          Vòng {interview.roundNumber}
        </Badge>
      ),
    },
    {
      id: "type",
      header: "Loại",
      width: getTableColWidthPx("TYPE"),
      hideBelow: "lg",
      cell: (interview) => (
        <span className="text-sm">
          {interview.interviewType
            ? INTERVIEW_TYPE_LABELS[interview.interviewType] || interview.interviewType
            : interview.title || "Phỏng vấn"}
        </span>
      ),
    },
    {
      id: "time",
      header: "Thời gian",
      width: getTableColWidthPx("SCHEDULE"),
      cell: (interview) => {
        if (!interview.scheduledAt) {
          return <span className="text-muted-foreground text-xs">—</span>
        }
        try {
          return (
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {format(parseISO(interview.scheduledAt), "dd/MM/yyyy", { locale: vi })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(interview.scheduledAt), "HH:mm", { locale: vi })}
                {interview.durationMinutes && ` (${interview.durationMinutes} phút)`}
              </p>
            </div>
          )
        } catch {
          return <span className="text-sm">{interview.scheduledAt}</span>
        }
      },
    },
    {
      id: "format",
      header: "Hình thức",
      width: getTableColWidthPx("TYPE"),
      hideBelow: "lg",
      cell: (interview) => (
        <div className="flex items-center gap-1.5 text-sm">
          {interview.format === "video_call" ? (
            <Video className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>
            {(interview.format && INTERVIEW_FORMAT_LABELS[interview.format]) ||
              interview.format ||
              "—"}
          </span>
        </div>
      ),
    },
    {
      id: "result",
      header: "Kết quả",
      width: getTableColWidthPx("STATUS"),
      cell: (interview) => (
        <StatusPill
          label={
            interview.result ? INTERVIEW_RESULT_LABELS[interview.result] || interview.result : "Chờ"
          }
          variant={interview.result ? resultVariantMap[interview.result] : "warning"}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      width: getTableColWidthPx("INDEX"),
      align: "right",
      cell: (interview) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(interview)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết phỏng vấn</TooltipContent>
        </Tooltip>
      ),
    },
  ]
}
