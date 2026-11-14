/**
 * Assignment orchestrator that switches between loading, validation, suggestion, and edit states.
 * Suggestions remain advisory until an admin explicitly saves the assignment form.
 */
import type {
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeEmployeeSuggestion,
} from "@/types/part-time-availability.types"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { isPartTimeAvailabilityAssignable } from "@/utils/attendance/part-time-availability.util"

import { useMemo } from "react"

import { AdminPartTimeAvailabilityAssignPanelForm } from "./admin-part-time-availability-assign-panel-form"

interface AdminPartTimeAvailabilityAssignPanelProps {
  availability: IPartTimeWeeklyAvailability
  weekStart: Date
  weekStartKey: string
  onAssigned?: () => void
  suggestion?: ISuggestPartTimeEmployeeSuggestion
}

/** Admin shell: employee header + assign form keyed by availability id. */
export function AdminPartTimeAvailabilityAssignPanel({
  availability,
  weekStart,
  weekStartKey,
  onAssigned,
  suggestion,
}: AdminPartTimeAvailabilityAssignPanelProps) {
  const weekDates = getWeekDates(weekStart)
  const canAssign = isPartTimeAvailabilityAssignable(availability.status)

  const dayMap = useMemo(
    () => new Map(availability.days.map((day) => [day.dayOfWeek, day])),
    [availability.days],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-6 pb-5 pt-14 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
          {(availability.employee?.fullName ?? availability.employeeId).substring(0, 2)}
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-lg font-bold text-foreground">
            {availability.employee?.fullName ?? availability.employeeId}
          </p>
          <p className="text-sm text-muted-foreground">{availability.employee?.email}</p>
          {suggestion ? (
            <p className="text-xs text-muted-foreground">
              Điểm tin cậy: {suggestion.score}
              {suggestion.reasons[0] ? ` — ${suggestion.reasons[0]}` : ""}
            </p>
          ) : null}
          {availability.note ? (
            <div className="mt-2.5 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
              <span className="font-semibold">Ghi chú:</span> {availability.note}
            </div>
          ) : null}
        </div>
      </div>

      <AdminPartTimeAvailabilityAssignPanelForm
        key={availability.id}
        availability={availability}
        weekStartKey={weekStartKey}
        onAssigned={onAssigned}
        canAssign={canAssign}
        weekDates={weekDates}
        dayMap={dayMap}
        suggestionAssignments={suggestion?.assignments}
      />
    </div>
  )
}
