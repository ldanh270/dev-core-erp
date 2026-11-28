import { useSecuritySummary } from "@/hooks/security/queries/use-security-query"
import { useState } from "react"
import type { SecurityTimeRange } from "@/components/features/security/SecurityDashboardActions"

/**
 * Custom hook orchestrating security dashboard metrics, selected time range, and query refetch.
 */
export function useSecurityDashboard() {
  const [timeRange, setTimeRange] = useState<SecurityTimeRange>("today")
  const { data, isLoading, isError, refetch } = useSecuritySummary(timeRange)

  const handleRefresh = () => {
    void refetch()
  }

  return {
    timeRange,
    setTimeRange,
    data,
    isLoading,
    isError,
    handleRefresh,
  }
}
