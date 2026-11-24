import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useDeleteShift, useShifts } from "@/hooks/attendance/use-shifts"
import type { IWorkingShift } from "@/types/attendance.types"

import { useCallback, useMemo, useState } from "react"

const { SHIFT_MANAGEMENT } = ATTENDANCE_MESSAGES

/**
 * Encapsulates ShiftManagement state, search filtering, pagination, and modal toggles.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useShiftManagement() {
  const { data: shifts = [], isLoading } = useShifts()
  const deleteMutation = useDeleteShift()

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<IWorkingShift | null>(null)

  const handleCreate = useCallback(() => {
    setEditing(null)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback((shift: IWorkingShift) => {
    setEditing(shift)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm(SHIFT_MANAGEMENT.DELETE_CONFIRM)) return
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts
    const query = searchQuery.toLowerCase().trim()
    return shifts.filter((shift) => shift.name.toLowerCase().includes(query))
  }, [shifts, searchQuery])

  const totalItems = filteredShifts.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredShifts.slice(startIndex, startIndex + pageSize)
  }, [filteredShifts, currentPage, pageSize])

  return {
    shifts: paginatedData,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sheetOpen,
    setSheetOpen,
    editing,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSearch,
  }
}
