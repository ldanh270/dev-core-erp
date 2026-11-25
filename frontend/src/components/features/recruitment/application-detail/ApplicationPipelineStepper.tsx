import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { APPLICATION_STATUS_LABELS } from "@/config/entities/recruitment.config"
import type {
  InterviewRound,
  RecruitmentApplication,
  RecruitmentPipelineStage,
} from "@/types/recruitment.types"

import { format } from "date-fns"
import { CheckCircle2, Star } from "lucide-react"

interface PipelineStageItem {
  id: string
  name: string
  isCompleted?: boolean
}

const FALLBACK_STAGES: PipelineStageItem[] = [
  { id: "new", name: "Nộp CV" },
  { id: "reviewing", name: "Sàng lọc hồ sơ" },
  { id: "interviewing", name: "Phỏng vấn" },
  { id: "offer_sent", name: "Gửi Offer" },
  { id: "hired", name: "Đã tuyển dụng" },
]

interface ApplicationPipelineStepperProps {
  application: RecruitmentApplication
  dynamicStages: RecruitmentPipelineStage[]
  interviews: InterviewRound[]
}

/**
 * Pure UI presentational stepper visualizing applicant progression
 * across pipeline stages with progress indicators and interview badges.
 */
export function ApplicationPipelineStepper({
  application,
  dynamicStages,
  interviews,
}: ApplicationPipelineStepperProps) {
  const stagesList: PipelineStageItem[] =
    dynamicStages.length > 0 ? dynamicStages : FALLBACK_STAGES

  const currentStageId =
    (application as { pipelineStageId?: string }).pipelineStageId ||
    application.pipelineStage?.id
  const currentStageIndex = stagesList.findIndex(
    (s: PipelineStageItem) =>
      s.id === currentStageId || s.name === application.pipelineStage?.name,
  )
  const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0

  const currentStatusLabel =
    application.pipelineStage?.name ??
    APPLICATION_STATUS_LABELS[application.status] ??
    application.status

  return (
    <PageCard className="border border-border/60 p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tiến trình trạng thái hồ sơ ({stagesList.length} giai đoạn)
          </span>
        </div>
        <Badge
          variant="outline"
          className="rounded-full border-primary/20 bg-primary/10 text-xs font-bold text-primary"
        >
          Trạng thái hiện tại: {currentStatusLabel}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {stagesList.map((stg: PipelineStageItem, idx: number) => {
          const isCurrent = idx === activeIdx
          const isPast = idx < activeIdx || application.status === "hired"

          const linkedRound = interviews.find(
            (r) =>
              r.title.toLowerCase().includes(stg.name.toLowerCase()) ||
              stg.name.toLowerCase().includes(r.title.toLowerCase()) ||
              (stg.name.toLowerCase().includes("phỏng vấn") && r.roundNumber === idx - 1),
          )

          return (
            <div key={stg.id || idx} className="flex min-w-[140px] flex-1 items-center gap-2">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isPast
                    ? "bg-emerald-500 text-white shadow-xs"
                    : isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? <CheckCircle2 className="size-4" /> : idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-xs font-semibold ${isCurrent ? "font-bold text-primary" : "text-foreground"}`}
                >
                  {stg.name}
                </p>

                {linkedRound ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    {linkedRound.result === "pass" ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-bold text-emerald-600"
                      >
                        ✓ Đạt vòng PV
                      </Badge>
                    ) : linkedRound.result === "fail" ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-destructive/30 bg-destructive/10 px-1.5 py-0 text-[9px] font-bold text-destructive"
                      >
                        ✗ Loại
                      </Badge>
                    ) : linkedRound.scorecards && linkedRound.scorecards.length > 0 ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-0.5 rounded-full border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] font-bold text-amber-600"
                      >
                        <Star className="size-2.5 fill-amber-500 text-amber-500" />
                        {linkedRound.scorecards.length} đánh giá
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {linkedRound.scheduledAt
                          ? format(new Date(linkedRound.scheduledAt), "dd/MM")
                          : "Chờ PV"}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {isPast ? "Đã hoàn thành" : isCurrent ? "Đang ở giai đoạn này" : "Chờ xử lý"}
                  </p>
                )}
              </div>
              {idx < stagesList.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full ${isPast ? "bg-emerald-500" : "bg-muted/60"}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </PageCard>
  )
}
