import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/config/entities/recruitment.config"
import type { InterviewRound } from "@/types/recruitment.types"

import { Calendar, Clock, MapPin, User, Video } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: InterviewRound | null
}

const resultVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pass: "success",
  fail: "danger",
  pending: "warning",
  no_show: "neutral",
}

export function ViewInterviewDialog({ open, onOpenChange, interview }: Props) {
  if (!interview) return null

  const isVideo = interview.format === "video_call"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              Vòng {interview.roundNumber} ·{" "}
              {interview.interviewType
                ? INTERVIEW_TYPE_LABELS[interview.interviewType] || interview.interviewType
                : interview.title || "Phỏng vấn"}
            </Badge>
            {interview.result ? (
              <StatusPill
                label={INTERVIEW_RESULT_LABELS[interview.result] || interview.result}
                variant={
                  resultVariantMap[interview.result as keyof typeof resultVariantMap] ?? "neutral"
                }
              />
            ) : (
              <StatusPill label="Chờ phỏng vấn" variant="warning" />
            )}
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            Chi tiết lịch phỏng vấn
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-3 text-sm">
          {/* Candidate & Position */}
          <div className="rounded-lg bg-muted/30 p-4 border border-border space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Ứng viên</span>
              <div className="flex items-center gap-2 mt-0.5">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {interview.candidateName}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Vị trí phỏng vấn
              </span>
              <span className="text-sm font-medium text-foreground">{interview.positionTitle}</span>
            </div>
          </div>

          {/* Time & Format */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/20 p-3 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Thời gian</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-0.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {interview.scheduledAt
                    ? new Date(interview.scheduledAt).toLocaleString("vi-VN")
                    : "Chưa lên lịch"}
                </span>
              </div>
              {interview.durationMinutes && (
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Thời lượng: {interview.durationMinutes} phút
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Hình thức</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-0.5">
                {isVideo ? (
                  <Video className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                )}
                <span>{INTERVIEW_FORMAT_LABELS[interview.format] || interview.format}</span>
              </div>
            </div>
          </div>

          {/* Location / Meeting Link */}
          {interview.location && (
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                {isVideo ? "Link họp trực tuyến" : "Địa điểm phỏng vấn"}
              </span>
              {isVideo ? (
                <a
                  href={interview.location}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary hover:underline break-all mt-0.5 inline-block"
                >
                  {interview.location}
                </a>
              ) : (
                <p className="text-xs text-foreground mt-0.5">{interview.location}</p>
              )}
            </div>
          )}

          {/* Feedback / Notes */}
          {interview.notes && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">
                Nhận xét / Ghi chú
              </span>
              <div className="rounded-lg bg-muted/20 p-3 border border-border text-xs text-foreground whitespace-pre-wrap">
                {interview.notes}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
