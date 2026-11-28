import {
  useApplicationStats,
  useBackgroundCheckStats,
  useOfferStats,
  useRequisitionStats,
  useUpcomingInterviews,
} from "@/hooks/recruitment/use-recruitment-queries"

/**
 * Custom hook to aggregate all recruitment dashboard queries.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useRecruitmentDashboard() {
  const { data: reqStats, isLoading: isLoadingReqStats } = useRequisitionStats()
  const { data: appStats, isLoading: isLoadingAppStats } = useApplicationStats()
  const { data: upcomingInterviews, isLoading: isLoadingInterviews } = useUpcomingInterviews(7)
  const { data: offerStats, isLoading: isLoadingOfferStats } = useOfferStats()
  const { data: bgcStats, isLoading: isLoadingBgcStats } = useBackgroundCheckStats()

  const isLoading =
    isLoadingReqStats ||
    isLoadingAppStats ||
    isLoadingInterviews ||
    isLoadingOfferStats ||
    isLoadingBgcStats

  const totalApps = appStats?.total || 1

  return {
    reqStats,
    appStats,
    upcomingInterviews,
    offerStats,
    bgcStats,
    isLoading,
    isLoadingInterviews,
    totalApps,
  }
}
