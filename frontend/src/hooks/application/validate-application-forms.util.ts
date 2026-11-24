import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import { APPLICATION_MESSAGES } from "@/config/messages/application.message"
import { toast } from "sonner"
import type { ApplicationFormState } from "./application-form.types"

const { VALIDATION } = APPLICATION_MESSAGES

/** Validates application forms before submission. Returns true if valid, false if an error toast was shown. */
export function validateApplicationForms(
  forms: ApplicationFormState[],
  type: string,
  assignedToId: string,
): boolean {
  if (
    type !== APPLICATION_TYPES.RESIGNATION.LABEL &&
    (!assignedToId || assignedToId === "none")
  ) {
    toast.error(VALIDATION.APPROVER_REQUIRED)
    return false
  }

  const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0))

  for (const [index, form] of forms.entries()) {
    const idx = index + 1
    if (!form.startDate) {
      toast.error(VALIDATION.START_DATE_WITH_INDEX(idx))
      return false
    }

    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        if (form.startDate && new Date(form.startDate) < todayMidnight) {
          toast.error(VALIDATION.PAST_DATE_OVERTIME(idx))
          return false
        }
        break

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        if (!assignedToId || assignedToId === "none") {
          toast.error(VALIDATION.APPROVER_REQUIRED)
          return false
        }
        if (form.startDate && new Date(form.startDate) < todayMidnight) {
          toast.error(VALIDATION.PAST_DATE_RESIGNATION)
          return false
        }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        if (form.startDate && new Date(form.startDate) < todayMidnight) {
          toast.error(VALIDATION.PAST_DATE_GENERIC(idx))
          return false
        }
        if (!form.employeeShiftId) {
          toast.error(VALIDATION.SHIFT_SELECT_REQUIRED(idx))
          return false
        }
        if (!form.durationMinutes || form.durationMinutes < 1 || form.durationMinutes > 480) {
          toast.error(VALIDATION.MINUTES_RANGE_WITH_INDEX(idx))
          return false
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        if (!form.employeeShiftId) {
          toast.error(VALIDATION.USER_SHIFT_WITH_INDEX(idx))
          return false
        }
        if (!form.swapWithEmployeeId) {
          toast.error(VALIDATION.PEER_REQUIRED(idx))
          return false
        }
        if (!form.swapWithShiftId) {
          toast.error(VALIDATION.PEER_SHIFT_REQUIRED(idx))
          return false
        }
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        if (form.startDate && new Date(form.startDate) < todayMidnight) {
          toast.error(VALIDATION.PAST_DATE_REMOTE(idx))
          return false
        }
        if (!form.employeeShiftId) {
          toast.error(VALIDATION.SHIFT_SELECT_REQUIRED(idx))
          return false
        }
        break

      case APPLICATION_TYPES.FORGOT_CARD.LABEL:
        if (!form.employeeShiftId) {
          toast.error(VALIDATION.SHIFT_SELECT_REQUIRED(idx))
          return false
        }
        if (form.startDate && new Date(form.startDate) > todayMidnight) {
          toast.error(VALIDATION.FUTURE_DATE_ATTENDANCE(idx))
          return false
        }
        if (!form.checkInAt && !form.checkOutAt) {
          toast.error(VALIDATION.ATTENDANCE_TIME_REQUIRED(idx))
          return false
        }
        break

      case APPLICATION_TYPES.REGIME.LABEL:
        if (!form.regimeCategoryId) {
          toast.error(VALIDATION.REGIME_TYPE_REQUIRED(idx))
          return false
        }
        if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
          toast.error(VALIDATION.END_DATE_BEFORE_START(idx))
          return false
        }
        break

      case APPLICATION_TYPES.RECRUITMENT.LABEL:
        if (!form.positionName) {
          toast.error(VALIDATION.RECRUITMENT_POSITION_REQUIRED(idx))
          return false
        }
        if (!form.quantity || form.quantity < 1) {
          toast.error(VALIDATION.RECRUITMENT_QUANTITY_POSITIVE(idx))
          return false
        }
        break
    }
  }

  return true
}
