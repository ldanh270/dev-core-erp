import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { ATTENDANCE_KEY } from "@/hooks/attendance/use-attendance"
import { attendanceApi, schedulesApi } from "@/lib/api/attendance.api"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/store/auth-store"
import { addDays } from "@/utils/attendance/add-days"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekStart } from "@/utils/attendance/get-week-start"
import { mapPlannedWeekToScheduleDays } from "@/utils/attendance/map-planned-week-to-schedule-days.util"
import { resolveScheduleDay } from "@/utils/attendance/resolve-schedule-day"
import {
  buildTodayShiftInfo,
  GEOLOCATION_TIMEOUT_MS,
  getCurrentScannerLocation,
  getScannerApiErrorMessage,
  persistScannerLocation,
  readCachedScannerLocation,
  resolveNextScanAction,
  type ScanAction,
  type TodayShiftInfo,
} from "@/utils/attendance/virtual-scanner.utils"

import { useEffect, useMemo, useState } from "react"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useVirtualScanner(): {
  user: User | null
  currentTime: Date
  location: { lat: number; lng: number } | null
  locating: boolean
  isProcessing: boolean
  nextAction: ScanAction
  nextActionLabel: string
  todayShift: TodayShiftInfo | null
  canScan: boolean
  scanDisabledLabel: string | null
  isShiftLoading: boolean
  handleScan: () => Promise<void>
} {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(() =>
    readCachedScannerLocation(),
  )
  const [locating, setLocating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const today = formatDateParam(currentTime)
  const yesterday = formatDateParam(addDays(currentTime, -1))
  const weekStartIso = formatDateParam(getWeekStart(currentTime))
  const { data: plannedWeek, isLoading: isPlannedWeekLoading } = useQuery({
    queryKey: ["my-planned-week", weekStartIso],
    queryFn: () => schedulesApi.getMyPlannedWeek(weekStartIso),
    enabled: Boolean(user),
  })
  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["my-schedule", today],
    queryFn: () => schedulesApi.getMy(today),
    enabled: Boolean(user),
  })
  const { data: records, isLoading: isRecordsLoading } = useQuery({
    queryKey: [...ATTENDANCE_KEY, "scanner", yesterday, today],
    queryFn: () =>
      attendanceApi.getRecords({ startDate: yesterday, endDate: today, personalOnly: true }),
    enabled: Boolean(user),
  })
  const todayShift = useMemo(() => {
    // Prefer admin-generated planned week because PT assigned shifts live there first.
    // Weekly schedule is only a fallback for regular full-time template shifts.
    const plannedDay = mapPlannedWeekToScheduleDays(plannedWeek).get(currentTime.getDay())
    if (plannedDay?.shift) {
      return buildTodayShiftInfo(plannedDay.shift)
    }

    const scheduleDay = resolveScheduleDay(schedule, currentTime)
    return buildTodayShiftInfo(scheduleDay?.shift)
  }, [currentTime, plannedWeek, schedule])
  const nextAction = resolveNextScanAction(records)
  const nextActionLabel =
    nextAction === "check_in"
      ? ATTENDANCE_MESSAGES.SCANNER.CHECK_IN_LABEL
      : ATTENDANCE_MESSAGES.SCANNER.CHECK_OUT_LABEL
  // Checkout remains enabled even if today's shift cannot be resolved, because the open
  // record already proves the employee is inside a valid attendance session.
  const canScan = Boolean(todayShift) || nextAction === "check_out"
  const scanDisabledLabel = canScan ? null : ATTENDANCE_MESSAGES.SCANNER.NO_SHIFT_ACTION_LABEL

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => { clearInterval(timer); }
  }, [])

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      toast.warning(ATTENDANCE_MESSAGES.SCANNER.GEO_NOT_SUPPORTED)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        persistScannerLocation(coords)
      },
      (err) => {
        console.warn("GPS mount error:", err.message)
        if (err.code === 1) {
          toast.warning(ATTENDANCE_MESSAGES.SCANNER.GEO_PERMISSION_DENIED)
        }
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    )
  }, [])

  const handleScan = async () => {
    if (!canScan) {
      toast.warning(ATTENDANCE_MESSAGES.SCANNER.NO_SHIFT_TODAY)
      return
    }

    setIsProcessing(true)
    setLocating(true)

    try {
      const finalLocation = await getCurrentScannerLocation()
      setLocation(finalLocation)
      persistScannerLocation(finalLocation)
      await attendanceApi.scan({ location: finalLocation })
      await queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY })
      toast.success(
        nextAction === "check_in"
          ? ATTENDANCE_MESSAGES.SCANNER.CHECK_IN_SUCCESS
          : ATTENDANCE_MESSAGES.SCANNER.CHECK_OUT_SUCCESS,
      )
    } catch (error) {
      console.error("Scan error:", error)
      toast.error(getScannerApiErrorMessage(error, ATTENDANCE_MESSAGES.ERRORS.SCAN_FAILED))
    } finally {
      setLocating(false)
      setIsProcessing(false)
    }
  }

  return {
    user,
    currentTime,
    location,
    locating,
    isProcessing,
    nextAction,
    nextActionLabel,
    todayShift,
    canScan,
    scanDisabledLabel,
    isShiftLoading: isPlannedWeekLoading || isScheduleLoading || isRecordsLoading,
    handleScan,
  }
}
