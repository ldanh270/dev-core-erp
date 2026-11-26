import { DatePicker, DateRangePicker } from "@/components/common"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_PRIORITY, TASK_STATUS, TASK_TRACKER } from "@/config/entities/project.config"

import {
  FILTER_DEFINITIONS,
  GANTT_FILTER_KEY,
  GANTT_FILTER_OPERATOR,
  GANTT_FILTER_TYPE,
} from "../../constants/gantt.constants"

interface GanttFilterValueSelectorProps {
  filterKey: string
  operator: string
  value: string
  assignees: { id: string; fullName: string }[]
  onChange: (val: string) => void
}

/** Selector component for choosing filter values based on field data type. */
export function GanttFilterValueSelector({
  filterKey,
  operator,
  value,
  assignees,
  onChange,
}: GanttFilterValueSelectorProps) {
  const def = Reflect.get(FILTER_DEFINITIONS, filterKey) as
    | { label: string; type: string; group: string }
    | undefined
  if (def === undefined) return null

  if (filterKey === GANTT_FILTER_KEY.STATUS) {
    if (operator !== GANTT_FILTER_OPERATOR.LA && operator !== GANTT_FILTER_OPERATOR.KHONG_LA)
      return null
    return (
      <Select value={value || TASK_STATUS.TODO} onValueChange={onChange}>
        <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value={TASK_STATUS.TODO}>New</SelectItem>
          <SelectItem value={TASK_STATUS.IN_PROGRESS}>In Progress</SelectItem>
          <SelectItem value={TASK_STATUS.IN_REVIEW}>In Review</SelectItem>
          <SelectItem value={TASK_STATUS.DONE}>Done</SelectItem>
          <SelectItem value={TASK_STATUS.CANCELLED}>Cancelled</SelectItem>
          <SelectItem value={TASK_STATUS.REOPENED}>Reopened</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (filterKey === GANTT_FILTER_KEY.TRACKER) {
    if (operator !== GANTT_FILTER_OPERATOR.IS && operator !== GANTT_FILTER_OPERATOR.IS_NOT)
      return null
    return (
      <Select value={value || TASK_TRACKER.TASK} onValueChange={onChange}>
        <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value={TASK_TRACKER.FEATURE}>Feature</SelectItem>
          <SelectItem value={TASK_TRACKER.BUG}>Bug</SelectItem>
          <SelectItem value={TASK_TRACKER.SUPPORT}>Support</SelectItem>
          <SelectItem value={TASK_TRACKER.TASK}>Task</SelectItem>
          <SelectItem value={TASK_TRACKER.MEETING}>Meeting</SelectItem>
          <SelectItem value={TASK_TRACKER.TEST}>Test</SelectItem>
          <SelectItem value={TASK_TRACKER.SUBTASK}>Subtask</SelectItem>
          <SelectItem value={TASK_TRACKER.MANAGEMENT}>Management</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (filterKey === GANTT_FILTER_KEY.PRIORITY) {
    if (operator !== GANTT_FILTER_OPERATOR.IS && operator !== GANTT_FILTER_OPERATOR.IS_NOT)
      return null
    return (
      <Select value={value || TASK_PRIORITY.MEDIUM} onValueChange={onChange}>
        <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value={TASK_PRIORITY.LOW}>Low</SelectItem>
          <SelectItem value={TASK_PRIORITY.MEDIUM}>Medium</SelectItem>
          <SelectItem value={TASK_PRIORITY.HIGH}>High</SelectItem>
          <SelectItem value={TASK_PRIORITY.URGENT}>Urgent</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) {
    if (operator !== GANTT_FILTER_OPERATOR.LA && operator !== GANTT_FILTER_OPERATOR.KHONG_LA)
      return null
    return (
      <Select
        value={value || assignees[0]?.id || "none"}
        onValueChange={(val) => {
          onChange(val === "none" ? "" : val)
        }}
      >
        <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {assignees.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (def.type === GANTT_FILTER_TYPE.TEXT) {
    if (operator === GANTT_FILTER_OPERATOR.NONE || operator === GANTT_FILTER_OPERATOR.ANY)
      return null
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background"
      />
    )
  }

  if (def.type === GANTT_FILTER_TYPE.NUMBER || def.type === GANTT_FILTER_TYPE.PROGRESS) {
    if (operator === GANTT_FILTER_OPERATOR.NONE || operator === GANTT_FILTER_OPERATOR.ANY)
      return null
    return (
      <input
        type="number"
        value={value || "0"}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background w-16"
      />
    )
  }

  if (def.type === GANTT_FILTER_TYPE.DATE) {
    if (
      operator === GANTT_FILTER_OPERATOR.ANY ||
      operator === GANTT_FILTER_OPERATOR.TODAY ||
      operator === GANTT_FILTER_OPERATOR.YESTERDAY ||
      operator === GANTT_FILTER_OPERATOR.OVERDUE
    )
      return null
    if (
      operator === GANTT_FILTER_OPERATOR.IN_DAYS ||
      operator === GANTT_FILTER_OPERATOR.MORE_THAN_DAYS
    ) {
      return (
        <div className="flex items-center gap-1 font-semibold">
          <input
            type="number"
            value={value || "0"}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background w-16"
          />
          <span>ngày trước</span>
        </div>
      )
    }
    if (operator === GANTT_FILTER_OPERATOR.BETWEEN) {
      const [d1 = "", d2 = ""] = (value || "").split(",")
      return (
        <DateRangePicker
          startDate={d1 || null}
          endDate={d2 || null}
          onChange={({ startDate, endDate }) => {
            onChange(`${startDate || ""},${endDate || ""}`)
          }}
          size="sm"
          placeholder="Khoảng ngày..."
        />
      )
    }
    return (
      <DatePicker
        value={value || null}
        onChange={(val) => {
          onChange(val || "")
        }}
        size="sm"
        placeholder="Chọn ngày..."
      />
    )
  }

  return null
}
