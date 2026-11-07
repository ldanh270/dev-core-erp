/**
 * Admin weekly roster screen for reviewing availability and opening assignment workflows.
 * The selected week is the shared query key for cards, suggestions, and assignment details.
 */
import { EmptyState, PageCard } from "@/components/common"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { AdminPartTimeAvailabilityCard } from "@/components/features/attendance/part-time-availability/admin-part-time-availability-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES } from "@/config/entities/part-time-availability.config"
import { usePartTimeAvailabilityList } from "@/hooks/attendance/use-part-time-availability"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { getEarliestRequestableWeekStart } from "@/utils/attendance/part-time-availability.util"

import { useMemo, useState } from "react"

import { ChevronLeft, ChevronRight, Users } from "lucide-react"

const DAYS_PER_WEEK = 7

/** Admin page — week navigation, assignable-availability count, manual assignment card list. */
export function AdminPartTimeAvailabilityView() {
  // Shift assignment starts from the upcoming week, not historical weeks.
  const earliestWeekStart = useMemo(() => getEarliestRequestableWeekStart(), [])
  const earliestWeekStartKey = formatDateParam(earliestWeekStart)

  const [weekStart, setWeekStart] = useState(() => getEarliestRequestableWeekStart())
  const weekStartKey = formatDateParam(weekStart)
  // Block "Tuần trước" before earliest assignable week (same rule as employee submit).
  const canGoToPreviousWeek = weekStart.getTime() > earliestWeekStart.getTime()
  const weekDays = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(weekDays), [weekDays])
  const { data: items = [], isLoading } = usePartTimeAvailabilityList(weekStartKey)

  // Only submitted/approved rows are actionable for shift assignment.
  const assignableItems = useMemo(
    () => items.filter((item) => PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES.includes(item.status)),
    [items],
  )

  const handleWeekStartChange = (nextWeekStart: Date) => {
    setWeekStart(getWeekStart(nextWeekStart))
  }

  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * DAYS_PER_WEEK)
    handleWeekStartChange(next)
  }

  return (
    <PageCard
      padding="none"
      className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 shrink-0">
        <h3 className="text-sm font-bold text-foreground">Xếp ca theo lịch rảnh</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            disabled={!canGoToPreviousWeek}
            onClick={() => {
              shiftWeek(-1)
            }}
            aria-label="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <WeekPickerActions
            weekStartIso={weekStartKey}
            weekRangeLabel={weekRangeLabel}
            minWeekStartIso={earliestWeekStartKey}
            defaultWeekStart={earliestWeekStart}
            defaultWeekLabel="Tuần kế tiếp"
            onWeekStartChange={handleWeekStartChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full size-10 shrink-0"
            onClick={() => {
              shiftWeek(1)
            }}
            aria-label="Tuần sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Roster overview banner */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
          <Users className="size-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">
            {isLoading
              ? "Đang tải..."
              : `${assignableItems.length} nhân viên đã gửi lịch rảnh tuần này`}
          </span>
        </div>
      </div>

      {/* Roster content or centered empty state */}
      {isLoading ? (
        <div className="flex-1 min-h-0 p-4 space-y-4 overflow-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : assignableItems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            title="Chưa có lịch rảnh trong tuần này"
            description="Chưa có nhân viên bán thời gian nào gửi lịch rảnh cho tuần đã chọn."
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.3)_transparent]">
          {assignableItems.map((availability) => (
            <AdminPartTimeAvailabilityCard
              key={availability.id}
              availability={availability}
              weekStart={weekStart}
              weekStartKey={weekStartKey}
            />
          ))}
        </div>
      )}
    </PageCard>
  )
}
