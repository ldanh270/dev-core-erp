import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { SYSTEM_CONFIG } from "@/config/system.config"
import {
  useDeleteWeeklyScheduleTemplate,
  useWeeklyScheduleTemplates,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import { usePermission } from "@/hooks/use-permission"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { useCallback, useMemo, useState } from "react"

import { toast } from "sonner"

const { WEEKLY_SCHEDULES: WEEKLY_SCHEDULE_MSGS } = ATTENDANCE_MESSAGES

/**
 * Encapsulates WeeklySchedules state, search filters, pagination, and template mutations.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useWeeklySchedulesManagement() {
  const { hasPermission } = usePermission()
  const canReadSchedules = hasPermission("attendance.weekly_schedule.read")

  const { data: templates = [], isLoading } = useWeeklyScheduleTemplates()
  const deleteMutation = useDeleteWeeklyScheduleTemplate()

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IWeeklyScheduleTemplate | null>(null)
  const [applying, setApplying] = useState<IWeeklyScheduleTemplate | null>(null)

  const handleCreate = useCallback(() => {
    setEditing(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((template: IWeeklyScheduleTemplate) => {
    setEditing(template)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm(WEEKLY_SCHEDULE_MSGS.DELETE_CONFIRM)) return
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success(WEEKLY_SCHEDULE_MSGS.DELETE_SUCCESS)
        },
      })
    },
    [deleteMutation],
  )

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const filteredTemplates = useMemo(() => {
    if (!canReadSchedules) return []
    if (!searchQuery.trim()) return templates
    const query = searchQuery.toLowerCase().trim()
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query)),
    )
  }, [canReadSchedules, templates, searchQuery])

  const totalItems = filteredTemplates.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTemplates.slice(startIndex, startIndex + pageSize)
  }, [filteredTemplates, currentPage, pageSize])

  return {
    templates: paginatedData,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    dialogOpen,
    setDialogOpen,
    editing,
    applying,
    setApplying,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSearch,
  }
}
