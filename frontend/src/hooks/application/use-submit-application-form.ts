import { LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { APPLICATION_TYPES, REGIME_TYPE } from "@/config/entities/attendance.config"
import { APPLICATION_MESSAGES } from "@/config/messages/application.message"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"

import { useState } from "react"

import { toast } from "sonner"

const { VALIDATION } = APPLICATION_MESSAGES

export interface SubmitApplicationFormState {
  startDate: string
  endDate: string
  reason: string
  note: string
  leaveType: string
  leaveRegimeType: "paid" | "unpaid"
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean
  swapWithEmployeeId: string
  swapWithShiftId: string
  location: string
}

interface UseSubmitApplicationFormProps {
  selectedType: string
  onSuccess: () => void
  onClose: () => void
}

export function useSubmitApplicationForm({
  selectedType,
  onSuccess,
  onClose,
}: UseSubmitApplicationFormProps) {
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [form, setForm] = useState<SubmitApplicationFormState>({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    leaveType: LEAVE_TYPE_OPTIONS[0].value as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    employeeShiftId: "",
    durationMinutes: 30,
    isLate: true,
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    location: "",
  })

  const setFormField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) {
      toast.error(VALIDATION.START_DATE_REQUIRED)
      return
    }

    let detail: Record<string, unknown> = {}

    switch (selectedType) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        if (!form.employeeShiftId.trim()) {
          toast.error(VALIDATION.SHIFT_ID_REQUIRED)
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        if (!form.employeeShiftId.trim()) {
          toast.error(VALIDATION.SHIFT_ID_REQUIRED)
          return
        }
        if (form.durationMinutes < 1 || form.durationMinutes > 480) {
          toast.error(VALIDATION.MINUTES_RANGE)
          return
        }
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        if (!form.employeeShiftId.trim()) {
          toast.error(VALIDATION.USER_SHIFT_REQUIRED)
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim()) {
          detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        }
        if (form.swapWithShiftId.trim()) {
          detail.swapWithShiftId = form.swapWithShiftId.trim()
        }
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        detail = {}
        break
    }

    const success = await submitApplication({
      type: selectedType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      detail,
    })

    if (success) {
      onSuccess()
      onClose()
    }
  }

  return {
    form,
    setFormField,
    isSubmitting,
    handleSubmit,
  }
}
