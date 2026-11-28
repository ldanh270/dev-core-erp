import { CandidatePipelineCard } from "@/components/features/recruitment/dashboard/CandidatePipelineCard"
import { UpcomingInterviewsCard } from "@/components/features/recruitment/dashboard/UpcomingInterviewsCard"
import type { InterviewRound } from "@/types/recruitment.types"

export interface RecruitmentChartsSectionProps {
  upcomingInterviews?: InterviewRound[]
  isLoadingInterviews: boolean
  appStats?: {
    byStatus?: {
      applied?: number
      interviewing?: number
      offer_sent?: number
      hired?: number
    }
  }
  totalApps: number
}

/**
 * Presenter container rendering upcoming interview schedule and candidate pipeline conversion cards.
 */
export function RecruitmentChartsSection({
  upcomingInterviews,
  isLoadingInterviews,
  appStats,
  totalApps,
}: RecruitmentChartsSectionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UpcomingInterviewsCard interviews={upcomingInterviews} isLoading={isLoadingInterviews} />
      <CandidatePipelineCard appStats={appStats} totalApps={totalApps} />
    </div>
  )
}
