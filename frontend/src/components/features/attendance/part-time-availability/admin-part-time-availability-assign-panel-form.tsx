/**
 * Controlled weekly assignment form for an admin-selected employee.
 * It validates assigned slots against submitted free-time before producing the save payload.
 */
import { Button } from "@/components/ui/button"
import {
  DAY_OF_WEEK_LABELS,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_ASSIGN_LABELS,
  PART_TIME_AVAILABILITY_ASSIGN_VALIDATION,
} from "@/config/entities/part-time-availability.config"
import { useAssignPartTimeShifts } from "@/hooks/attendance/use-part-time-availability"
import { schedulesApi } from "@/lib/api/attendance.api"
import type {
  IPartTimeWeeklyAvailability,
  ISuggestPartTimeAssignment,
} from "@/types/part-time-availability.types"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import {
  type IPartTimeAssignmentDayForm,
  collectPartTimeAssignmentIssues,
  flattenPartTimeAssignments,
} from "@/utils/attendance/part-time-availability.util"
import { buildPartTimeAssignmentsFromPlannedWeek } from "@/utils/attendance/part-time-availability/build-part-time-assignments-from-planned-week.util"
import { mapSuggestionAssignmentsToForm } from "@/utils/attendance/part-time-availability/map-suggestion-assignments-to-form.util"

import { useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { AdminPartTimeAssignDayColumn } from "./admin-part-time-assign-day-column"

export interface AdminPartTimeAvailabilityAssignPanelFormProps {
  availability: IPartTimeWeeklyAvailability
  weekStartKey: string
  onAssigned?: () => void
  canAssign: boolean
  weekDates: ReturnType<typeof getWeekDates>
  dayMap: Map<number, IPartTimeWeeklyAvailability["days"][number]>
  suggestionAssignments?: ISuggestPartTimeAssignment[]
}

/** Stateful assign form — one row per weekday, validates slots before POST. */
export function AdminPartTimeAvailabilityAssignPanelForm({
  availability,
  weekStartKey,
  onAssigned,
  canAssign,
  weekDates,
  dayMap,
  suggestionAssignments,
}: AdminPartTimeAvailabilityAssignPanelFormProps) {
  const assignMutation = useAssignPartTimeShifts(weekStartKey)
  const { data: plannedWeek } = useQuery({
    queryKey: ["employee-planned-week", availability.employeeId, weekStartKey],
    queryFn: () => schedulesApi.getEmployeePlannedWeek(availability.employeeId, weekStartKey),
  })

  const initialAssignments = useMemo(
    () => buildPartTimeAssignmentsFromPlannedWeek(availability, plannedWeek),
    [availability, plannedWeek],
  )

  const assignmentKey = `${availability.id}:${weekStartKey}`
  const [editedAssignments, setEditedAssignments] = useState<{
    key: string
    value: IPartTimeAssignmentDayForm[]
  } | null>(null)
  const [usedSuggestion, setUsedSuggestion] = useState(false)
  const assignments =
    editedAssignments?.key === assignmentKey ? editedAssignments.value : initialAssignments

  const setAssignments = (
    update:
      | IPartTimeAssignmentDayForm[]
      | ((current: IPartTimeAssignmentDayForm[]) => IPartTimeAssignmentDayForm[]),
  ) => {
    setEditedAssignments((current) => {
      const currentAssignments = current?.key === assignmentKey ? current.value : assignments
      return {
        key: assignmentKey,
        value: typeof update === "function" ? update(currentAssignments) : update,
      }
    })
  }

  const validationIssues = useMemo(
    () => collectPartTimeAssignmentIssues(assignments, dayMap, DAY_OF_WEEK_LABELS),
    [assignments, dayMap],
  )

  const isAllBusyWeek = useMemo(
    () => WORK_WEEK_DISPLAY_DAY_ORDER.every((dayOfWeek) => dayMap.get(dayOfWeek)?.isBusyAllDay),
    [dayMap],
  )

  const hasValidationErrors = validationIssues.length > 0
  const hasSuggestion = Boolean(suggestionAssignments && suggestionAssignments.length > 0)

  const handleApplySuggestion = () => {
    if (!suggestionAssignments || suggestionAssignments.length === 0) return
    setAssignments(mapSuggestionAssignmentsToForm(suggestionAssignments))
    setUsedSuggestion(true)
    toast.success(PART_TIME_AVAILABILITY_ASSIGN_LABELS.APPLY_SUGGESTION_SUCCESS)
  }

  const handleAssign = async () => {
    if (isAllBusyWeek) {
      toast.error(PART_TIME_AVAILABILITY_ASSIGN_LABELS.ALL_BUSY_WEEK)
      return
    }

    if (hasValidationErrors) {
      toast.error(validationIssues[0] ?? PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.CHECK_ASSIGNMENTS)
      return
    }

    try {
      const result = await assignMutation.mutateAsync({
        id: availability.id,
        assignments: flattenPartTimeAssignments(assignments, weekDates),
        suggestionDecision: usedSuggestion ? "edited" : "manual",
      })
      if (result.assigned === 0) {
        toast.success(PART_TIME_AVAILABILITY_ASSIGN_LABELS.CLEAR_WEEK_SUCCESS)
      } else {
        toast.success(`Đã xếp ${result.assigned} ca, bỏ qua ${result.skipped} ngày`)
      }
      setEditedAssignments(null)
      onAssigned?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xếp ca")
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isAllBusyWeek ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
            <p className="text-sm font-medium text-foreground">
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.ALL_BUSY_WEEK}
            </p>
            <p className="text-xs text-muted-foreground">
              Nhân viên đã đánh dấu bận cả tuần — không có ngày nào để xếp ca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-308 grid-cols-7 gap-3 pb-2">
              {WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
                const assignment = assignments.find((entry) => entry.dayOfWeek === dayOfWeek)
                const weekDay = weekDates.find((entry) => entry.dayOfWeek === dayOfWeek)

                if (!assignment) return null

                return (
                  <AdminPartTimeAssignDayColumn
                    key={dayOfWeek}
                    dayLabel={DAY_OF_WEEK_LABELS.get(dayOfWeek) ?? ""}
                    shortDate={weekDay?.shortDate}
                    availabilityDay={dayMap.get(dayOfWeek)}
                    assignment={assignment}
                    disabled={!canAssign}
                    onChange={(next) => {
                      setAssignments((current) =>
                        current.map((entry) => (entry.dayOfWeek === dayOfWeek ? next : entry)),
                      )
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Chọn Làm/Không làm từng ngày. Giờ xếp ca phải nằm trong khung rảnh nhân viên đã gửi.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {hasSuggestion ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!canAssign || isAllBusyWeek}
              onClick={handleApplySuggestion}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {PART_TIME_AVAILABILITY_ASSIGN_LABELS.APPLY_SUGGESTION}
            </Button>
          ) : null}
          <Button
            type="button"
            className="rounded-full"
            disabled={
              !canAssign || assignMutation.isPending || hasValidationErrors || isAllBusyWeek
            }
            onClick={() => {
              void handleAssign()
            }}
          >
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xếp ca tuần này
          </Button>
        </div>
      </div>
    </>
  )
}
