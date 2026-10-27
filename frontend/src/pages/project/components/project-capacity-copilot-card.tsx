/**
 * Per-project forecast card driven by the immutable deal target and a selected Monday week.
 * Historical weeks support backtesting; current/future weeks support staffing decisions.
 */
import { DatePicker, PageCard } from "@/components/common"
import {
  CAPACITY_CONFIDENCE_LEVEL,
  CAPACITY_COPILOT_RULES,
  CAPACITY_RISK_LEVEL,
  CAPACITY_WEEK_MODE,
  type CapacityConfidenceLevel,
  type CapacityWeekMode,
} from "@/config/rules/capacity-copilot.config"
import { usePermission } from "@/hooks/use-permission"
import { capacityCopilotApi } from "@/lib/api/capacity-copilot.api"
import type { ProjectMember } from "@/types/project.types"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Brain, CheckCircle2, RefreshCw } from "lucide-react"

interface ProjectCapacityCopilotCardProps {
  projectId: string
  members: ProjectMember[]
  dealTargetPercent: number | null
}

const getCurrentWeekStart = (): string => {
  const date = new Date()
  return getWeekStartDateKey(date)
}

const getNextWeekStart = (): string => {
  const currentWeekStart = new Date(`${getCurrentWeekStart()}T00:00:00`)
  currentWeekStart.setDate(currentWeekStart.getDate() + CAPACITY_COPILOT_RULES.DAYS_PER_WEEK)
  return formatDateParam(currentWeekStart)
}

const getWeekStartDateKey = (value: Date): string => {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -CAPACITY_COPILOT_RULES.DAYS_PER_WEEK + 1 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return formatDateParam(date)
}

const formatDisplayDate = (value: Date): string =>
  formatDateParam(value).split("-").reverse().join("/")

const getForecastWeekLabel = (weekStart: string): string => {
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + CAPACITY_COPILOT_RULES.DAYS_PER_WEEK - 1)
  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`
}

const getConfidenceLabel = (confidenceLevel: CapacityConfidenceLevel): string => {
  if (confidenceLevel === CAPACITY_CONFIDENCE_LEVEL.HIGH) return "Cao"
  if (confidenceLevel === CAPACITY_CONFIDENCE_LEVEL.MEDIUM) return "Vừa"
  return "Thấp"
}

const getWeekMode = (weekStart: string): CapacityWeekMode => {
  const currentWeekStart = getCurrentWeekStart()
  if (weekStart < currentWeekStart) return CAPACITY_WEEK_MODE.HISTORY
  if (weekStart === currentWeekStart) return CAPACITY_WEEK_MODE.CURRENT
  return CAPACITY_WEEK_MODE.FORECAST
}

export function ProjectCapacityCopilotCard({
  projectId,
  members,
  dealTargetPercent,
}: ProjectCapacityCopilotCardProps) {
  const { hasPermission } = usePermission()
  const canForecastCapacity = hasPermission("project.update")
  const hasDealTargetPercent = dealTargetPercent != null

  const roleOptions = useMemo(() => {
    const roleByCode = new Map<string, string>()
    for (const member of members) {
      const code = member.role?.code || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_CODE
      const name = member.role?.name || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_NAME
      roleByCode.set(code, name)
    }
    return Array.from(roleByCode.entries()).map(([roleCode, roleName]) => ({ roleCode, roleName }))
  }, [members])

  const [weekStart, setWeekStart] = useState(getNextWeekStart)
  const forecastWeekLabel = useMemo(() => getForecastWeekLabel(weekStart), [weekStart])
  const weekMode = useMemo(() => getWeekMode(weekStart), [weekStart])
  const weekModeTitle =
    weekMode === CAPACITY_WEEK_MODE.HISTORY
      ? "Tuần đối chiếu (Backtest week)"
      : weekMode === CAPACITY_WEEK_MODE.CURRENT
        ? "Tuần hiện tại (Current week)"
        : "Tuần dự đoán (Forecast week)"
  const weekModeDescription =
    weekMode === CAPACITY_WEEK_MODE.HISTORY
      ? "Đang xem tuần cũ để đối chiếu dữ liệu lịch sử, không dùng để deal tuần tới."
      : weekMode === CAPACITY_WEEK_MODE.CURRENT
        ? "Đang xem tuần hiện tại để theo dõi rủi ro capacity đang diễn ra."
        : "Đang dự đoán tuần kế tiếp/tương lai để Admin/PM deal timeline với khách hàng."

  const forecastQuery = useQuery({
    queryKey: ["capacity-copilot", "project", projectId, weekStart],
    // Query runs on mount/week change so the detail tab behaves like a read-only forecast screen.
    queryFn: () =>
      capacityCopilotApi.forecastProject(projectId, {
        weekStart,
        lookbackWeeks: CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
      }),
    enabled: canForecastCapacity && roleOptions.length > 0 && hasDealTargetPercent,
  })

  const forecast = forecastQuery.data ?? null

  const riskIcon =
    forecast?.riskLevel === CAPACITY_RISK_LEVEL.LOW ? (
      <CheckCircle2 className="size-4 text-primary" />
    ) : (
      <AlertTriangle className="size-4 text-destructive" />
    )

  if (!canForecastCapacity) {
    return null
  }

  return (
    <PageCard className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Brain className="size-4 text-primary" />
              Part-time Capacity Copilot
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dự đoán % hoàn thành tuần được chọn từ lịch sử delivery, lịch rảnh (availability),
              hiệu suất (velocity) và giờ đã log (spent time).
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {weekModeTitle}
            </span>
            <DatePicker
              value={weekStart}
              onChange={(val) => {
                if (val) setWeekStart(getWeekStartDateKey(new Date(`${val}T00:00:00`)))
              }}
              size="sm"
              triggerClassName="w-40"
            />
            <span className="text-xs font-medium text-muted-foreground">{forecastWeekLabel}</span>
            <span className="max-w-64 text-right text-[10px] text-muted-foreground">
              {weekModeDescription}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 bg-muted/20 max-w-sm text-xs text-muted-foreground">
          {/* Target stays on project deal so Admin cannot silently alter forecast assumptions at runtime. */}
          Mục tiêu tuần được chọn (Target milestone %) được lấy từ deal khi tạo/chỉnh sửa dự án.
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-2">
            <RefreshCw className={`size-4 text-primary ${forecastQuery.isFetching ? "animate-spin" : ""}`} />
            Cronjob chạy ngầm hằng tuần; màn hình tự tải dự báo mới nhất
          </span>
          {!hasDealTargetPercent && (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              Project chưa có target % trong deal. Hãy bấm Chỉnh sửa dự án để nhập target trước khi dự báo.
            </span>
          )}
          {hasDealTargetPercent && forecastQuery.error && (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              {extractErrorMessage(forecastQuery.error)}
            </span>
          )}
        </div>

        {!hasDealTargetPercent ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            {/* Deal target is mandatory because forecast compares predicted delivery against a client commitment. */}
            Capacity Copilot cần cam kết tuần/milestone từ deal để biết nên so sánh dự báo với mức nào.
          </div>
        ) : forecastQuery.isLoading ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            Đang tự động dự đoán capacity...
          </div>
        ) : forecast && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">Cam kết (Target)</span>
                <div className="text-lg font-black">{forecast.targetPercent}%</div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">Dự đoán (Predicted)</span>
                <div className="text-lg font-black">{forecast.predictedPercent}%</div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {riskIcon}
                  Chênh lệch (Gap)
                </span>
                <div className="text-lg font-black">{forecast.percentGap}%</div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">Độ tin cậy (Confidence)</span>
                <div className="text-lg font-black">{getConfidenceLabel(forecast.confidenceLevel)}</div>
              </div>
            </div>

            {forecast.confidenceReasons.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {forecast.confidenceReasons.join(" ")}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">
                  Capacity tuần được chọn (Selected week)
                </span>
                <div className="text-base font-black">
                  {forecast.totalEffectiveHours} effective hours
                </div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">Năng suất lịch sử (Productivity)</span>
                <div className="text-base font-black">{forecast.productivityRate}% / hour</div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">Cần thêm (Needed)</span>
                <div className="text-base font-black">
                  {forecast.productivityRate > 0
                    ? `${forecast.neededEffectiveHours} effective hours`
                    : "Chưa đủ dữ liệu"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              {forecast.roles.map((role) => (
                <div
                  key={role.roleCode}
                  className="grid grid-cols-2 gap-2 px-3 py-2 border-b border-border last:border-b-0 text-xs"
                >
                  <span className="font-semibold text-foreground">{role.roleName}</span>
                  <span>Dự đoán năng lực (Role forecast) {role.effectiveHours}h</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {forecast.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="rounded-lg bg-muted/20 border border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  {recommendation}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageCard>
  )
}
