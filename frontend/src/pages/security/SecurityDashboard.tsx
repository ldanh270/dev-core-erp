import { DashboardLayout } from "@/components/common"
import { SecurityEventsSection } from "@/components/features/security/SecurityEventsSection"
import { SecurityStatsRow } from "@/components/features/security/SecurityStatsRow"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSecuritySummary } from "@/hooks/security/queries/use-security-query"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useState } from "react"

/**
 * SecurityDashboard page component.
 * Pure orchestrator monitoring authentication telemetry, account lockouts, and permission changes.
 */
export default function SecurityDashboard() {
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days">("today")
  const { data, isLoading, isError, refetch } = useSecuritySummary(timeRange)

  if (isLoading) {
    return (
      <DashboardLayout
        title="Tổng quan bảo mật"
        description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
        statsSection={
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu bảo mật...</p>
          </div>
        }
      />
    )
  }

  if (isError || !data) {
    return (
      <DashboardLayout
        title="Tổng quan bảo mật"
        description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
        statsSection={
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Không thể tải thông tin bảo mật. Vui lòng thử lại sau.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                void refetch()
              }}
            >
              Thử lại
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <DashboardLayout
      title="Tổng quan bảo mật"
      description="Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng."
      actions={
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onValueChange={(val: "today" | "7days" | "30days") => {
              setTimeRange(val)
            }}
          >
            <SelectTrigger className="w-[160px] h-10 rounded-full text-sm font-medium">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="today" className="text-sm">
                Hôm nay
              </SelectItem>
              <SelectItem value="7days" className="text-sm">
                7 ngày qua
              </SelectItem>
              <SelectItem value="30days" className="text-sm">
                30 ngày qua
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-full text-sm font-medium"
            onClick={() => {
              void refetch()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
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
