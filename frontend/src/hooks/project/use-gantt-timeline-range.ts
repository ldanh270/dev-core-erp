import type { Project } from "@/types/project.types"
import type { Task } from "@/types/task.types"

import { useEffect, useMemo, useState } from "react"

import { addDays, differenceInDays, eachDayOfInterval, format } from "date-fns"

import {
  DEFAULT_MONTHS_RANGE,
  DEFAULT_MONTHS_RANGE_STRING,
} from '@/constants/gantt.constants'

interface UseGanttTimelineRangeProps {
  project: Project
  tasks: Task[]
}

/**
 * Hook calculating timeline interval, date spans, zoom, and scrolling navigation for Gantt charts.
 */
export function useGanttTimelineRange({ project, tasks }: UseGanttTimelineRangeProps) {
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    if (project.startDate) {
      return new Date(project.startDate)
    }
    return new Date()
  })

  const [timelineEnd, setTimelineEnd] = useState<Date>(() => {
    const start = project.startDate ? new Date(project.startDate) : new Date()
    return addDays(start, DEFAULT_MONTHS_RANGE * 30 - 1)
  })

  const [hasInitializedTimeline, setHasInitializedTimeline] = useState(false)
  const [monthsInput, setMonthsInput] = useState(DEFAULT_MONTHS_RANGE_STRING)
  const [monthInput, setMonthInput] = useState<number>(() => timelineStart.getMonth())
  const [yearInput, setYearInput] = useState<number>(() => timelineStart.getFullYear())
  const [monthsRange, setMonthsRange] = useState(DEFAULT_MONTHS_RANGE)
  const [dayWidth, setDayWidth] = useState(28)

  useEffect(() => {
    if (tasks && tasks.length > 0 && !hasInitializedTimeline) {
      let minStart: Date | null = null
      let maxEnd: Date | null = null

      for (const t of tasks) {
        if (t.startDate) {
          const d = new Date(t.startDate)
          if (!minStart || d.getTime() < minStart.getTime()) minStart = d
        }

        const dates: Date[] = []
        if (t.updatedAt) dates.push(new Date(t.updatedAt))
        if (t.completedAt) dates.push(new Date(t.completedAt))
        if (t.dueDate) dates.push(new Date(t.dueDate))

        for (const d of dates) {
          if (!maxEnd || d.getTime() > maxEnd.getTime()) maxEnd = d
        }
      }

      if (minStart) {
        setTimeout(() => {
          setTimelineStart(minStart)
          setMonthInput(minStart.getMonth())
          setYearInput(minStart.getFullYear())

          if (maxEnd) {
            const bufferedEnd = addDays(maxEnd, 2)
            setTimelineEnd(bufferedEnd)
            const days = differenceInDays(bufferedEnd, minStart) + 1
            const months = Math.max(1, Math.ceil(days / 30))
            setMonthsInput(months.toString())
            setMonthsRange(months)
          }
          setHasInitializedTimeline(true)
        }, 0)
      }
    }
  }, [tasks, hasInitializedTimeline])

  const timelineDays = useMemo(() => {
    const start = timelineStart
    const end = timelineEnd < timelineStart ? timelineStart : timelineEnd
    const daysInterval = eachDayOfInterval({ start, end })
    return daysInterval.slice(0, 180)
  }, [timelineStart, timelineEnd])

  const monthSpans = useMemo(() => {
    if (timelineDays.length === 0) return []
    const spans: { label: string; colSpan: number; startCol: number; endCol: number }[] = []

    let currentLabel = format(timelineDays[0], "yyyy-M")
    let currentCount = 0
    let startIndex = 1

    timelineDays.forEach((day, index) => {
      const label = format(day, "yyyy-M")
      if (label === currentLabel) {
        currentCount++
      } else {
        spans.push({
          label: currentLabel,
          colSpan: currentCount,
          startCol: startIndex,
          endCol: startIndex + currentCount,
        })
        currentLabel = label
        startIndex = index + 1
        currentCount = 1
      }
    })

    if (currentCount > 0) {
      spans.push({
        label: currentLabel,
        colSpan: currentCount,
        startCol: startIndex,
        endCol: startIndex + currentCount,
      })
    }

    return spans
  }, [timelineDays])

  const shiftTimeline = (days: number) => {
    setTimelineStart((prev) => addDays(prev, days))
    setTimelineEnd((prev) => addDays(prev, days))
  }

  const resetTimelineToProjectStart = () => {
    const start = project.startDate ? new Date(project.startDate) : new Date()
    const duration = differenceInDays(timelineEnd, timelineStart)
    setTimelineStart(start)
    setTimelineEnd(addDays(start, duration))
  }

  const shiftTimelineByMonth = (months: number) => {
    setTimelineStart((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + months, 1)
      setMonthInput(newDate.getMonth())
      setYearInput(newDate.getFullYear())
      const duration = differenceInDays(timelineEnd, prev)
      setTimelineEnd(addDays(newDate, duration))
      return newDate
    })
  }

  const getMonthOffsetLabel = (offset: number) => {
    const d = new Date(timelineStart.getFullYear(), timelineStart.getMonth() + offset, 1)
    const months = [
      "Tháng một",
      "Tháng hai",
      "Tháng ba",
      "Tháng tư",
      "Tháng năm",
      "Tháng sáu",
      "Tháng bảy",
      "Tháng tám",
      "Tháng chín",
      "Tháng mười",
      "Tháng mười một",
      "Tháng mười hai",
    ]
    return months[d.getMonth()]
  }

  const handleZoomIn = () => {
    setDayWidth((prev) => Math.min(prev + 4, 48))
  }

  const handleZoomOut = () => {
    setDayWidth((prev) => Math.max(prev - 4, 16))
  }

  return {
    timelineStart,
    setTimelineStart,
    timelineEnd,
    setTimelineEnd,
    monthsInput,
    setMonthsInput,
    monthInput,
    setMonthInput,
    yearInput,
    setYearInput,
    monthsRange,
    setMonthsRange,
    dayWidth,
    timelineDays,
    monthSpans,
    shiftTimeline,
    resetTimelineToProjectStart,
    shiftTimelineByMonth,
    getMonthOffsetLabel,
    handleZoomIn,
    handleZoomOut,
  }
}


