import { DashboardLayout } from "@/components/common"
import { CandidatePipelineCard } from "@/components/features/recruitment/dashboard/CandidatePipelineCard"
import { RecruitmentQuickLinks } from "@/components/features/recruitment/dashboard/RecruitmentQuickLinks"
import { RecruitmentStatsGrid } from "@/components/features/recruitment/dashboard/RecruitmentStatsGrid"
import { UpcomingInterviewsCard } from "@/components/features/recruitment/dashboard/UpcomingInterviewsCard"
import { useRecruitmentDashboard } from "@/hooks/recruitment/use-recruitment-dashboard"

/**
 * Standardized Recruitment Dashboard.
 * Decoupled thin composition shell powered by DashboardLayout and useRecruitmentDashboard presenter hook.
 */
export default function RecruitmentDashboard() {
  const {
    reqStats,
    appStats,
    upcomingInterviews,
    offerStats,
    bgcStats,
    isLoading,
    isLoadingInterviews,
    totalApps,
  } = useRecruitmentDashboard()

  return (
    <DashboardLayout
      title="Dashboard Tuyển dụng"
      description="Tổng quan quy trình tuyển dụng và các chỉ số quan trọng"
      statsSection={
        <RecruitmentStatsGrid
          isLoading={isLoading}
          reqStats={reqStats}
          appStats={appStats}
          offerStats={offerStats}
          bgcStats={bgcStats}
        />
      }
      chartsSection={
        <div className="grid gap-4 lg:grid-cols-2">
          <UpcomingInterviewsCard
            interviews={upcomingInterviews}
            isLoading={isLoadingInterviews}
          />
          <CandidatePipelineCard appStats={appStats} totalApps={totalApps} />
        </div>
      }
    >
      <RecruitmentQuickLinks pendingReqCount={reqStats?.pending ?? 0} />
    </DashboardLayout>
  )
}
