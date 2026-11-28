import { LEAVE_TYPE, REGIME_TYPE } from "@/config/entities/attendance.config"

/** Combines local date and time inputs into an ISO timestamp. */
export const combineDateAndTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return undefined
  try {
    return new Date(`${dateStr}T${timeStr}`).toISOString()
  } catch {
    return undefined
  }
}

export interface ApplicationFormState {
  startDate: string
  endDate: string
  reason: string
  note: string
  leaveType: string
  leaveRegimeType: typeof REGIME_TYPE.PAID | typeof REGIME_TYPE.UNPAID
  regimeCategoryId: string
  regimeLateMinutes: number
  regimeEarlyMinutes: number
  employeeShiftId: string
  overtimeHours: number
  durationMinutes: number
  isLate: boolean
  swapWithEmployeeId: string
  swapWithShiftId: string
  swapWithDate: string
  location: string
  documentUrl: string
  checkInAt: string
  checkOutAt: string
  // recruitment
  positionId: string
  positionName: string
  quantity: number
  requirements: string
}

/** Creates a clean form model for a new application item. */
export const getInitialFormState = (): ApplicationFormState => ({
  startDate: "",
  endDate: "",
  reason: "",
  note: "",
  leaveType: LEAVE_TYPE.ANNUAL_LEAVE as string,
  leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
  regimeCategoryId: "",
  regimeLateMinutes: 0,
  regimeEarlyMinutes: 0,
  employeeShiftId: "",
  overtimeHours: 0,
  durationMinutes: 30,
  isLate: true,
  swapWithEmployeeId: "",
  swapWithShiftId: "",
  swapWithDate: "",
  location: "",
  documentUrl: "",
  checkInAt: "",
  checkOutAt: "",
  positionId: "",
  positionName: "",
  quantity: 1,
  requirements: "",
})
