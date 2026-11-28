import { PageCard, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/config/entities/recruitment.config"
import type { Employee } from "@/types/employee.types"
import type { InterviewRound, Scorecard } from "@/types/recruitment.types"

import { format } from "date-fns"
import { Calendar, MapPin, Pencil, Plus, Star, Video } from "lucide-react"

const FORMAT_LABELS_MAP = new Map(Object.entries(INTERVIEW_FORMAT_LABELS))
const RESULT_LABELS_MAP = new Map(Object.entries(INTERVIEW_RESULT_LABELS))

/**
 * Presentational scorecard list component showing star ratings and feedback.
 */
function InterviewScorecardList({ scorecards }: { scorecards: Scorecard[] | undefined }) {
  if (!scorecards || scorecards.length === 0) {
    return (
      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs italic text-muted-foreground">
        <span>Chưa có phiếu đánh giá cho vòng này</span>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
      <div className="flex items-center justify-between text-xs font-bold text-foreground">
        <span>Kết quả đánh giá từ người phỏng vấn ({scorecards.length})</span>
      </div>
      {scorecards.map((sc: Scorecard) => (
        <div
          key={sc.id}
          className="space-y-2 rounded-xl border border-border/50 bg-secondary/15 p-3.5 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">
              {sc.evaluator?.fullName ?? "Interviewer"}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <Star
                  key={val}
                  className={`size-3.5 ${val <= sc.overallRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
          {sc.recommendation && (
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/10 text-[10px] font-bold text-primary"
            >
              Đề xuất: {sc.recommendation}
            </Badge>
          )}
          {sc.strengths && (
            <p className="text-xs text-foreground">
              <strong className="mb-0.5 block text-green-600 dark:text-green-400">
                Điểm mạnh:
              </strong>{" "}
              {sc.strengths}
            </p>
          )}
          {sc.weaknesses && (
            <p className="text-xs text-foreground">
              <strong className="mb-0.5 block text-destructive">Điểm cần cải thiện:</strong>{" "}
              {sc.weaknesses}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Presentational card rendering details of a single scheduled interview round.
 */
function InterviewRoundCard({
  round,
  canManage,
  employees,
  onEditRound,
}: {
  round: InterviewRound
  canManage: boolean
  employees: Employee[]
  onEditRound: (round: InterviewRound) => void
}) {
  const assignedInterviewers =
    round.interviewers && round.interviewers.length > 0
      ? round.interviewers
      : ((round.interviewerIds || [])
          .map((empId) => employees.find((e) => e.id === empId))
          .filter(Boolean) as Array<{ id: string; fullName: string }>)

  const statusLabel =
    round.status === "completed"
      ? (RESULT_LABELS_MAP.get(round.result as string) ?? "Đã xong")
      : round.status === "scheduled"
        ? "Sắp diễn ra"
        : round.status === "cancelled"
          ? "Đã hủy"
          : "Chưa phỏng vấn"

  const statusVariant =
    round.result === "pass"
      ? "success"
      : round.result === "fail" || round.status === "cancelled" || round.status === "no_show"
        ? "danger"
        : "info"

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/10 text-xs font-bold text-primary"
            >
              Vòng {round.roundNumber}
            </Badge>
            <h4 className="text-base font-bold text-foreground">{round.title}</h4>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span>
                {round.scheduledAt
                  ? format(new Date(round.scheduledAt), "HH:mm, dd/MM/yyyy")
                  : "Chưa lên lịch"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {round.format === "video_call" ? (
                <Video className="size-3.5 text-blue-500" />
              ) : (
                <MapPin className="size-3.5 text-green-500" />
              )}
              <span>{FORMAT_LABELS_MAP.get(round.format) ?? round.format}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill label={statusLabel} variant={statusVariant} />
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onEditRound(round)
              }}
              className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-foreground shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xs"
              title="Chỉnh sửa thông tin vòng phỏng vấn"
            >
              <Pencil className="size-3 text-primary" />
              <span>Chỉnh sửa</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Người phỏng vấn:
          </span>
          <div className="flex items-center gap-2">
            {assignedInterviewers.length > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {assignedInterviewers.map((interviewer) => (
                    <div
                      key={interviewer.id}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-bold text-primary shadow-xs transition-transform hover:z-10 hover:scale-110"
                      title={interviewer.fullName}
                    >
                      {interviewer.fullName.charAt(0)}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground">
                  {assignedInterviewers.map((i) => i.fullName).join(", ")}
                </span>
              </>
            ) : (
              <span className="text-xs italic text-muted-foreground">Chưa phân công</span>
            )}
          </div>
        </div>
      </div>

      <InterviewScorecardList scorecards={round.scorecards} />
    </div>
  )
}

interface ApplicationInterviewsTabProps {
  interviews: InterviewRound[]
  isLoadingInterviews: boolean
  canManage: boolean
  employees: Employee[]
  onScheduleInterview: () => void
  onEditRound: (round: InterviewRound) => void
}

/**
 * Pure UI presentational tab presenting candidate interview rounds,
 * evaluator scorecards, feedback notes, and scheduling actions.
 */
export function ApplicationInterviewsTab({
  interviews,
  isLoadingInterviews,
  canManage,
  employees,
  onScheduleInterview,
  onEditRound,
}: ApplicationInterviewsTabProps) {
  return (
    <PageCard className="border border-border/60 p-6">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Các vòng phỏng vấn & Kết quả</h3>
          <p className="text-xs text-muted-foreground">
            Chi tiết thời gian, người phỏng vấn và đánh giá kết quả từng vòng
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={onScheduleInterview}
            className="h-8 rounded-full text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus className="mr-1.5 size-3.5" />
            Thêm vòng PV
          </Button>
        )}
      </div>

      {isLoadingInterviews ? (
        <span className="text-sm text-muted-foreground">Đang tải lịch phỏng vấn...</span>
      ) : interviews.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-border/50 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có vòng phỏng vấn nào được thiết lập.
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={onScheduleInterview}
              className="rounded-full text-xs"
            >
              <Plus className="mr-1 size-3.5" /> Thêm lịch phỏng vấn mới
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((round: InterviewRound) => (
            <InterviewRoundCard
              key={round.id}
              round={round}
              canManage={canManage}
              employees={employees}
              onEditRound={onEditRound}
            />
          ))}
        </div>
      )}
    </PageCard>
  )
}
