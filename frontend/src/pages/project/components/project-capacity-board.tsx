/**
 * Weekly capacity board for Admin/PM.
 * It displays cron/event-refreshed project forecasts so managers can compare shortage/surplus projects.
 */
import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CAPACITY_CONFIDENCE_LEVEL,
  CAPACITY_COPILOT_RULES,
  type CapacityConfidenceLevel,
} from "@/config/rules/capacity-copilot.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { usePermission } from "@/hooks/use-permission"
import { capacityCopilotApi } from "@/lib/api/capacity-copilot.api"
import { cn } from "@/lib/utils"
import type {
  CapacityBoardProjectSnapshot,
  CapacityForecastResult,
} from "@/types/capacity-copilot.types"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Info,
  RefreshCw,
} from "lucide-react"

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const PERCENT_WARNING_THRESHOLD = 0

const padDatePart = (value: number) => value.toString().padStart(2, "0")

const formatDateParam = (date: Date) => {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

const parseLocalDateParam = (dateParam: string) => {
  // Avoid `new Date("yyyy-mm-dd")` UTC parsing because it can shift the displayed week in local time.
  const [year = "0", month = "1", day = "1"] = dateParam.split("-")
  return new Date(Number(year), Number(month) - 1, Number(day))
}

const getCurrentWeekStart = () => {
  const date = new Date()
  const day = date.getDay()
  const distanceFromMonday = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - distanceFromMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

const getWeekStartDateKey = (date: Date) => {
  return formatDateParam(date)
}

const getWeekRangeLabel = (weekStart: string) => {
  const start = parseLocalDateParam(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + CAPACITY_COPILOT_RULES.DAYS_PER_WEEK - 1)
  return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`
}

const sortByGapDescending = (
  left: CapacityBoardProjectSnapshot,
  right: CapacityBoardProjectSnapshot,
) => {
  return (
    (right.forecast?.percentGap ?? Number.NEGATIVE_INFINITY) -
    (left.forecast?.percentGap ?? Number.NEGATIVE_INFINITY)
  )
}

const getConfidenceLabel = (confidenceLevel: CapacityConfidenceLevel) => {
  if (confidenceLevel === CAPACITY_CONFIDENCE_LEVEL.HIGH) return "Độ tin cậy cao"
  if (confidenceLevel === CAPACITY_CONFIDENCE_LEVEL.MEDIUM) return "Độ tin cậy vừa"
  return "Độ tin cậy thấp"
}

const getWeakestRoleName = (forecast: CapacityForecastResult) => {
  const weakestRole = forecast.roles.reduce(
    (current, role) => (role.effectiveHours < current.effectiveHours ? role : current),
    forecast.roles[0],
  )
  return weakestRole?.roleName ?? "Chưa có role"
}

const ForecastRow = ({ item }: { item: CapacityBoardProjectSnapshot }) => {
  const { forecast, projectName, errorMessage } = item

  if (!forecast) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <div className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold text-foreground")}>
          {projectName}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
      </div>
    )
  }

  const isShortage = forecast.percentGap > PERCENT_WARNING_THRESHOLD
  const strongestRole = forecast.roles.reduce(
    (current, role) => (role.effectiveHours > current.effectiveHours ? role : current),
    forecast.roles[0],
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-border/90 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold text-foreground")}>
            {projectName}
          </div>
          <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1")}>
            Target {forecast.targetPercent}% · Predicted {forecast.predictedPercent}% · Gap{" "}
            {forecast.percentGap}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground font-medium">
            {getConfidenceLabel(forecast.confidenceLevel)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isShortage
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary",
          )}
        >
          {isShortage ? "Thiếu capacity" : "Đủ / dư capacity"}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-2.5">
          <span className="block font-semibold text-foreground text-sm">
            {forecast.totalEffectiveHours}h
          </span>
          Effective hours
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5">
          <span className="block font-semibold text-foreground text-sm">
            {forecast.neededEffectiveHours}h
          </span>
          Cần thêm
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5">
          <span
            className="block font-semibold text-foreground text-sm truncate"
            title={
              isShortage
                ? getWeakestRoleName(forecast)
                : (strongestRole?.roleName ?? "Chưa có role")
            }
          >
            {isShortage
              ? getWeakestRoleName(forecast)
              : (strongestRole?.roleName ?? "Chưa có role")}
          </span>
          {isShortage ? "Role nên bổ sung" : "Role đang dư"}
        </div>
      </div>
      {forecast.confidenceReasons.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{forecast.confidenceReasons[0]}</span>
        </div>
      )}
    </div>
  )
}

export function ProjectCapacityBoard() {
  const { hasPermission } = usePermission()
  const [weekStart, setWeekStart] = useState(getWeekStartDateKey(getCurrentWeekStart()))
  const canForecast = hasPermission("project.update")

  const forecastQuery = useQuery({
    queryKey: ["capacity-copilot", "weekly-board", weekStart],
    // Board reads one backend aggregate endpoint instead of making PM click/forecast every project.
    queryFn: () =>
      capacityCopilotApi.forecastWeeklyBoard({
        weekStart,
        lookbackWeeks: CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
      }),
    enabled: canForecast,
  })

  const forecastItems = forecastQuery.data?.projects ?? []
  const shortageItems = forecastItems
    .filter((item) => item.forecast && item.forecast.percentGap > PERCENT_WARNING_THRESHOLD)
    .sort(sortByGapDescending)
  const surplusItems = forecastItems
    .filter((item) => item.forecast && item.forecast.percentGap <= PERCENT_WARNING_THRESHOLD)
    .sort(sortByGapDescending)
  const failedItems = forecastItems.filter((item) => !item.forecast)
  const selectedWeekDate = parseLocalDateParam(weekStart)
  const nextWeekStart = new Date(
    selectedWeekDate.getTime() + CAPACITY_COPILOT_RULES.DAYS_PER_WEEK * MILLISECONDS_PER_DAY,
  )
  const previousWeekStart = new Date(
    selectedWeekDate.getTime() - CAPACITY_COPILOT_RULES.DAYS_PER_WEEK * MILLISECONDS_PER_DAY,
  )

  if (!canForecast) return null

  return (
    <PageCard className="p-6 flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between shrink-0">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <BrainCircuit className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Project Capacity Board</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Cronjob chạy ngầm mỗi tuần để refresh dự báo. Màn hình tải kết quả forecast mới nhất
              để Admin/PM thấy project thiếu hoặc dư capacity.
            </p>
            {forecastQuery.data?.generatedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Cập nhật gần nhất:{" "}
                {new Date(forecastQuery.data.generatedAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full font-semibold"
            onClick={() => {
              setWeekStart(getWeekStartDateKey(previousWeekStart))
            }}
          >
            Tuần trước
          </Button>
          <div className="flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-xs">
            <CalendarDays className="mr-2 inline size-4 text-muted-foreground" />
            {getWeekRangeLabel(weekStart)}
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full font-semibold"
            onClick={() => {
              setWeekStart(getWeekStartDateKey(nextWeekStart))
            }}
          >
            Tuần sau
          </Button>
          <Button
            type="button"
            className="rounded-full font-semibold"
            disabled={forecastQuery.isFetching}
            onClick={() => {
              void forecastQuery.refetch()
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Tải lại kết quả
          </Button>
        </div>
      </div>

      {forecastQuery.isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0">
          <Skeleton className="h-full min-h-[240px] rounded-xl" />
          <Skeleton className="h-full min-h-[240px] rounded-xl" />
        </div>
      ) : forecastItems.length === 0 ? (
        <div className="mt-5 flex-1 min-h-[240px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
          <div className="rounded-full bg-secondary p-3 mb-3 text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Chưa có dữ liệu dự báo</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Chưa có project nào nhập cam kết tuần/milestone (Deal target %) nên chưa thể forecast.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2 flex-1 min-h-0">
          {/* Shortage projects */}
          <div className="rounded-xl border border-border bg-muted/20 p-5 flex flex-col min-w-0 h-full overflow-hidden">
            <div className="mb-4 flex items-center gap-2 font-semibold text-sm text-destructive shrink-0">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Project thiếu capacity ({shortageItems.length})</span>
            </div>
            <div className="space-y-3 flex-1 min-w-0 overflow-y-auto pr-1">
              {shortageItems.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/60 p-8 text-center">
                  <div className="rounded-full bg-secondary p-2.5 mb-2 text-muted-foreground">
                    <Inbox className="size-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Không có project thiếu capacity trong tuần này.
                  </p>
                </div>
              ) : (
                shortageItems.map((item) => <ForecastRow key={item.projectId} item={item} />)
              )}
            </div>
          </div>

          {/* Surplus projects */}
          <div className="rounded-xl border border-border bg-muted/20 p-5 flex flex-col min-w-0 h-full overflow-hidden">
            <div className="mb-4 flex items-center gap-2 font-semibold text-sm text-primary shrink-0">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Project đủ hoặc dư capacity ({surplusItems.length})</span>
            </div>
            <div className="space-y-3 flex-1 min-w-0 overflow-y-auto pr-1">
              {surplusItems.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/60 p-8 text-center">
                  <div className="rounded-full bg-secondary p-2.5 mb-2 text-muted-foreground">
                    <Inbox className="size-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chưa có project dư capacity để điều phối.
                  </p>
                </div>
              ) : (
                surplusItems.map((item) => <ForecastRow key={item.projectId} item={item} />)
              )}
            </div>
          </div>
        </div>
      )}

      {failedItems.length > 0 && (
        <div className="mt-3 shrink-0 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {failedItems.length} project chưa forecast được do thiếu dữ liệu hoặc lỗi API.
        </div>
      )}
    </PageCard>
  )
}
