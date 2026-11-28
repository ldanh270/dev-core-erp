import { DashboardLayout } from "@/components/common"
import { RecruitmentChartsSection } from "@/components/features/recruitment/dashboard/RecruitmentChartsSection"
import { RecruitmentQuickLinks } from "@/components/features/recruitment/dashboard/RecruitmentQuickLinks"
import { RecruitmentStatsGrid } from "@/components/features/recruitment/dashboard/RecruitmentStatsGrid"
import { useRecruitmentDashboard } from "@/hooks/recruitment/use-recruitment-dashboard"

/**
 * Tier 2 Page Orchestrator for the Recruitment Dashboard.
 * Declaratively composes high-level metrics, upcoming interview schedules, pipeline charts, and quick shortcuts.
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
        <RecruitmentChartsSection
          upcomingInterviews={upcomingInterviews}
          isLoadingInterviews={isLoadingInterviews}
          appStats={appStats}
          totalApps={totalApps}
        />
      }
    >
      <RecruitmentQuickLinks pendingReqCount={reqStats?.pending ?? 0} />
    </DashboardLayout>
  )
}
