import {
  PART_TIME_AVAILABILITY_ASSIGN_VALIDATION,
  PART_TIME_AVAILABILITY_RULES,
} from "@/config/entities/part-time-availability.config"
import type { IPartTimeAvailabilityDay } from "@/types/part-time-availability.types"
import type { IPartTimeAssignmentDayForm } from "@/utils/attendance/part-time-availability.util"
import {
  buildOutsideFreeRangeAlert,
  buildScheduledSlotsFromAvailabilityDay,
  validatePartTimeAssignmentSlot,
} from "@/utils/attendance/part-time-availability.util"

import { toast } from "sonner"

interface UsePartTimeDayAssignmentProps {
  dayLabel: string
  availabilityDay?: IPartTimeAvailabilityDay
  assignment: IPartTimeAssignmentDayForm
  onChange: (assignment: IPartTimeAssignmentDayForm) => void
}

export function usePartTimeDayAssignment({
  dayLabel,
  availabilityDay,
  assignment,
  onChange,
}: UsePartTimeDayAssignmentProps) {
  const isBusyDay = Boolean(availabilityDay?.isBusyAllDay)
  const canAddSlot = assignment.slots.length < PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY

  const notifySlotValidation = (slot: { startTime: string | null; endTime: string | null }) => {
    if (!slot.startTime && !slot.endTime) return

    const error = validatePartTimeAssignmentSlot(slot.startTime, slot.endTime, availabilityDay)
    if (!error) return

    if (error === PART_TIME_AVAILABILITY_ASSIGN_VALIDATION.OUTSIDE_FREE_RANGE) {
      toast.error(buildOutsideFreeRangeAlert(dayLabel, availabilityDay))
      return
    }

    if (slot.startTime && slot.endTime) {
      toast.error(`${dayLabel}: ${error}`)
    }
  }

  const setScheduled = (isScheduled: boolean) => {
    onChange({
      ...assignment,
      isScheduled,
      slots: isScheduled
        ? buildScheduledSlotsFromAvailabilityDay(availabilityDay)
        : [{ startTime: null, endTime: null }],
    })
  }

  const updateSlot = (
    index: number,
    patch: Partial<{ startTime: string | null; endTime: string | null }>,
  ) => {
    onChange({
      ...assignment,
      slots: assignment.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    })
  }

  const addSlot = () => {
    if (!canAddSlot) return
    onChange({
      ...assignment,
      slots: [
        ...assignment.slots,
        {
          startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START,
          endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END,
        },
      ],
    })
  }

  const removeSlot = (index: number) => {
    if (assignment.slots.length <= 1) return
    onChange({
      ...assignment,
      slots: assignment.slots.filter((_, slotIndex) => slotIndex !== index),
    })
  }

  return {
    isBusyDay,
    canAddSlot,
    notifySlotValidation,
    setScheduled,
    updateSlot,
    addSlot,
    removeSlot,
  }
}
