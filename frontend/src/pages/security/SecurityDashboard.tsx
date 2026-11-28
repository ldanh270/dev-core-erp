import { DashboardLayout } from "@/components/common"
import { SecurityDashboardActions } from "@/components/features/security/SecurityDashboardActions"
import {
  SecurityDashboardError,
  SecurityDashboardLoading,
} from "@/components/features/security/SecurityDashboardStates"
import { SecurityEventsSection } from "@/components/features/security/SecurityEventsSection"
import { SecurityStatsRow } from "@/components/features/security/SecurityStatsRow"
import { useSecurityDashboard } from "@/hooks/security/use-security-dashboard"

/**
 * SecurityDashboard page component.
 * Pure orchestrator monitoring authentication telemetry, account lockouts, and permission changes.
 */
export default function SecurityDashboard() {
  const {
    timeRange,
    setTimeRange,
    data,
    isLoading,
    isError,
    handleRefresh,
  } = useSecurityDashboard()

  if (isLoading) {
    return (
      <DashboardLayout
        title="Tổng quan bảo mật"
        description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
        statsSection={<SecurityDashboardLoading />}
      />
    )
  }

  if (isError || !data) {
    return (
      <DashboardLayout
        title="Tổng quan bảo mật"
        description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
        statsSection={<SecurityDashboardError onRetry={handleRefresh} />}
      />
    )
  }

  return (
    <DashboardLayout
      title="Tổng quan bảo mật"
      description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
      actions={
        <SecurityDashboardActions
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={handleRefresh}
        />
      }
      statsSection={
        <SecurityStatsRow
          timeRange={timeRange}
          lockedAccountsCount={data.lockedAccountsCount}
          failedLoginsToday={data.failedLoginsToday}
          successfulLoginsToday={data.successfulLoginsToday}
        />
      }
    >
      <SecurityEventsSection
        recentSecurityEvents={data.recentSecurityEvents}
        recentRoleEvents={data.recentRoleEvents}
      />
    </DashboardLayout>
  )
}
