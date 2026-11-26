import { StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/config/entities/recruitment.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import type { InterviewRound } from "@/types/recruitment.types"
import { format } from "date-fns"
import { ArrowUpRight, Calendar as CalendarIcon, MapPin, Star, Video } from "lucide-react"

export interface MyInterviewCardProps {
  interview: InterviewRound
  onFeedback: () => void
}

/**
 * Pure UI presenter rendering an interviewer's assigned round card
 * with candidate details, interview format badges, result pill, and feedback trigger.
 */
export function MyInterviewCard({ interview, onFeedback }: MyInterviewCardProps) {
  const candidate = interview.application?.candidate

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full border border-border/50 bg-primary/10 text-lg font-bold text-primary overflow-hidden shrink-0 shadow-2xs">
          {candidate?.avatarUrl ? (
            <img
              src={candidate.avatarUrl}
              alt={candidate.fullName ?? "Ứng viên"}
              className="size-full object-cover"
            />
          ) : (
            (candidate?.fullName?.charAt(0).toUpperCase() ?? "U")
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(TYPOGRAPHY.BOARD_CARD_TITLE, "text-base")}>
              {candidate?.fullName || "Ứng viên chưa cập nhật"}
            </h4>
            <Badge
              variant="outline"
              className="rounded-full bg-primary/10 text-primary border-primary/20 font-bold text-xs"
            >
              Vòng {interview.roundNumber}: {interview.title}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Yêu cầu tuyển dụng:{" "}
            <span className="text-foreground">
              {interview.application?.requisition?.title || "N/A"}
            </span>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-foreground font-semibold">
              <CalendarIcon className="size-3.5 text-primary" />
              <span className="font-mono">
                {interview.scheduledAt
                  ? format(new Date(interview.scheduledAt), "HH:mm, dd/MM/yyyy")
                  : "Chưa xếp lịch"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-foreground font-semibold">
              {interview.format === "video_call" ? (
                <Video className="size-3.5 text-info" />
              ) : (
                <MapPin className="size-3.5 text-success" />
              )}
              <span>{INTERVIEW_FORMAT_LABELS[interview.format] ?? interview.format}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <StatusPill
          label={
            interview.status === "completed"
              ? (INTERVIEW_RESULT_LABELS[interview.result as string] ?? "Đã xong")
              : interview.status === "scheduled"
                ? "Sắp diễn ra"
                : interview.status === "cancelled"
                  ? "Đã hủy"
                  : "Chưa phỏng vấn"
          }
          variant={
            interview.result === "pass"
              ? "success"
              : interview.result === "fail" ||
                  interview.status === "cancelled" ||
                  interview.status === "no_show"
                ? "danger"
                : interview.status === "scheduled"
                  ? "info"
                  : "neutral"
          }
        />

        <div className="flex items-center gap-2">
          {interview.application?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (interview.application?.id)
                  routerNavigate(`/recruitment/applications/${interview.application.id}`)
              }}
              className="h-8 rounded-full text-xs font-semibold border-border/80 hover:bg-secondary"
            >
              Hồ sơ
              <ArrowUpRight className="ml-1 size-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onFeedback}
            className="h-8 rounded-full px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <Star className="mr-1.5 size-3.5 fill-current" />
            {interview.status === "completed" ? "Xem đánh giá" : "Đánh giá ngay"}
          </Button>
        </div>
      </div>
    </div>
  )
}
