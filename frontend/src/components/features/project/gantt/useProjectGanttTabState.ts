import { useProjectGantt } from "@/hooks/project/use-project-gantt"
import type { HoveredTaskState } from "@/types/gantt.types"
import type { Project } from "@/types/project.types"

import { useMemo, useState } from "react"

export interface UseProjectGanttTabStateProps {
  projectId: string
  project: Project
}

/** Custom hook managing view mode toggles and layout expansion state for the Gantt tab. */
export function useProjectGanttTabState({ projectId, project }: UseProjectGanttTabStateProps) {
  const [hoveredTask, setHoveredTask] = useState<HoveredTaskState | null>(null)

  const gantt = useProjectGantt({ projectId, project })

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const pYear = project?.startDate ? new Date(project.startDate).getFullYear() : currentYear
    const startYear = Math.min(pYear, currentYear - 2, gantt.yearInput)
    const endYear = Math.max(pYear + 3, currentYear + 3, gantt.yearInput + 1)
    const years: number[] = []
    for (let y = startYear; y <= endYear; y++) {
      years.push(y)
    }
    return years
  }, [project, gantt.yearInput])

  const [isSaveQueryOpen, setIsSaveQueryOpen] = useState(false)
  const [newQueryName, setNewQueryName] = useState("")
  const [newQueryDesc, setNewQueryDesc] = useState("")
  const [newQueryForAll, setNewQueryForAll] = useState(false)
  const [newQueryDefaultCols, setNewQueryDefaultCols] = useState(true)
  const [newQuerySelectedCols, setNewQuerySelectedCols] = useState<string[]>([
    "estimatedTime",
    "assignee",
    "progress",
  ])
  const [availSelectedKey, setAvailSelectedKey] = useState<string | null>(null)
  const [selSelectedKey, setSelSelectedKey] = useState<string | null>(null)
  const [newQueryFilters, setNewQueryFilters] = useState<
    Record<string, { enabled: boolean; operator: string; value: string }>
  >({})
  const [newQueryFilterKeys, setNewQueryFilterKeys] = useState<string[]>([])

  const handleOpenSaveDialog = () => {
    setNewQueryName("")
    setNewQueryDesc("")
    setNewQueryForAll(false)

    const cols: string[] = []
    if (gantt.showEstTime) cols.push("estimatedTime")
    if (gantt.showAssignee) cols.push("assignee")
    if (gantt.showProgress) cols.push("progress")
    setNewQuerySelectedCols(cols)
    setNewQueryDefaultCols(gantt.showEstTime && gantt.showAssignee && gantt.showProgress)

    const filtersCopy: Record<string, { enabled: boolean; operator: string; value: string }> = {}
    gantt.activeFilterKeys.forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(gantt.filterStates, k)) return
      const state = Reflect.get(gantt.filterStates, k) as
        { enabled: boolean; operator: string; value: string } | undefined
      if (state) {
        Reflect.set(filtersCopy, k, { ...state })
      }
    })
    setNewQueryFilters(filtersCopy)
    setNewQueryFilterKeys([...gantt.activeFilterKeys])

    setIsSaveQueryOpen(true)
  }

  const handleSubmitSaveQuery = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueryName.trim()) return

    const finalFilters: Record<string, { enabled: boolean; operator: string; value: string }> = {}
    const finalKeys: string[] = []

    newQueryFilterKeys.forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(newQueryFilters, k)) return
      const filter = Reflect.get(newQueryFilters, k) as
        { enabled: boolean; operator: string; value: string } | undefined
      if (filter?.enabled) {
        finalKeys.push(k)
        Reflect.set(finalFilters, k, {
          enabled: true,
          operator: filter.operator,
          value: filter.value,
        })
      }
    })

    const finalOptions = {
      showEstTime: newQueryDefaultCols ? true : newQuerySelectedCols.includes("estimatedTime"),
      showAssignee: newQueryDefaultCols ? true : newQuerySelectedCols.includes("assignee"),
      showProgress: newQueryDefaultCols ? true : newQuerySelectedCols.includes("progress"),
    }

    const queryDataObj = {
      activeFilterKeys: finalKeys,
      filterStates: finalFilters,
      options: finalOptions,
    }

    gantt.handleSaveQuery({
      name: newQueryName.trim(),
      projectId: newQueryForAll ? null : projectId,
      queryData: JSON.stringify(queryDataObj),
    })

    setIsSaveQueryOpen(false)
  }

  return {
    ...gantt,
    hoveredTask,
    setHoveredTask,
    availableYears,
    isSaveQueryOpen,
    setIsSaveQueryOpen,
    newQueryName,
    setNewQueryName,
    newQueryDesc,
    setNewQueryDesc,
    newQueryForAll,
    setNewQueryForAll,
    newQueryDefaultCols,
    setNewQueryDefaultCols,
    newQuerySelectedCols,
    setNewQuerySelectedCols,
    availSelectedKey,
    setAvailSelectedKey,
    selSelectedKey,
    setSelSelectedKey,
    newQueryFilters,
    setNewQueryFilters,
    newQueryFilterKeys,
    setNewQueryFilterKeys,
    handleOpenSaveDialog,
    handleSubmitSaveQuery,
  }
}
