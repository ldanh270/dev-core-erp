import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TASK_STATUS } from "@/config/entities/project.config"

import { X } from "lucide-react"

import {
  FILTER_DEFINITIONS,
  GANTT_FILTER_KEY,
  GANTT_FILTER_OPERATOR,
  GANTT_FILTER_TYPE,
} from "../../constants/gantt.constants"
import { GanttFilterValueSelector } from "./GanttFilterValueSelector"

interface GanttSaveQueryFiltersListProps {
  newQueryFilterKeys: string[]
  setNewQueryFilterKeys: React.Dispatch<React.SetStateAction<string[]>>
  newQueryFilters: Record<string, { enabled: boolean; operator: string; value: string }>
  setNewQueryFilters: React.Dispatch<
    React.SetStateAction<Record<string, { enabled: boolean; operator: string; value: string }>>
  >
  assignees: { id: string; fullName: string }[]
  getDefaultOperator: (key: string) => string
  getDefaultValue: (key: string) => string
}

/** List component displaying currently applied query filters inside save dialog. */
export function GanttSaveQueryFiltersList({
  newQueryFilterKeys,
  setNewQueryFilterKeys,
  newQueryFilters,
  setNewQueryFilters,
  assignees,
  getDefaultOperator,
  getDefaultValue,
}: GanttSaveQueryFiltersListProps) {
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Bộ lọc
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            Thêm lọc:
          </span>
          <Select
            value=""
            onValueChange={(filterKey) => {
              setNewQueryFilterKeys((prev) => [...prev, filterKey])
              setNewQueryFilters((prev) => ({
                ...prev,
                [filterKey]: {
                  enabled: true,
                  operator: getDefaultOperator(filterKey),
                  value: getDefaultValue(filterKey),
                },
              }))
            }}
          >
            <SelectTrigger className="w-36 h-7 text-[10px] border-border rounded-full bg-background">
              <SelectValue placeholder="Chọn bộ lọc..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover max-h-60 overflow-y-auto">
              {Object.entries(FILTER_DEFINITIONS)
                .filter(([k]) => !newQueryFilterKeys.includes(k))
                .map(([k, def]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {def.label}
                  </SelectItem>
                ))}
              {Array.from(
                new Set(
                  Object.values(FILTER_DEFINITIONS)
                    .map((d) => d.group)
                    .filter(Boolean),
                ),
              ).map((group) => (
                <div key={group} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/10 mt-1 first:mt-0">
                    {group}
                  </div>
                  {Object.entries(FILTER_DEFINITIONS)
                    .filter(
                      ([k, def]) => def.group === group && !newQueryFilterKeys.includes(k),
                    )
                    .map(([k, def]) => (
                      <SelectItem key={k} value={k} className="text-xs pl-4">
                        {def.label}
                      </SelectItem>
                    ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {newQueryFilterKeys.map((key) => {
          if (!Object.prototype.hasOwnProperty.call(newQueryFilters, key)) return null
          const filter = Reflect.get(newQueryFilters, key) as
            | { enabled: boolean; operator: string; value: string }
            | undefined
          if (filter === undefined) return null
          const def = Reflect.get(FILTER_DEFINITIONS, key) as
            | { label: string; type: string; group: string }
            | undefined

          return (
            <div key={key} className="flex flex-wrap items-center gap-2 md:gap-4 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold min-w-30">
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  onChange={(e) => {
                    setNewQueryFilters((prev) => {
                      if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                      const existing = Reflect.get(prev, key) as
                        | { enabled: boolean; operator: string; value: string }
                        | undefined
                      if (existing === undefined) return prev
                      const next = { ...prev }
                      Reflect.set(next, key, { ...existing, enabled: e.target.checked })
                      return next
                    })
                  }}
                  className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                />
                <span>{def?.label || key}</span>
              </label>

              <select
                value={filter.operator}
                onChange={(e) => {
                  const op = e.target.value
                  let val = filter.value

                  if (def !== undefined) {
                    if (
                      def.type === GANTT_FILTER_TYPE.EMPLOYEE &&
                      (op === GANTT_FILTER_OPERATOR.LA ||
                        op === GANTT_FILTER_OPERATOR.KHONG_LA) &&
                      !val
                    ) {
                      val = assignees.at(0)?.id || ""
                    } else if (
                      key === GANTT_FILTER_KEY.STATUS &&
                      (op === GANTT_FILTER_OPERATOR.LA ||
                        op === GANTT_FILTER_OPERATOR.KHONG_LA) &&
                      !val
                    ) {
                      val = TASK_STATUS.TODO
                    } else if (def.type === GANTT_FILTER_TYPE.PROGRESS && !val) {
                      val = "50"
                    } else if (def.type === GANTT_FILTER_TYPE.NUMBER && !val) {
                      val = "0"
                    }
                  }

                  setNewQueryFilters((prev) => {
                    if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                    const existing = Reflect.get(prev, key) as
                      | { enabled: boolean; operator: string; value: string }
                      | undefined
                    if (existing === undefined) return prev
                    const next = { ...prev }
                    Reflect.set(next, key, { ...existing, operator: op, value: val })
                    return next
                  })
                }}
                className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
              >
                {(() => {
                  if (def === undefined)
                    return <option value={GANTT_FILTER_OPERATOR.IS}>là</option>

                  if (key === GANTT_FILTER_KEY.STATUS) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.OPEN}>mở</option>
                        <option value={GANTT_FILTER_OPERATOR.DONG}>đóng</option>
                        <option value={GANTT_FILTER_OPERATOR.TAT_CA}>tất cả</option>
                        <option value={GANTT_FILTER_OPERATOR.LA}>là</option>
                        <option value={GANTT_FILTER_OPERATOR.KHONG_LA}>không là</option>
                      </>
                    )
                  }
                  if (key === GANTT_FILTER_KEY.TRACKER || key === GANTT_FILTER_KEY.PRIORITY) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.IS}>là</option>
                        <option value={GANTT_FILTER_OPERATOR.IS_NOT}>không là</option>
                      </>
                    )
                  }
                  if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.LA}>là</option>
                        <option value={GANTT_FILTER_OPERATOR.KHONG_LA}>không là</option>
                        <option value={GANTT_FILTER_OPERATOR.TOI}>tôi</option>
                        <option value={GANTT_FILTER_OPERATOR.NONE}>không phân công</option>
                      </>
                    )
                  }
                  if (def.type === GANTT_FILTER_TYPE.TEXT) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.CHUA}>chứa</option>
                        <option value={GANTT_FILTER_OPERATOR.KHONG_CHUA}>không chứa</option>
                        <option value={GANTT_FILTER_OPERATOR.BAT_DAU_BANG}>bắt đầu bằng</option>
                        <option value={GANTT_FILTER_OPERATOR.KET_THUC_BANG}>kết thúc bằng</option>
                        <option value={GANTT_FILTER_OPERATOR.NONE}>rỗng</option>
                        <option value={GANTT_FILTER_OPERATOR.ANY}>không rỗng</option>
                      </>
                    )
                  }
                  if (
                    def.type === GANTT_FILTER_TYPE.NUMBER ||
                    def.type === GANTT_FILTER_TYPE.PROGRESS
                  ) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.EQUAL}>=</option>
                        <option value={GANTT_FILTER_OPERATOR.GREATER_THAN_EQUAL}>&gt;=</option>
                        <option value={GANTT_FILTER_OPERATOR.LESS_THAN_EQUAL}>&lt;=</option>
                        <option value={GANTT_FILTER_OPERATOR.NONE}>rỗng</option>
                        <option value={GANTT_FILTER_OPERATOR.ANY}>không rỗng</option>
                      </>
                    )
                  }
                  if (def.type === GANTT_FILTER_TYPE.DATE) {
                    return (
                      <>
                        {key === GANTT_FILTER_KEY.DATE_DUE && (
                          <option value={GANTT_FILTER_OPERATOR.OVERDUE}>quá hạn / trễ hạn</option>
                        )}
                        <option value={GANTT_FILTER_OPERATOR.ANY}>bất kỳ lúc nào</option>
                        <option value={GANTT_FILTER_OPERATOR.TODAY}>hôm nay</option>
                        <option value={GANTT_FILTER_OPERATOR.YESTERDAY}>hôm qua</option>
                        <option value={GANTT_FILTER_OPERATOR.IN_DAYS}>trong vòng</option>
                        <option value={GANTT_FILTER_OPERATOR.MORE_THAN_DAYS}>hơn</option>
                        <option value={GANTT_FILTER_OPERATOR.BETWEEN}>giữa</option>
                        <option value={GANTT_FILTER_OPERATOR.AFTER}>sau</option>
                        <option value={GANTT_FILTER_OPERATOR.BEFORE}>trước</option>
                      </>
                    )
                  }
                  if (def.type === GANTT_FILTER_TYPE.RELATION) {
                    return (
                      <>
                        <option value={GANTT_FILTER_OPERATOR.ANY}>có</option>
                        <option value={GANTT_FILTER_OPERATOR.NONE}>không</option>
                      </>
                    )
                  }
                  return <option value={GANTT_FILTER_OPERATOR.IS}>là</option>
                })()}
              </select>

              <GanttFilterValueSelector
                filterKey={key}
                operator={filter.operator}
                value={filter.value}
                assignees={assignees}
                onChange={(val) => {
                  setNewQueryFilters((prev) => {
                    if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                    const existing = Reflect.get(prev, key) as
                      | { enabled: boolean; operator: string; value: string }
                      | undefined
                    if (existing === undefined) return prev
                    const next = { ...prev }
                    Reflect.set(next, key, { ...existing, value: val })
                    return next
                  })
                }}
              />

              <button
                onClick={() => {
                  setNewQueryFilterKeys((prev) => prev.filter((k) => k !== key))
                }}
                className="text-muted-foreground hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-muted shrink-0 ml-2 cursor-pointer"
                title="Xóa bộ lọc"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
