/**
 * Compact admin roster card summarizing one employee's availability and assigned shifts.
 * All mutations are delegated to the parent view to keep the card presentation-only.
 */
import { StatusPill } from "@/components/common/status-pill"
import { WORK_WEEK_DISPLAY_DAY_ORDER } from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_ASSIGN_LABELS,
  getPartTimeAvailabilityStatusLabel,
  getPartTimeAvailabilityStatusVariant,
} from "@/config/entities/part-time-availability.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type {
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeEmployeeSuggestion,
} from "@/types/part-time-availability.types"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { formatAvailabilityDaySummary } from "@/utils/attendance/part-time-availability.util"

import { useMemo, useState } from "react"

import { ChevronRight } from "lucide-react"

import { AdminPartTimeAvailabilityAssignDrawer } from "./admin-part-time-availability-assign-drawer"

interface AdminPartTimeAvailabilityCardProps {
  availability: IPartTimeWeeklyAvailability
  weekStart: Date
  weekStartKey: string
  suggestion?: ISuggestPartTimeEmployeeSuggestion
}

const getAssignedDaySummary = (
  summaries: Partial<Record<number, string>> | undefined,
  dayOfWeek: number,
): string | undefined =>
  Object.entries(summaries ?? {}).find(([key]) => Number(key) === dayOfWeek)?.[1]

/** One employee row — status pill, day summary, score, opens assign drawer on click. */
export function AdminPartTimeAvailabilityCard({
  availability,
  weekStart,
  weekStartKey,
  suggestion,
}: AdminPartTimeAvailabilityCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const dayMap = useMemo(
    () => new Map(availability.days.map((day) => [day.dayOfWeek, day])),
    [availability.days],
  )
  const employeeName = availability.employee?.fullName ?? availability.employeeId
  const topReason = suggestion?.reasons[0]

  return (
    <>
      <div className="flex w-full items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-border/80">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <button
              type="button"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              // Name opens assign drawer — primary entry for per-day shift scheduling.
              onClick={() => {
                setDrawerOpen(true)
              }}
            >
              {employeeName}
            </button>
            <p className={TYPOGRAPHY.CELL_SECONDARY}>{availability.employee?.email}</p>
            {topReason ? (
              <p className={cn("mt-1", TYPOGRAPHY.CELL_SECONDARY)}>{topReason}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {/* One cell per weekday so admin scans the full week at a glance. */}
            {WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
              const weekDay = weekDates.find((entry) => entry.dayOfWeek === dayOfWeek)
              return (
                <div
                  key={dayOfWeek}
                  className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2"
                >
                  <p className="text-xs font-semibold text-foreground">{weekDay?.shortDate}</p>
                  <p className={cn("mt-0.5", TYPOGRAPHY.CELL_SECONDARY)}>
                    {availability.hasAssignedShifts
                      ? (getAssignedDaySummary(availability.assignedDaySummaries, dayOfWeek) ??
                        "Không làm")
                      : formatAvailabilityDaySummary(dayMap.get(dayOfWeek))}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill
            label={getPartTimeAvailabilityStatusLabel(availability.status)}
            variant={getPartTimeAvailabilityStatusVariant(availability.status)}
          />
          {suggestion ? (
            <p className="text-xs font-semibold text-primary">
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.SCORE_LABEL}: {suggestion.score}
            </p>
          ) : null}
          {availability.hasAssignedShifts ? (
            <p className="text-xs font-semibold text-primary">Đã xếp ca</p>
          ) : null}
          <button
            type="button"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              setDrawerOpen(true)
            }}
            aria-label={`Xếp ca cho ${employeeName}`}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <AdminPartTimeAvailabilityAssignDrawer
        availability={availability}
        weekStart={weekStart}
        weekStartKey={weekStartKey}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
        }}
        suggestion={suggestion}
      />
    </>
  )
}
