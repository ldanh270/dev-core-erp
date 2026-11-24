import {
  type IAttendanceStatus,
} from "@/config/entities/attendance.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useAttendanceRecords } from "@/hooks/attendance/use-attendance"
import { attendanceApi } from "@/lib/api/attendance.api"
import type { IAttendanceRecord } from "@/types/attendance.types"
import { getCurrentMonthRange } from "@/utils/attendance/get-current-month-range"

import { useCallback, useMemo, useState } from "react"

import dayjs from "dayjs"

export interface SelectedEmployeeSummary {
  id: string
  fullName: string
  email?: string
}

export function toSelectedEmployee(record: IAttendanceRecord): SelectedEmployeeSummary {
  return {
    id: record.employeeId,
    fullName: record.employee?.fullName ?? record.employeeId,
    email: record.employee?.email,
  }
}

/**
 * Custom hook encapsulating Admin Attendance Dashboard data fetching, stats, and export logic.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useAdminAttendanceDashboard() {
  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate)
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate)
  const [statusFilter, setStatusFilter] = useState<IAttendanceStatus | "all">("all")
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployeeSummary | null>(null)

  const query = useMemo(
    () => ({
      startDate,
      endDate,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [startDate, endDate, statusFilter],
  )

  const { data: records, isLoading, isError } = useAttendanceRecords(query)

  const today = dayjs()
  const todayRecords = records?.filter((r) => dayjs(r.date).isSame(today, "day")) ?? []

  const presentToday = todayRecords.filter((r) => r.checkInAt).length
  const lateToday = todayRecords.filter((r) => r.status === "late").length
  const absentToday = todayRecords.filter((r) => r.status === "absent").length
  const openCheckoutToday = todayRecords.filter((r) => r.checkInAt && !r.checkOutAt)

  const attentionRecords = useMemo(() => {
    return (
      records?.filter(
        (record) =>
          (record.checkInAt && !record.checkOutAt) ||
          record.status === "late" ||
          record.status === "early_leave" ||
          record.status === "overtime" ||
          record.earlyLeaveMinutes > 0 ||
          record.overtimeMinutes > 0,
      ) ?? []
    )
  }, [records])

  const handleExport = useCallback(async () => {
    const url = attendanceApi.exportCsv({
      startDate,
      endDate,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    })

    try {
      const token = localStorage.getItem(SYSTEM_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", `attendance_export_${startDate}_to_${endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      // Handle error gracefully
    }
  }, [startDate, endDate, statusFilter])

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusFilter,
    setStatusFilter,
    selectedEmployee,
    setSelectedEmployee,
    records,
    isLoading,
    isError,
    presentToday,
    lateToday,
    absentToday,
    openCheckoutToday,
    attentionRecords,
    handleExport,
  }
}
