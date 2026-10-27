import React, { useState } from "react"
import { 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  FileText,
  ChevronDown,
  Check,
  RotateCcw,
  Save,
  ZoomIn,
  ZoomOut,
  X,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ChevronsUp,
  ChevronsDown
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { TaskReviewModal } from "./task-review-modal"
import type { Project } from "@/types/project.types"
import type { Task, TaskSpentTime } from "@/types/task.types"
import { DatePicker, DateRangePicker } from "@/components/common"
import { useProjectGantt } from "../hooks/use-project-gantt"
import {
  FILTER_DEFINITIONS,
  GANTT_FILTER_KEY,
  QUICK_QUERY_TYPE,
  GANTT_FILTER_TYPE,
  GANTT_FILTER_OPERATOR,
} from "../constants/gantt.constants"
import { TASK_STATUS, TASK_PRIORITY, TASK_TRACKER } from "@/config/entities/project.config"

const filterDefinitions = FILTER_DEFINITIONS

const GANTT_AVAILABLE_COLUMNS = [
  { key: "estimatedTime", label: "Ước lượng thời gian & log time (Est)" },
  { key: "assignee", label: "Người thực hiện nhiệm vụ (Assignee)" },
  { key: "progress", label: "Hiển thị nhãn tiến độ dòng thời gian (Progress)" }
]

/**
 * Properties for ProjectGanttTab component.
 */
interface ProjectGanttTabProps {
  projectId: string
  project: Project
}

/**
 * Gantt timeline tab component. Allows project managers and team members to visualize,
 * track, plan, and manage task schedules dynamically across a grid-based timeline.
 */
export function ProjectGanttTab({ projectId, project }: ProjectGanttTabProps) {
  const {
    timelineStart,
    selectedTaskForReview,
    setSelectedTaskForReview,
    isOptionsExpanded,
    setIsOptionsExpanded,
    showEstTime,
    setShowEstTime,
    showAssignee,
    setShowAssignee,
    showProgress,
    setShowProgress,
    monthsInput,
    setMonthsInput,
    monthInput,
    setMonthInput,
    yearInput,
    setYearInput,
    isFiltersExpanded,
    setIsFiltersExpanded,
    activeFilterKeys,
    setActiveFilterKeys,
    filterStates,
    setFilterStates,
    isSidebarExpanded,
    setIsSidebarExpanded,
    dayWidth,
    isLoading,
    savedQueries,
    saveQueryMutation,
    deleteQueryMutation,
    applySavedQuery,
    handleSaveQuery,
    assignees,
    statuses,
    isLoadingStatuses,
    getDefaultOperator,
    getDefaultValue,
    timelineDays,
    monthSpans,
    treeTasks,
    shiftTimeline,
    resetTimelineToProjectStart,
    isLeader,
    isAdminOrGM,
    getTaskGridStyle,
    shiftTimelineByMonth,
    getMonthOffsetLabel,
    handleZoomIn,
    handleZoomOut,
    handleApplyFilters,
    handleClearFilters,
    handleQuickQuery,
  } = useProjectGantt({ projectId, project })

  const getDueDateCol = (dueDateStr: string | null | undefined) => {
    if (!dueDateStr) return null
    const dueDate = new Date(dueDateStr)
    const idx = timelineDays.findIndex((day) => 
      day.getDate() === dueDate.getDate() &&
      day.getMonth() === dueDate.getMonth() &&
      day.getFullYear() === dueDate.getFullYear()
    )
    return idx !== -1 ? idx + 1 : null
  }

  // Save query dialog state
  const [isSaveQueryOpen, setIsSaveQueryOpen] = useState(false)
  
  // New Query Form States
  const [newQueryName, setNewQueryName] = useState("")
  const [newQueryDesc, setNewQueryDesc] = useState("")
  const [newQueryForAll, setNewQueryForAll] = useState(false)
  const [newQueryDefaultCols, setNewQueryDefaultCols] = useState(true)
  
  const [newQuerySelectedCols, setNewQuerySelectedCols] = useState<string[]>([
    "estimatedTime",
    "assignee",
    "progress"
  ])
  const [availSelectedKey, setAvailSelectedKey] = useState<string | null>(null)
  const [selSelectedKey, setSelSelectedKey] = useState<string | null>(null)
  
  const [newQueryFilters, setNewQueryFilters] = useState<Record<string, { enabled: boolean; operator: string; value: string }>>({})
  const [newQueryFilterKeys, setNewQueryFilterKeys] = useState<string[]>([])

  const handleOpenSaveDialog = () => {
    setNewQueryName("")
    setNewQueryDesc("")
    setNewQueryForAll(false)
    
    const cols = []
    if (showEstTime) cols.push("estimatedTime")
    if (showAssignee) cols.push("assignee")
    if (showProgress) cols.push("progress")
    setNewQuerySelectedCols(cols)
    setNewQueryDefaultCols(showEstTime && showAssignee && showProgress)
    
    // Pre-fill filters from current active filter keys and states
    const filtersCopy: Record<string, { enabled: boolean; operator: string; value: string }> = {}
    activeFilterKeys.forEach(k => {
      const state = filterStates[k]
      if (state) {
        filtersCopy[k] = { ...state }
      }
    })
    setNewQueryFilters(filtersCopy)
    setNewQueryFilterKeys([...activeFilterKeys])
    
    setIsSaveQueryOpen(true)
  }

  const handleSubmitSaveQuery = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueryName.trim()) return

    const finalFilters: Record<string, { enabled: boolean; operator: string; value: string }> = {}
    const finalKeys: string[] = []

    newQueryFilterKeys.forEach(k => {
      const filter = newQueryFilters[k]
      if (filter.enabled) {
        finalKeys.push(k)
        finalFilters[k] = {
          enabled: true,
          operator: filter.operator,
          value: filter.value
        }
      }
    })

    const finalOptions = {
      showEstTime: newQueryDefaultCols ? true : newQuerySelectedCols.includes("estimatedTime"),
      showAssignee: newQueryDefaultCols ? true : newQuerySelectedCols.includes("assignee"),
      showProgress: newQueryDefaultCols ? true : newQuerySelectedCols.includes("progress")
    }

    const queryDataObj = {
      activeFilterKeys: finalKeys,
      filterStates: finalFilters,
      options: finalOptions
    }

    handleSaveQuery({
      name: newQueryName.trim(),
      projectId: newQueryForAll ? null : projectId,
      queryData: JSON.stringify(queryDataObj)
    })

    setIsSaveQueryOpen(false)
  }

  if (isLoading || isLoadingStatuses) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Clock className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Đang tải dữ liệu Gantt...</p>
      </div>
    )
  }

  // Render values selector dynamically
  const renderValueSelector = (key: string, operator: string, value: string, onChange: (val: string) => void) => {
    const def = Reflect.get(FILTER_DEFINITIONS, key) as { label: string; type: string; group: string } | undefined
    if (def === undefined) return null

    if (key === GANTT_FILTER_KEY.STATUS) {
      if (operator !== GANTT_FILTER_OPERATOR.LA && operator !== GANTT_FILTER_OPERATOR.KHONG_LA) return null
      return (
        <select
          value={value || TASK_STATUS.TODO}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value={TASK_STATUS.TODO}>New</option>
          <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
          <option value={TASK_STATUS.IN_REVIEW}>In Review</option>
          <option value={TASK_STATUS.DONE}>Done</option>
          <option value={TASK_STATUS.CANCELLED}>Cancelled</option>
          <option value={TASK_STATUS.REOPENED}>Reopened</option>
        </select>
      )
    }

    if (key === GANTT_FILTER_KEY.TRACKER) {
      if (operator !== GANTT_FILTER_OPERATOR.IS && operator !== GANTT_FILTER_OPERATOR.IS_NOT) return null
      return (
        <select
          value={value || TASK_TRACKER.TASK}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value={TASK_TRACKER.FEATURE}>Feature</option>
          <option value={TASK_TRACKER.BUG}>Bug</option>
          <option value={TASK_TRACKER.SUPPORT}>Support</option>
          <option value={TASK_TRACKER.TASK}>Task</option>
          <option value={TASK_TRACKER.MEETING}>Meeting</option>
          <option value={TASK_TRACKER.TEST}>Test</option>
          <option value={TASK_TRACKER.SUBTASK}>Subtask</option>
          <option value={TASK_TRACKER.MANAGEMENT}>Management</option>
        </select>
      )
    }

    if (key === GANTT_FILTER_KEY.PRIORITY) {
      if (operator !== GANTT_FILTER_OPERATOR.IS && operator !== GANTT_FILTER_OPERATOR.IS_NOT) return null
      return (
        <select
          value={value || TASK_PRIORITY.MEDIUM}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
        >
          <option value={TASK_PRIORITY.LOW}>Low</option>
          <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
          <option value={TASK_PRIORITY.HIGH}>High</option>
          <option value={TASK_PRIORITY.URGENT}>Urgent</option>
        </select>
      )
    }

    if (def.type === GANTT_FILTER_TYPE.EMPLOYEE) {
      if (operator !== GANTT_FILTER_OPERATOR.LA && operator !== GANTT_FILTER_OPERATOR.KHONG_LA) return null
      return (
        <select
          value={value || (assignees[0]?.id || "")}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer min-w-[120px]"
        >
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.fullName}</option>
          ))}
        </select>
      )
    }

    if (def.type === GANTT_FILTER_TYPE.TEXT) {
      if (operator === GANTT_FILTER_OPERATOR.NONE || operator === GANTT_FILTER_OPERATOR.ANY) return null
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background"
        />
      )
    }

    if (def.type === GANTT_FILTER_TYPE.NUMBER || def.type === GANTT_FILTER_TYPE.PROGRESS) {
      if (operator === GANTT_FILTER_OPERATOR.NONE || operator === GANTT_FILTER_OPERATOR.ANY) return null
      return (
        <input
          type="number"
          value={value || "0"}
          onChange={(e) => { onChange(e.target.value); }}
          className="h-8 rounded-full border border-border/40 px-3 text-xs focus:outline-none focus:border-primary bg-background w-16"
        />
      )
    }

    if (def.type === GANTT_FILTER_TYPE.DATE) {
      if (operator === GANTT_FILTER_OPERATOR.ANY || operator === GANTT_FILTER_OPERATOR.TODAY || operator === GANTT_FILTER_OPERATOR.YESTERDAY) return null
      if (operator === GANTT_FILTER_OPERATOR.IN_DAYS || operator === GANTT_FILTER_OPERATOR.MORE_THAN_DAYS) {
        return (
          <div className="flex items-center gap-1 font-semibold">
            <input
              type="number"
              value={value || "0"}
              onChange={(e) => { onChange(e.target.value); }}
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
          onChange={(val) => { onChange(val || ""); }}
          size="sm"
          placeholder="Chọn ngày..."
        />
      )
    }

    return null
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Gantt Header Tools */}
        <div className="flex flex-col gap-4 bg-background p-4 rounded-xl border border-border/40 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-3">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Dòng thời gian dự án</h4>
                <p className="text-xs text-muted-foreground">
                  Từ {format(timelineStart, "dd/MM/yyyy")} đến {format(addDays(timelineStart, timelineDays.length - 1), "dd/MM/yyyy")}
                </p>
              </div>
            </div>

            {/* Top View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { resetTimelineToProjectStart(); }}
                className="rounded-full text-xs"
              >
                Về ngày bắt đầu dự án
              </Button>
              <div className="flex items-center bg-secondary rounded-full p-0.5 border border-border/40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => { shiftTimeline(-7); }}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs font-semibold px-2">Di chuyển</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => { shiftTimeline(7); }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Filters Link Toggle */}
          <div className="flex items-center">
            <button 
              onClick={() => { setIsFiltersExpanded(!isFiltersExpanded); }}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              {isFiltersExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Bộ lọc
            </button>
          </div>

          {/* Collapsible Filters Box */}
          {isFiltersExpanded && (
            <div className="bg-muted/10 p-4 rounded-xl border border-border/40 text-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Active filters list */}
                <div className="space-y-3 flex-1">
                  {activeFilterKeys.map((key) => {
                    if (!Object.prototype.hasOwnProperty.call(filterDefinitions, key)) return null
                    const filter = Reflect.get(filterStates, key) as { enabled: boolean; operator: string; value: string } | undefined
                    if (filter === undefined) return null
                    
                    const def = Reflect.get(filterDefinitions, key) as { label: string; type: string; group: string } | undefined
                    
                    return (
                      <div key={key} className="flex flex-wrap items-center gap-2 md:gap-4 py-1">
                        {/* Checkbox & Label */}
                        <label className="flex items-center gap-2 cursor-pointer select-none font-semibold min-w-[120px]">
                          <input 
                            type="checkbox" 
                            checked={filter.enabled} 
                            onChange={(e) => {
                              setFilterStates(prev => {
                                if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                                const existing = Reflect.get(prev, key) as { enabled: boolean; operator: string; value: string } | undefined
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
                            
                            // Initialize default value when changing operators if needed
                            if (def !== undefined) {
                              if (def.type === GANTT_FILTER_TYPE.EMPLOYEE && (op === GANTT_FILTER_OPERATOR.LA || op === GANTT_FILTER_OPERATOR.KHONG_LA) && !val) {
                                val = assignees[0]?.id || ""
                              } else if (key === GANTT_FILTER_KEY.STATUS && (op === GANTT_FILTER_OPERATOR.LA || op === GANTT_FILTER_OPERATOR.KHONG_LA) && !val) {
                                val = TASK_STATUS.TODO
                              } else if (def.type === GANTT_FILTER_TYPE.PROGRESS && !val) {
                                val = "50"
                              } else if (def.type === GANTT_FILTER_TYPE.NUMBER && !val) {
                                val = "0"
                              }
                            }

                            setFilterStates(prev => {
                              if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                              const existing = Reflect.get(prev, key) as { enabled: boolean; operator: string; value: string } | undefined
                              if (existing === undefined) return prev
                              const next = { ...prev }
                              Reflect.set(next, key, { ...existing, operator: op, value: val })
                              return next
                            })
                          }}
                          className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
                        >
                          {/* Render operators based on type */}
                          {(() => {
                            if (def === undefined) return <option value={GANTT_FILTER_OPERATOR.IS}>là</option>

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
                            if (def.type === GANTT_FILTER_TYPE.NUMBER || def.type === GANTT_FILTER_TYPE.PROGRESS) {
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

                        {/* Value Select (Conditional) */}
                        {renderValueSelector(key, filter.operator, filter.value, (val) => {
                          setFilterStates(prev => {
                            if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev
                            const existing = Reflect.get(prev, key) as { enabled: boolean; operator: string; value: string } | undefined
                            if (existing === undefined) return prev
                            const next = { ...prev }
                            Reflect.set(next, key, { ...existing, value: val })
                            return next
                          })
                        })}

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setActiveFilterKeys(prev => prev.filter(k => k !== key))
                          }}
                          className="text-muted-foreground hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-muted shrink-0 ml-2"
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
                  <span className="font-semibold text-muted-foreground">Thêm lọc</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = e.target.value
                      if (selected && !activeFilterKeys.includes(selected)) {
                        setActiveFilterKeys(prev => [...prev, selected])
                        setFilterStates(prev => {
                          const next = { ...prev }
                          Reflect.set(next, selected, {
                            enabled: true,
                            operator: getDefaultOperator(selected),
                            value: getDefaultValue(selected)
                          })
                          return next
                        })
                      }
                    }}
                    className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer min-w-[140px]"
                  >
                    <option value="" disabled>-- Chọn --</option>
                    {/* Flat filters (with no group) */}
                    {Object.entries(filterDefinitions)
                      .filter(([k, def]) => !def.group && !activeFilterKeys.includes(k))
                      .map(([k, def]) => (
                        <option key={k} value={k}>{def.label}</option>
                      ))
                    }
                    {/* Grouped filters */}
                    {Array.from(new Set(Object.values(filterDefinitions).map(d => d.group).filter(Boolean))).map(group => (
                      <optgroup key={group} label={group}>
                        {Object.entries(filterDefinitions)
                          .filter(([k, def]) => def.group === group && !activeFilterKeys.includes(k))
                          .map(([k, def]) => (
                            <option key={k} value={k}>
                              {def.label}
                            </option>
                          ))
                        }
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Options Link Toggle */}
          <div className="flex items-center">
            <button 
              onClick={() => { setIsOptionsExpanded(!isOptionsExpanded); }}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              {isOptionsExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Tùy chọn
            </button>
          </div>

          {/* Collapsible Options Box */}
          {isOptionsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/10 p-4 rounded-xl border border-border/40 text-xs">
              {/* Display Columns */}
              <div className="space-y-2">
                <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
                  Cột hiển thị
                </h5>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showEstTime} 
                      onChange={(e) => { setShowEstTime(e.target.checked); }} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Ước lượng thời gian & log time (Est)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showAssignee} 
                      onChange={(e) => { setShowAssignee(e.target.checked); }} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Người thực hiện nhiệm vụ (Assignee)</span>
                  </label>
                </div>
              </div>

              {/* HR Leave Relations removed */}

              {/* Progress Settings */}
              <div className="space-y-2">
                <h5 className="font-bold text-muted-foreground border-b border-border/20 pb-1">
                  Tiến độ
                </h5>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showProgress} 
                      onChange={(e) => { setShowProgress(e.target.checked); }} 
                      className="rounded border-border/40 size-3.5 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Hiển thị nhãn tiến độ dòng thời gian</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Filter Controls & Zoom Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs pt-1 border-t border-border/5">
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="number" 
                value={monthsInput} 
                onChange={(e) => { setMonthsInput(e.target.value); }} 
                className="w-12 h-8 rounded-md border border-border/40 px-2 text-center text-xs font-semibold focus:outline-none focus:border-primary bg-background"
                min="1"
                max="12"
              />
              <span className="text-muted-foreground font-medium">tháng từ</span>
              <select 
                value={monthInput} 
                onChange={(e) => { setMonthInput(parseInt(e.target.value)); }} 
                className="h-8 rounded-md border border-border/40 px-2 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
              >
                <option value={0}>Tháng một</option>
                <option value={1}>Tháng hai</option>
                <option value={2}>Tháng ba</option>
                <option value={3}>Tháng tư</option>
                <option value={4}>Tháng năm</option>
                <option value={5}>Tháng sáu</option>
                <option value={6}>Tháng bảy</option>
                <option value={7}>Tháng tám</option>
                <option value={8}>Tháng chín</option>
                <option value={9}>Tháng mười</option>
                <option value={10}>Tháng mười một</option>
                <option value={11}>Tháng mười hai</option>
              </select>
              <select 
                value={yearInput} 
                onChange={(e) => { setYearInput(parseInt(e.target.value)); }} 
                className="h-8 rounded-md border border-border/40 px-2 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>

              <Button 
                onClick={handleApplyFilters} 
                className="h-8 px-3 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                Áp dụng
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters} 
                className="h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Xóa
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleOpenSaveDialog} 
                className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-dashed border-border/40"
              >
                <Save className="size-3.5" />
                Save truy vấn riêng
              </Button>
            </div>

            {/* Right Zoom and Quick Navigate Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 border-r border-border/40 pr-4">
                <button 
                  onClick={handleZoomIn} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Phóng to ngày"
                >
                  <ZoomIn className="size-3.5" />
                  <span>Phóng to</span>
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button 
                  onClick={handleZoomOut} 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Thu nhỏ ngày"
                >
                  <ZoomOut className="size-3.5" />
                  <span>Thu nhỏ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { shiftTimelineByMonth(-1); }} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-normal flex items-center gap-0.5"
                >
                  <ChevronLeft className="size-3.5" />
                  {getMonthOffsetLabel(-1)}
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button 
                  onClick={() => { shiftTimelineByMonth(1); }} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-normal flex items-center gap-0.5"
                >
                  {getMonthOffsetLabel(1)}
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground px-1">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-center gap-2">
              <div 
                className="size-3 rounded" 
                style={{ backgroundColor: status.color || "hsl(var(--primary))" }} 
              />
              <span>{status.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-rose-600 animate-pulse" />
            <span>Trễ hạn (Overdue)</span>
          </div>
        </div>

        {/* Main Gantt Grid Container */}
        <div className="rounded-xl border border-border/40 shadow-sm overflow-hidden bg-background">
          <div className="grid grid-cols-12 min-w-[900px] divide-x divide-border/40">
            
            {/* Left Panel: Task & Assignee Details (Col span: 4) */}
            <div className="col-span-4 flex flex-col bg-muted/10">
              {/* Header */}
              <div className="h-16 border-b border-border/40 flex items-center px-4 bg-muted/20">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Công việc & Nhân sự
                </span>
              </div>
              {/* Rows */}
              <div className="flex flex-col">
                {treeTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Chưa có công việc nào khớp với bộ lọc
                  </div>
                ) : (
                  treeTasks.map((task: Task & { depth: number }) => (
                    <div key={task.id} className="h-16 flex items-center justify-between px-4 border-b border-border/40 hover:bg-muted/5 transition-colors">
                      <div 
                        className="flex flex-col min-w-0 pr-2"
                        style={{ paddingLeft: `${task.depth * 16}px` }}
                      >
                        <div className="flex items-center text-[11px] font-normal text-foreground">
                          {task.depth > 0 && (
                            <span className="text-muted-foreground/45 font-mono select-none mr-1.5 shrink-0">
                              └─
                            </span>
                          )}
                          <button
                            onClick={() => { setSelectedTaskForReview(task); }}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-normal shrink-0 mr-1"
                          >
                            {task.tracker ? task.tracker.charAt(0).toUpperCase() + task.tracker.slice(1) : "Task"} #{task?.id ? task.id.slice(-5) : "—"}
                          </button>
                          <span className="truncate text-foreground" title={task.title}>
                            :{" "}
                            <Link
                              to={`/project/task/${task.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer text-foreground"
                            >
                              {task.title}
                            </Link>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 pl-2">
                          {task.estimatedTime && showEstTime ? (
                            <div className="flex items-center gap-1 font-normal">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>{task.spentTimes?.reduce((s: number, st: TaskSpentTime) => s + st.hours, 0) || 0}h / {task.estimatedTime}h</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Assignee profile avatar */}
                      {showAssignee && (task.assignee ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 bg-secondary border border-border/40 py-0.5 px-2 rounded-full text-[10px] font-normal cursor-default shrink-0">
                                <User className="size-2.5 text-muted-foreground" />
                                <span className="max-w-[60px] truncate">{task.assignee.fullName.split(" ").pop()}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs rounded-xl">
                              <p className="font-semibold">{task.assignee.fullName}</p>
                              <p className="text-muted-foreground text-[10px]">{task.assignee.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic bg-secondary border border-dashed border-border/40 py-0.5 px-2 rounded-full shrink-0">
                          Chưa giao
                        </span>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Scrollable Grid Timeline (Col span: 8) */}
            <div className="col-span-8 overflow-x-auto">
              <div 
                style={{ width: `${timelineDays.length * dayWidth}px` }} 
                className="flex flex-col"
              >
                
                {/* Header: Months/Years and Days column labels */}
                <div className="h-16 flex flex-col border-b border-border/40 bg-muted/20">
                  {/* Month/Year Span Header Row */}
                  <div 
                    className="h-6 border-b border-border/20 grid text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none"
                    style={{ 
                      gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)`
                    }}
                  >
                    {monthSpans.map((span, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          gridColumnStart: span.startCol, 
                          gridColumnEnd: span.endCol 
                        }}
                        className="flex items-center justify-center h-full truncate px-1 text-center bg-muted/10 border-r border-border/20"
                        title={span.label}
                      >
                        {span.label}
                      </div>
                    ))}
                  </div>

                  {/* Days column labels */}
                  <div 
                    className="flex-1 grid"
                    style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)` }}
                  >
                    {timelineDays.map((day, idx) => {
                      const dayName = format(day, "EEEEE", { locale: vi })
                      const dayNum = format(day, "d")
                      const isWeekend = ["T7", "CN", "S", "Su"].includes(dayName) || day.getDay() === 0 || day.getDay() === 6
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col items-center justify-center border-r border-border/20 text-[10px] font-semibold py-0.5 h-full ${
                            isWeekend ? "bg-muted/30 text-rose-500/80" : "text-muted-foreground"
                          }`}
                        >
                          {dayWidth >= 20 && <span>{dayName}</span>}
                          <span className={`${dayWidth < 20 ? "text-[9px]" : "text-[11px]"} font-bold`}>{dayNum}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rows: Task bars display */}
                <div className="flex flex-col relative">
                  {treeTasks.map((task: Task) => {
                    const gridStyle = getTaskGridStyle(task)
                    const isOverdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date()
                    
                    // Check if it was completed early
                    let isCompletedEarly = false
                    let earlyCompletionRatio = 0
                    if (task.status === "done" && task.completedAt && task.startDate && task.dueDate) {
                      const taskStart = new Date(task.startDate)
                      const taskDue = new Date(task.dueDate)
                      const taskDone = new Date(task.completedAt)
                      if (taskDone < taskDue) {
                        isCompletedEarly = true
                        const totalDays = differenceInDays(taskDue, taskStart) + 1
                        const doneDays = differenceInDays(taskDone, taskStart) + 1
                        if (totalDays > 0) {
                          earlyCompletionRatio = Math.max(0, Math.min(1, doneDays / totalDays))
                        }
                      }
                    }

                    const matchedStatus = statuses.find(
                      (s) => s.id === task.statusId || s.name.toLowerCase() === task.status.toLowerCase()
                    )
                    const statusColor = matchedStatus?.color || "hsl(var(--primary))"
                    const isCompletedStatus = matchedStatus?.isCompleted === true || task.status === "done"

                    const getHexOpacity = (hex: string, opacityHex: string) => {
                      if (hex.startsWith("#")) {
                        return `${hex}${opacityHex}`
                      }
                      return hex
                    }

                    // Style configuration based on status & timeline rules
                    let containerStyle: React.CSSProperties = {
                      backgroundColor: getHexOpacity(statusColor, "15"),
                      borderColor: getHexOpacity(statusColor, "40"),
                      color: statusColor,
                    }
                    let progressStyle: React.CSSProperties = {
                      backgroundColor: statusColor,
                    }
                    let progressVal = task.progress

                    if (isCompletedStatus) {
                      if (isCompletedEarly) {
                        // Completed early: remaining part is slate (gray/saved time), completed portion is statusColor
                        containerStyle = {
                          backgroundColor: "rgba(100, 116, 139, 0.15)",
                          borderColor: "rgba(100, 116, 139, 0.3)",
                          color: "inherit",
                        }
                        progressStyle = {
                          backgroundColor: statusColor,
                        }
                        progressVal = Math.round(earlyCompletionRatio * 100)
                      } else {
                        // Completed on time / late: entire bar is solid status color
                        containerStyle = {
                          backgroundColor: statusColor,
                          borderColor: "transparent",
                          color: "hsl(var(--primary-foreground))",
                        }
                        progressStyle = {
                          backgroundColor: statusColor,
                        }
                        progressVal = 100
                      }
                    } else if (isOverdue) {
                      // Overdue: completed part is statusColor, remaining part is red/rose-600
                      containerStyle = {
                        backgroundColor: "hsl(var(--destructive))",
                        borderColor: "transparent",
                        color: "hsl(var(--destructive-foreground))",
                      }
                      progressStyle = {
                        backgroundColor: statusColor,
                      }
                    }

                    return (
                      <div 
                        key={task.id} 
                        className="h-16 relative grid items-center border-b border-border/40 hover:bg-muted/5 transition-colors"
                        style={{ gridTemplateColumns: `repeat(${timelineDays.length}, ${dayWidth}px)` }}
                      >
                        {/* Background Day Columns (for vertical grid lines and weekend colors) */}
                        {timelineDays.map((day, idx) => {
                          const dayName = format(day, "EEEEE", { locale: vi })
                          const isWeekend = ["T7", "CN", "S", "Su"].includes(dayName) || day.getDay() === 0 || day.getDay() === 6
                          return (
                            <div 
                              key={idx}
                              style={{ 
                                gridColumnStart: idx + 1, 
                                gridColumnEnd: idx + 2,
                                gridRowStart: 1,
                                gridRowEnd: 2
                              }}
                              className={`h-full border-r border-border/10 pointer-events-none ${
                                isWeekend ? "bg-muted/10" : ""
                              }`}
                            />
                          )
                        })}

                        {/* Due Date vertical indicator line */}
                        {(() => {
                          const dueDateCol = getDueDateCol(task.dueDate)
                          if (!dueDateCol) return null
                          return (
                            <div 
                              style={{ 
                                left: `${(dueDateCol - 1) * dayWidth + dayWidth / 2}px`,
                                gridRowStart: 1,
                                gridRowEnd: 2
                              }}
                              className="absolute top-0 h-full w-0 z-20 pointer-events-none overflow-visible"
                              title={`Hạn hoàn thành: ${task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : ""}`}
                            >
                              {/* Sleek vertical line starting below the dot */}
                              <div className="absolute top-4 left-0 h-[calc(100%-16px)] w-[1.5px] bg-rose-500/60" />
                              
                              {/* Outer expanding pulse ring */}
                              <div className="absolute top-1.5 -left-1.5 size-3.5 rounded-full bg-rose-500/40 animate-ping" />

                              {/* Minimalist inner dot badge */}
                              <div className="absolute top-2 -left-1 size-2 rounded-full bg-rose-500 border border-white dark:border-background shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                            </div>
                          )
                        })()}

                        {/* Task Bar */}
                        {gridStyle ? (
                          <div 
                            style={{
                              ...gridStyle,
                              gridRowStart: 1,
                              gridRowEnd: 2
                            }} 
                            className="px-1 z-10 h-full flex items-center overflow-visible relative"
                          >
                            <div className="relative w-full flex items-center overflow-visible">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className="h-7 w-full border rounded-full px-2.5 flex items-center justify-between text-[10px] font-medium shadow-sm select-none relative overflow-hidden group cursor-pointer"
                                      style={containerStyle}
                                      onDoubleClick={() => { setSelectedTaskForReview(task); }}
                                    >
                                      {/* Progress bar inside task bar */}
                                      {showProgress && (
                                        <div 
                                          className="absolute top-0 left-0 h-full transition-all duration-300"
                                          style={{ ...progressStyle, width: `${progressVal}%` }}
                                        />
                                      )}

                                      <span className="truncate pr-1 z-10 text-[10px] font-semibold">{task.title}</span>

                                      {/* Right tools (icons only) */}
                                      <div className="flex items-center gap-1 shrink-0 z-10">
                                        {task.status === "in_review" && (
                                          <FileText className="size-3 text-white/90" />
                                        )}
                                        {task.status === "done" && (
                                          <CheckCircle2 className="size-3 text-white" />
                                        )}
                                        {isOverdue && (
                                          <Clock className="size-3 text-white animate-pulse" />
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs space-y-1 rounded-xl p-3 max-w-[280px]">
                                    <p className="font-bold">{task.title}</p>
                                    <p className="text-muted-foreground font-medium text-[10px]">
                                      Lịch: {task.startDate ? format(new Date(task.startDate), "dd/MM/yyyy") : "?"} - {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "?"}
                                    </p>
                                    <p className="font-medium text-[10px]">
                                      Tiến độ: {task.progress}% ({task.status === "done" && isCompletedEarly ? "hoàn thành sớm" : task.status})
                                    </p>
                                    {task.status === "done" && isCompletedEarly && task.completedAt && (
                                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                        Xong ngày: {format(new Date(task.completedAt), "dd/MM/yyyy")}
                                      </p>
                                    )}
                                    {isOverdue && (
                                      <p className="text-rose-500 font-bold text-[10px]">Cảnh báo: Đã quá hạn hoàn thành!</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Status and Progress label next to the bar removed per user request */}
                            </div>
                          </div>
                        ) : (
                          // If task dates are not inside current timeline viewport
                          <div className="absolute left-4 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            Ngoài khoảng dòng thời gian hiển thị
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sidebar for Quick Queries */}
      {!isSidebarExpanded && (
        <button
          onClick={() => { setIsSidebarExpanded(true); }}
          className="p-2.5 border border-border/40 bg-background rounded-full shadow-sm hover:bg-muted transition-colors shrink-0 font-bold text-xs flex items-center justify-center hover:scale-102"
          title="Mở rộng truy vấn riêng"
        >
          «
        </button>
      )}

      {/* Expanded Sidebar */}
      {isSidebarExpanded && (
        <div className="w-56 shrink-0 bg-background p-4 rounded-xl border border-border/40 shadow-sm space-y-4 relative transition-all duration-200">
          <button
            onClick={() => { setIsSidebarExpanded(false); }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs font-bold"
            title="Thu nhỏ truy vấn riêng"
          >
            »
          </button>
          
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/10 pb-2">
            Truy vấn riêng
          </h4>
          
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => { handleQuickQuery(QUICK_QUERY_TYPE.ASSIGNED_TO_ME); }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Issues assigned to me
              </button>
            </li>
            <li>
              <button
                onClick={() => { handleQuickQuery(QUICK_QUERY_TYPE.REPORTED_ISSUES); }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Reported issues
              </button>
            </li>
            <li>
              <button
                onClick={() => { handleQuickQuery(QUICK_QUERY_TYPE.UPDATED_ISSUES); }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-left font-medium block w-full"
              >
                Updated issues
              </button>
            </li>
            <li>
              <button
                onClick={() => { handleQuickQuery(QUICK_QUERY_TYPE.WATCHED_ISSUES); }}
                className="text-rose-600 dark:text-rose-400 hover:underline text-left font-medium block w-full"
              >
                Watched issues
              </button>
            </li>

            {savedQueries && savedQueries.length > 0 && (
              <>
                <li className="border-t border-border/10 my-2 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold select-none">
                  Truy vấn đã lưu
                </li>
                {savedQueries.map((q: CustomQuery) => (
                  <li key={q.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => { applySavedQuery(q); }}
                      className="text-sky-600 dark:text-sky-400 hover:underline text-left font-medium block truncate max-w-[150px]"
                      title={q.name}
                    >
                      {q.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Bạn chắc chắn muốn xóa truy vấn "${q.name}"?`)) {
                          deleteQueryMutation.mutate(q.id)
                        }
                      }}
                      className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0"
                      title="Xóa truy vấn này"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}

      {/* Review & Deliverable submission Modal */}
      {selectedTaskForReview && (
        <TaskReviewModal
          isOpen={!!selectedTaskForReview}
          onOpenChange={(open) => {
            if (!open) setSelectedTaskForReview(null)
          }}
          task={selectedTaskForReview}
          projectId={projectId}
          isLeader={isLeader}
          isAdminOrGM={isAdminOrGM}
        />
      )}

      {/* Save Custom Query Dialog */}
      <Dialog open={isSaveQueryOpen} onOpenChange={setIsSaveQueryOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Save className="size-4 text-primary" />
              Lưu truy vấn riêng
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitSaveQuery} className="space-y-4 pt-2">
            {/* Top inputs block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="query-name" className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                  Tên truy vấn <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="query-name"
                  value={newQueryName}
                  onChange={(e) => { setNewQueryName(e.target.value); }}
                  placeholder="Ví dụ: Công việc mở tuần này..."
                  className="h-9 text-xs rounded-lg border-border"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="query-desc" className="text-xs font-semibold text-foreground">
                  Mô tả
                </Label>
                <Input
                  id="query-desc"
                  value={newQueryDesc}
                  onChange={(e) => { setNewQueryDesc(e.target.value); }}
                  placeholder="Mô tả mục đích của truy vấn..."
                  className="h-9 text-xs rounded-lg border-border"
                />
              </div>
            </div>

            {/* Checkbox For All Projects */}
            <div className="flex items-center gap-2">
              <input
                id="query-for-all"
                type="checkbox"
                checked={newQueryForAll}
                onChange={(e) => { setNewQueryForAll(e.target.checked); }}
                className="rounded border-border size-4"
              />
              <Label htmlFor="query-for-all" className="text-xs font-semibold cursor-pointer">
                Cho mọi dự án
              </Label>
            </div>

            {/* Options section */}
            <div className="border-t border-border pt-3 space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tùy chọn</span>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="query-default-cols"
                    type="checkbox"
                    checked={newQueryDefaultCols}
                    onChange={(e) => {
                      setNewQueryDefaultCols(e.target.checked)
                      if (e.target.checked) {
                        setNewQuerySelectedCols(["estimatedTime", "assignee", "progress"])
                      }
                    }}
                    className="rounded border-border size-4"
                  />
                  <Label htmlFor="query-default-cols" className="text-xs font-semibold cursor-pointer">
                    Cột mặc định
                  </Label>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold pl-1">
                  <span className="text-muted-foreground">Hiện:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQueryDefaultCols ? true : newQuerySelectedCols.includes("estimatedTime")}
                      disabled={newQueryDefaultCols}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewQuerySelectedCols(prev => [...prev, "estimatedTime"])
                        } else {
                          setNewQuerySelectedCols(prev => prev.filter(k => k !== "estimatedTime"))
                        }
                      }}
                      className="rounded border-border size-3.5"
                    />
                    Ước lượng thời gian & log time (Est)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQueryDefaultCols ? true : newQuerySelectedCols.includes("assignee")}
                      disabled={newQueryDefaultCols}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewQuerySelectedCols(prev => [...prev, "assignee"])
                        } else {
                          setNewQuerySelectedCols(prev => prev.filter(k => k !== "assignee"))
                        }
                      }}
                      className="rounded border-border size-3.5"
                    />
                    Người thực hiện (Assignee)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQueryDefaultCols ? true : newQuerySelectedCols.includes("progress")}
                      disabled={newQueryDefaultCols}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewQuerySelectedCols(prev => [...prev, "progress"])
                        } else {
                          setNewQuerySelectedCols(prev => prev.filter(k => k !== "progress"))
                        }
                      }}
                      className="rounded border-border size-3.5"
                    />
                    Tiến độ (Progress)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!newQueryDefaultCols}
                      onChange={(e) => {
                        setNewQueryDefaultCols(!e.target.checked)
                        if (!e.target.checked) {
                          setNewQuerySelectedCols(["estimatedTime", "assignee", "progress"])
                        }
                      }}
                      className="rounded border-border size-3.5"
                    />
                    Các cột được lựa chọn
                  </label>
                </div>
              </div>
            </div>

            {/* Filters section */}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bộ lọc</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thêm lọc:</span>
                  <Select
                    value=""
                    onValueChange={(filterKey) => {
                      setNewQueryFilterKeys(prev => [...prev, filterKey])
                      setNewQueryFilters(prev => ({
                        ...prev,
                        [filterKey]: {
                          enabled: true,
                          operator: getDefaultOperator(filterKey),
                          value: getDefaultValue(filterKey)
                        }
                      }))
                    }}
                  >
                    <SelectTrigger className="w-36 h-7 text-[10px] border-border rounded-md bg-background">
                      <SelectValue placeholder="Chọn bộ lọc..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-popover max-h-60 overflow-y-auto">
                      {/* Flat filters (with no group) */}
                      {Object.entries(filterDefinitions)
                        .filter(([k]) => !newQueryFilterKeys.includes(k))
                        .map(([k, def]) => (
                          <SelectItem key={k} value={k} className="text-xs">{def.label}</SelectItem>
                        ))
                      }
                      {/* Grouped filters */}
                      {Array.from(new Set(Object.values(filterDefinitions).map(d => d.group).filter(Boolean))).map(group => (
                        <div key={group} className="space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/10 mt-1 first:mt-0">
                            {group}
                          </div>
                          {Object.entries(filterDefinitions)
                            .filter(([k, def]) => def.group === group && !newQueryFilterKeys.includes(k))
                            .map(([k, def]) => (
                              <SelectItem key={k} value={k} className="text-xs pl-4">
                                {def.label}
                              </SelectItem>
                            ))
                          }
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {newQueryFilterKeys.map((key) => {
                  const filter = newQueryFilters[key] as { enabled: boolean; operator: string; value: string } | undefined
                  if (filter === undefined) return null
                  const def = Reflect.get(filterDefinitions, key) as { label: string; type: string; group: string } | undefined
                  
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-2 md:gap-4 py-1">
                      {/* Checkbox & Label */}
                      <label className="flex items-center gap-2 cursor-pointer select-none font-semibold min-w-[120px]">
                        <input 
                          type="checkbox" 
                          checked={filter.enabled} 
                          onChange={(e) => {
                            setNewQueryFilters(prev => ({
                              ...prev,
                              [key]: { ...prev[key], enabled: e.target.checked }
                            }))
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
                          
                          // Initialize default value when changing operators if needed
                          if (def !== undefined) {
                            if (def.type === GANTT_FILTER_TYPE.EMPLOYEE && (op === GANTT_FILTER_OPERATOR.LA || op === GANTT_FILTER_OPERATOR.KHONG_LA) && !val) {
                              val = assignees[0]?.id || ""
                            } else if (key === GANTT_FILTER_KEY.STATUS && (op === GANTT_FILTER_OPERATOR.LA || op === GANTT_FILTER_OPERATOR.KHONG_LA) && !val) {
                              val = TASK_STATUS.TODO
                            } else if (def.type === GANTT_FILTER_TYPE.PROGRESS && !val) {
                              val = "50"
                            } else if (def.type === GANTT_FILTER_TYPE.NUMBER && !val) {
                              val = "0"
                            }
                          }

                          setNewQueryFilters(prev => ({
                            ...prev,
                            [key]: { ...prev[key], operator: op, value: val }
                          }))
                        }}
                        className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold focus:outline-none focus:border-primary bg-background cursor-pointer"
                      >
                        {/* Render operators based on type */}
                        {(() => {
                          if (def === undefined) return <option value={GANTT_FILTER_OPERATOR.IS}>là</option>

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
                          if (def.type === GANTT_FILTER_TYPE.NUMBER || def.type === GANTT_FILTER_TYPE.PROGRESS) {
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

                      {/* Value Select (Conditional) */}
                      {renderValueSelector(key, filter.operator, filter.value, (val) => {
                        setNewQueryFilters(prev => ({
                          ...prev,
                          [key]: { ...prev[key], value: val }
                        }))
                      })}

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setNewQueryFilterKeys(prev => prev.filter(k => k !== key))
                        }}
                        className="text-muted-foreground hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-muted shrink-0 ml-2"
                        title="Xóa bộ lọc"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Columns selection section */}
            {!newQueryDefaultCols && (
              <div className="space-y-2 border-t border-border pt-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cột</span>
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Available */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Các cột có sẵn</label>
                    <select
                      multiple
                      size={3}
                      value={availSelectedKey ? [availSelectedKey] : []}
                      onChange={(e) => { setAvailSelectedKey(e.target.value); }}
                      className="w-full text-xs p-1.5 border border-border rounded-md h-24 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {GANTT_AVAILABLE_COLUMNS.filter(col => !newQuerySelectedCols.includes(col.key)).map(col => (
                        <option key={col.key} value={col.key} className="p-0.5 rounded hover:bg-muted">
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transfer buttons */}
                  <div className="col-span-2 flex flex-col gap-2 items-center justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!availSelectedKey}
                      onClick={() => {
                        if (availSelectedKey) {
                          setNewQuerySelectedCols(prev => [...prev, availSelectedKey])
                          setAvailSelectedKey(null)
                        }
                      }}
                      className="rounded-md"
                    >
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => prev.filter(k => k !== selSelectedKey))
                          setSelSelectedKey(null)
                        }
                      }}
                      className="rounded-md"
                    >
                      <ArrowLeft className="size-3.5" />
                    </Button>
                  </div>

                  {/* Selected */}
                  <div className="col-span-4 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Các cột được lựa chọn</label>
                    <select
                      multiple
                      size={3}
                      value={selSelectedKey ? [selSelectedKey] : []}
                      onChange={(e) => { setSelSelectedKey(e.target.value); }}
                      className="w-full text-xs p-1.5 border border-border rounded-md h-24 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {newQuerySelectedCols.map(colKey => {
                        const col = GANTT_AVAILABLE_COLUMNS.find(c => c.key === colKey)
                        return (
                          <option key={colKey} value={colKey} className="p-0.5 rounded hover:bg-muted">
                            {col ? col.label : colKey}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Reorder buttons */}
                  <div className="col-span-1 flex flex-col gap-1.5 items-center justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === 0}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const filtered = prev.filter(k => k !== selSelectedKey)
                            return [selSelectedKey, ...filtered]
                          })
                        }
                      }}
                      title="Đưa lên đầu"
                      className="rounded-md"
                    >
                      <ChevronsUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === newQuerySelectedCols.length - 1}
                      onClick={() => {
                        if (selSelectedKey) {
                          setNewQuerySelectedCols(prev => {
                            const idx = prev.indexOf(selSelectedKey)
                            if (idx === -1 || idx === prev.length - 1) return prev
                            const next = [...prev]
                            next[idx] = next[idx + 1]
                            next[idx + 1] = selSelectedKey
                            return next
                          })
                        }
                      }}
                      title="Đưa xuống dưới"
                      className="rounded-md"
                    >
                      <ChevronsDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsSaveQueryOpen(false) }}
                className="h-9 text-xs rounded-full"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!newQueryName.trim() || saveQueryMutation.isPending}
                className="h-9 text-xs rounded-full"
              >
                {saveQueryMutation.isPending ? "Đang lưu..." : "Lưu truy vấn"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

