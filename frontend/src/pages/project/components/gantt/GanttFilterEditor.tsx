import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

interface GanttFilterEditorProps {
  activeFilterKeys: string[]
  setActiveFilterKeys: React.Dispatch<React.SetStateAction<string[]>>
  filterStates: Record<string, { enabled: boolean; operator: string; value: string } | undefined>
  setFilterStates: React.Dispatch<
    React.SetStateAction<
      Record<string, { enabled: boolean; operator: string; value: string } | undefined>
    >
  >
  assignees: { id: string; fullName: string }[]
  getDefaultOperator: (key: string) => string
  getDefaultValue: (key: string) => string
}

/** Interactive filter builder dialog for configuring Gantt task constraints. */
export function GanttFilterEditor({
  activeFilterKeys,
  setActiveFilterKeys,
  filterStates,
  setFilterStates,
  assignees,
  getDefaultOperator,
  getDefaultValue,
}: GanttFilterEditorProps) {
  return (
    <div className="bg-muted/10 p-4 rounded-xl border border-border/40 text-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Active filters list */}
        <div className="space-y-3 flex-1">
          {activeFilterKeys.map((key) => {
            if (!Object.prototype.hasOwnProperty.call(FILTER_DEFINITIONS, key)) return null
            const filter = Reflect.get(filterStates, key) as
              | { enabled: boolean; operator: string; value: string }
              | undefined
            if (filter === undefined) return null

            const def = Reflect.get(FILTER_DEFINITIONS, key) as
              | { label: string; type: string; group: string }
              | undefined

            return (
              <div key={key} className="flex flex-wrap items-center gap-2 md:gap-4 py-1">
                {/* Checkbox & Label */}
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold min-w-30">
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={(e) => {
                      setFilterStates((prev) => {
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

                {/* Operator Select */}
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

                    setFilterStates((prev) => {
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

                {/* Value Select */}
                <GanttFilterValueSelector
                  filterKey={key}
                  operator={filter.operator}
                  value={filter.value}
                  assignees={assignees}
                  onChange={(val) => {
                    setFilterStates((prev) => {
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

                {/* Delete Button */}
                <button
                  onClick={() => {
                    setActiveFilterKeys((prev) => prev.filter((k) => k !== key))
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

        {/* Add Filter Selector */}
        <div className="flex items-center gap-2 shrink-0 md:self-start bg-secondary/10 p-2 rounded-xl border border-dashed border-border/40">
          <span className="font-semibold text-muted-foreground text-xs">Thêm lọc</span>
          <Select
            key={activeFilterKeys.length}
            value=""
            onValueChange={(selected) => {
              if (selected && !activeFilterKeys.includes(selected)) {
                setActiveFilterKeys((prev) => [...prev, selected])
                setFilterStates((prev) => {
                  const next = { ...prev }
                  Reflect.set(next, selected, {
                    enabled: true,
                    operator: getDefaultOperator(selected),
                    value: getDefaultValue(selected),
                  })
                  return next
                })
              }
            }}
          >
            <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer min-w-35">
              <SelectValue placeholder="-- Chọn --" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover max-h-80 overflow-y-auto p-1.5 shadow-xl space-y-1">
              {Object.entries(FILTER_DEFINITIONS)
                .filter(([k, def]) => !def.group && !activeFilterKeys.includes(k))
                .map(([k, def]) => (
                  <SelectItem key={k} value={k} className="text-xs py-2.5 my-1 rounded-lg cursor-pointer">
                    {def.label}
                  </SelectItem>
                ))}

              {Array.from(
                new Set(
                  Object.values(FILTER_DEFINITIONS)
                    .map((d) => d.group)
                    .filter(Boolean),
                ),
              ).map((group) => {
                const items = Object.entries(FILTER_DEFINITIONS).filter(
                  ([k, def]) => def.group === group && !activeFilterKeys.includes(k),
                )
                if (items.length === 0) return null
                return (
                  <SelectGroup
                    key={group}
                    className="mt-2 pt-2 border-t border-border/20 first:mt-0 first:pt-0 first:border-0"
                  >
                    <SelectLabel className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </SelectLabel>
                    {items.map(([k, def]) => (
                      <SelectItem
                        key={k}
                        value={k}
                        className="text-xs py-2.5 my-1 pl-5 rounded-lg cursor-pointer"
                      >
                        {def.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
