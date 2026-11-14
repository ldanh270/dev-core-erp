import { DAY_OF_WEEK_VALUES } from "@/configs/entities/attendance.config.ts"
import {
  type IPartTimeAvailabilityStatus,
  PART_TIME_AVAILABILITY_RULES,
  PART_TIME_AVAILABILITY_STATUS,
} from "@/configs/entities/part-time-availability.config.ts"
import { PART_TIME_AVAILABILITY_MESSAGES } from "@/configs/messages/part-time-availability.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type { IUpsertPartTimeAvailabilityDTO } from "@/types/part-time-availability.types.ts"
import { AppError } from "@/utils/error.util.ts"

/** AppError layer tag for part-time availability service boundary. */
export const PART_TIME_AVAILABILITY_LAYERS = {
  SERVICE: "PartTimeAvailabilityService",
} as const

/**
 * Fill missing weekdays with default 08:00–17:00 slot.
 * Admin assign UI expects a full Mon–Sun grid even when employee omits days.
 */
export function normalizeAvailabilityDays(
  days: IUpsertPartTimeAvailabilityDTO["days"],
): IUpsertPartTimeAvailabilityDTO["days"] {
  // Omitted weekdays default to 08:00–17:00 so admin always receives a full-week grid.
  const byDay = new Map(days.map((day) => [day.dayOfWeek, day]))

  return DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek)
    return (
      existing ?? {
        dayOfWeek,
        isBusyAllDay: false,
        slots: [
          {
            startTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_START_MINUTES,
            endTime: PART_TIME_AVAILABILITY_RULES.DEFAULT_SLOT_END_MINUTES,
          },
        ],
      }
    )
  })
}

/**
 * Validate employee-submitted free-time slots before persistence.
 * Enforces busy/slot consistency, max slots, min duration, and no overlaps.
 */
export function validateAvailabilityDays(days: IUpsertPartTimeAvailabilityDTO["days"]): void {
  for (const day of days) {
    if (day.isBusyAllDay && day.slots.length > 0) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.BUSY_WITH_SLOTS,
        HttpStatusCode.BAD_REQUEST,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    if (!day.isBusyAllDay && day.slots.length === 0) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.EMPTY_DAY_SLOTS,
        HttpStatusCode.BAD_REQUEST,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    if (day.slots.length > PART_TIME_AVAILABILITY_RULES.MAX_SLOTS_PER_DAY) {
      throw new AppError(
        PART_TIME_AVAILABILITY_MESSAGES.MAX_SLOTS,
        HttpStatusCode.BAD_REQUEST,
        PART_TIME_AVAILABILITY_LAYERS.SERVICE,
      )
    }

    // Sort before overlap check — client payload order is not guaranteed chronological.
    const sorted = [...day.slots].sort((a, b) => a.startTime - b.startTime)

    let previousEndTime: number | null = null
    for (const { startTime, endTime } of sorted) {
      if (startTime >= endTime) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SLOT_INVALID_RANGE,
          HttpStatusCode.BAD_REQUEST,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      if (endTime - startTime < PART_TIME_AVAILABILITY_RULES.MIN_SLOT_DURATION_MINUTES) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SLOT_TOO_SHORT,
          HttpStatusCode.BAD_REQUEST,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      if (previousEndTime !== null && startTime < previousEndTime) {
        throw new AppError(
          PART_TIME_AVAILABILITY_MESSAGES.SLOT_OVERLAP,
          HttpStatusCode.BAD_REQUEST,
          PART_TIME_AVAILABILITY_LAYERS.SERVICE,
        )
      }

      previousEndTime = endTime
    }
  }
}

/** Approve/reject only valid from submitted — not draft or already reviewed. */
export function assertSubmittedForReview(status: IPartTimeAvailabilityStatus): void {
  if (status !== PART_TIME_AVAILABILITY_STATUS.SUBMITTED) {
    throw new AppError(
      PART_TIME_AVAILABILITY_MESSAGES.NOT_SUBMITTED,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      PART_TIME_AVAILABILITY_LAYERS.SERVICE,
    )
  }
}

/** Assign allowed on submitted (primary) or approved (legacy rows); approval is not required. */
export function assertSubmittedForAssign(status: IPartTimeAvailabilityStatus): void {
  if (
    status !== PART_TIME_AVAILABILITY_STATUS.SUBMITTED &&
    status !== PART_TIME_AVAILABILITY_STATUS.APPROVED
  ) {
    throw new AppError(
      PART_TIME_AVAILABILITY_MESSAGES.NOT_SUBMITTED_FOR_ASSIGN,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      PART_TIME_AVAILABILITY_LAYERS.SERVICE,
    )
  }
}
