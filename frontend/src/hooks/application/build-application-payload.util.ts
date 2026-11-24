import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import { type ApplicationFormState, combineDateAndTime } from "./application-form.types"

/** Builds the API payload list for single or bulk application submission. */
export function buildApplicationPayload(
  forms: ApplicationFormState[],
  type: string,
  assignedToId: string,
) {
  return forms.map((form) => {
    let detail: Record<string, unknown> = {}

    switch (type) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
          documentUrl: form.documentUrl || undefined,
        }
        break
      case APPLICATION_TYPES.OVERTIME.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId,
          overtimeMinutes: Math.round(form.overtimeHours * 60),
        }
        break
      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break
      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          swapWithEmployeeId: form.swapWithEmployeeId.trim(),
          swapWithShiftId: form.swapWithShiftId.trim(),
        }
        break
      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId,
        }
        break
      case APPLICATION_TYPES.RESIGNATION.LABEL:
        detail = {}
        break
      case APPLICATION_TYPES.FORGOT_CARD.LABEL:
        detail = {
          employeeShiftId: form.employeeShiftId,
          checkInAt: form.checkInAt
            ? combineDateAndTime(form.startDate, form.checkInAt)
            : undefined,
          checkOutAt: form.checkOutAt
            ? combineDateAndTime(form.startDate, form.checkOutAt)
            : undefined,
          documentUrl: form.documentUrl || undefined,
        }
        break
      case APPLICATION_TYPES.REGIME.LABEL:
        detail = {
          regimeCategoryId: form.regimeCategoryId,
          lateMinutes: form.regimeLateMinutes,
          earlyMinutes: form.regimeEarlyMinutes,
          documentUrl: form.documentUrl || undefined,
        }
        break
      case APPLICATION_TYPES.RECRUITMENT.LABEL:
        detail = {
          positionName: form.positionName,
          quantity: form.quantity,
          requirements: form.requirements || undefined,
        }
        break
    }

    return {
      type,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      assignedToId: assignedToId && assignedToId !== "none" ? assignedToId : undefined,
      detail,
    }
  })
}
