import { PageCard, PageHeader, SectionHeader } from "@/components/common"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { AvailabilityWeekGrid } from "@/components/features/attendance/part-time-availability/availability-week-grid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DAY_OF_WEEK_LABELS } from "@/config/entities/attendance.config"
import {
  PART_TIME_AVAILABILITY_ACTION_LABELS,
  PART_TIME_AVAILABILITY_FORM_VALIDATION,
  PART_TIME_AVAILABILITY_STATUS,
} from "@/config/entities/part-time-availability.config"
import { useUpsertMyPartTimeAvailability } from "@/hooks/attendance/use-part-time-availability"
import type {
  IPartTimeAvailabilityDayForm,
  IPartTimeWeeklyAvailability,
} from "@/types/part-time-availability.types"
import {
  collectEmployeeAvailabilityIssues,
  mapAvailabilityToForm,
} from "@/utils/attendance/part-time-availability.util"

import { useMemo, useState } from "react"

import { AlertCircle, ChevronLeft, ChevronRight, Info, Save, Send } from "lucide-react"
import { toast } from "sonner"

function EmployeeAvailabilityStatusAlerts({
  availability,
}: {
  availability: IPartTimeWeeklyAvailability | null | undefined
}) {
  return (
    <>
      {availability?.status === PART_TIME_AVAILABILITY_STATUS.SUBMITTED ? (
        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Lịch rảnh đã gửi</p>
            <p className="text-xs text-muted-foreground">
              Bạn có thể chỉnh sửa và cập nhật nhiều lần trước khi quản lý xếp ca.
            </p>
          </div>
        </div>
      ) : null}

      {availability?.rejectReason ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Lịch rảnh bị từ chối</p>
            <p className="text-xs text-destructive/90">{availability.rejectReason}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

function useEmployeePartTimeAvailabilityForm({
  availability,
  weekStartKey,
}: {
  availability: IPartTimeWeeklyAvailability | null | undefined
  weekStartKey: string
}) {
  const upsertMutation = useUpsertMyPartTimeAvailability(weekStartKey)
  const [days, setDays] = useState<IPartTimeAvailabilityDayForm[]>(() =>
    mapAvailabilityToForm(availability),
  )
  const [note, setNote] = useState(() => availability?.note ?? "")

  const isUpdate = Boolean(availability)
  const submitLabel = isUpdate
    ? PART_TIME_AVAILABILITY_ACTION_LABELS.UPDATE
    : PART_TIME_AVAILABILITY_ACTION_LABELS.SUBMIT
  const SubmitIcon = isUpdate ? Save : Send

  const validationIssues = useMemo(
    () => collectEmployeeAvailabilityIssues(days, DAY_OF_WEEK_LABELS),
    [days],
  )

  const handleDayChange = (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => {
    setDays((current) => current.map((entry) => (entry.dayOfWeek === dayOfWeek ? day : entry)))
  }

  const handleSubmit = async () => {
    if (validationIssues.length > 0) {
      toast.error(validationIssues[0] ?? PART_TIME_AVAILABILITY_FORM_VALIDATION.CHECK_FORM)
      return
    }

    try {
      await upsertMutation.mutateAsync({
        weekStart: weekStartKey,
        note: note.trim() || null,
        status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
        days,
      })
      toast.success(
        isUpdate
          ? PART_TIME_AVAILABILITY_ACTION_LABELS.UPDATE_SUCCESS
          : PART_TIME_AVAILABILITY_ACTION_LABELS.SUBMIT_SUCCESS,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu lịch rảnh")
    }
  }

  return {
    days,
    note,
    setNote,
    isUpdate,
    submitLabel,
    SubmitIcon,
    handleDayChange,
    handleSubmit,
    isPending: upsertMutation.isPending,
  }
}

export interface EmployeePartTimeAvailabilityFormProps {
  availability: IPartTimeWeeklyAvailability | null | undefined
  weekStart: Date
  weekStartKey: string
  weekRangeLabel: string
  earliestWeekStart: Date
  earliestWeekStartKey: string
  canGoToPreviousWeek: boolean
  onWeekStartChange: (nextWeekStart: Date) => void
  onShiftWeek: (offset: number) => void
}

/** Employee self-service form — week grid + note + submit/update. */
export function EmployeePartTimeAvailabilityForm({
  availability,
  weekStart,
  weekStartKey,
  weekRangeLabel,
  earliestWeekStart,
  earliestWeekStartKey,
  canGoToPreviousWeek,
  onWeekStartChange,
  onShiftWeek,
}: EmployeePartTimeAvailabilityFormProps) {
  const { days, note, setNote, submitLabel, SubmitIcon, handleDayChange, handleSubmit, isPending } =
    useEmployeePartTimeAvailabilityForm({ availability, weekStartKey })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch rảnh tuần"
        description="Khai báo khung giờ rảnh hoặc bận để quản lý xếp ca linh hoạt."
        actions={
          <Button
            type="button"
            size="lg"
            className="rounded-full px-6"
            disabled={isPending}
            onClick={() => {
              void handleSubmit()
            }}
          >
            <SubmitIcon className="mr-2 h-4 w-4" />
            {submitLabel}
          </Button>
        }
      />

      <EmployeeAvailabilityStatusAlerts availability={availability} />

      <PageCard padding="lg" className="space-y-5">
        <SectionHeader
          title="Thời khóa biểu tuần"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!canGoToPreviousWeek}
                onClick={() => {
                  onShiftWeek(-1)
                }}
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <WeekPickerActions
                weekStartIso={weekStartKey}
                weekRangeLabel={weekRangeLabel}
                minWeekStartIso={earliestWeekStartKey}
                defaultWeekStart={earliestWeekStart}
                defaultWeekLabel="Tuần kế tiếp"
                onWeekStartChange={onWeekStartChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  onShiftWeek(1)
                }}
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        <AvailabilityWeekGrid
          weekStart={weekStart}
          days={days}
          disabled={isPending}
          onDayChange={handleDayChange}
        />

        <div className="space-y-2 pt-2 border-t border-border/50">
          <label
            htmlFor="employee-part-time-note"
            className="text-xs font-semibold text-foreground uppercase tracking-wider block"
          >
            Ghi chú gửi quản lý
          </label>
          <Textarea
            id="employee-part-time-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
            }}
            placeholder="Ví dụ: Thứ 4 có thể đến muộn 15 phút do bận lịch thi..."
            className="min-h-24 resize-none rounded-xl bg-background border-border"
          />
        </div>
      </PageCard>
    </div>
  )
}
