import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/common"
import { getWeekStart } from "@/utils/attendance/get-week-start"

interface WeekPickerActionsProps {
  weekStartIso: string
  weekRangeLabel: string
  onWeekStartChange: (weekStart: Date) => void
  /** Optional bounds for part-time availability week picker (earliest submitted week). */
  minWeekStartIso?: string
  defaultWeekStart?: Date
  defaultWeekLabel?: string
}

export function WeekPickerActions({
  weekStartIso,
  weekRangeLabel,
  onWeekStartChange,
  minWeekStartIso,
  defaultWeekStart,
  defaultWeekLabel = "Hôm nay",
}: WeekPickerActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-52">
        <DatePicker
          value={weekStartIso}
          minDate={minWeekStartIso}
          size="sm"
          clearable={false}
          placeholder={weekRangeLabel}
          onChange={(val) => {
            if (!val) return
            onWeekStartChange(getWeekStart(new Date(val)))
          }}
        />
      </div>
      <Button
        size="sm"
        className="h-9 rounded-full px-4"
        onClick={() => {
          onWeekStartChange(defaultWeekStart ?? getWeekStart(new Date()))
        }}
      >
        {defaultWeekLabel}
      </Button>
    </div>
  )
}
