import { PageCard } from "@/components/common"
import type {
  JobPosting,
  RecruitmentApplication,
  RecruitmentPipelineStage,
} from "@/types/recruitment.types"

import type { ReactNode } from "react"

import { FileSpreadsheet, RefreshCw, Users } from "lucide-react"

export interface JobPostingOverview {
  posting: JobPosting
  applicationTotal: number
  stageGroups: Array<{ pipelineStageId: string | null; _count: { _all: number } }>
}

interface JobPostingOverviewTabProps {
  posting: JobPosting
  overview?: JobPostingOverview
  stages: RecruitmentPipelineStage[]
  candidates: RecruitmentApplication[]
}

/**
 * Pure UI presentational tab summarizing job posting statistics,
 * sync dates, channel metadata, and pipeline stage counts.
 */
export function JobPostingOverviewTab({
  posting,
  overview,
  stages,
  candidates,
}: JobPostingOverviewTabProps) {
  const applicationTotal = overview?.applicationTotal ?? candidates.length
  const syncDateLabel = posting.lastSyncedAt
    ? new Date(posting.lastSyncedAt).toLocaleDateString("vi-VN")
    : "Chưa có"

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Users className="size-5" />}
          label="Ứng viên"
          value={applicationTotal}
        />
        <MetricCard
          icon={<FileSpreadsheet className="size-5" />}
          label="Giai đoạn pipeline"
          value={stages.length}
        />
        <MetricCard
          icon={<RefreshCw className="size-5" />}
          label="Lần đồng bộ"
          value={syncDateLabel}
        />
      </div>

      <PageCard>
        <h2 className="mb-4 font-semibold text-foreground">Tiến độ tuyển dụng</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stages.map((stage) => {
            const stageCount =
              overview?.stageGroups.find((group) => group.pipelineStageId === stage.id)?._count
                ._all ??
              candidates.filter((application) => application.pipelineStage?.id === stage.id).length

            return (
              <div key={stage.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color || "currentColor" }}
                  />
                  <span className="truncate text-xs font-semibold text-foreground">
                    {stage.name}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{stageCount}</p>
              </div>
            )
          })}
        </div>
      </PageCard>
    </div>
  )
}

/**
 * Presentational metric tile displaying an icon badge alongside key statistics.
 */
function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <PageCard className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </PageCard>
  )
}
