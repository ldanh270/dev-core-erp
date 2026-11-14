/**
 * Canonical enum values, workflow states, and validation limits for weekly part-time availability.
 * API schemas and services import these values to stay aligned with the Prisma enum contract.
 */
import { parseTimeToMinutes } from "@/utils/part-time-availability.util.ts"

export const PART_TIME_AVAILABILITY_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

/** Lifecycle: draft → submitted → approved|rejected. Assign allowed when submitted (approval optional). */
export const PART_TIME_AVAILABILITY_STATUSES = [
  PART_TIME_AVAILABILITY_STATUS.DRAFT,
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.APPROVED,
  PART_TIME_AVAILABILITY_STATUS.REJECTED,
] as const

export type IPartTimeAvailabilityStatus = (typeof PART_TIME_AVAILABILITY_STATUSES)[number]

/** Records whether an admin accepted, edited, or ignored the AI shift suggestion. */
export const PART_TIME_SUGGESTION_DECISION = {
  ACCEPTED: "accepted",
  EDITED: "edited",
  MANUAL: "manual",
} as const

export const PART_TIME_SUGGESTION_DECISIONS = Object.values(PART_TIME_SUGGESTION_DECISION)
export type PartTimeSuggestionDecision =
  (typeof PART_TIME_SUGGESTION_DECISION)[keyof typeof PART_TIME_SUGGESTION_DECISION]

/** Admin may assign / suggest when submitted (primary) or legacy approved. */
export const PART_TIME_AVAILABILITY_ASSIGNABLE_STATUSES: IPartTimeAvailabilityStatus[] = [
  PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  PART_TIME_AVAILABILITY_STATUS.APPROVED,
]

/** Slot grid constraints — aligned with UI 30-min stepper and overlap validation in service. */
export const PART_TIME_AVAILABILITY_RULES = {
  MAX_SLOTS_PER_DAY: 4,
  MIN_SLOT_DURATION_MINUTES: 30,
  TIME_STEP_MINUTES: 30,
  DEFAULT_SLOT_START: "08:00",
  DEFAULT_SLOT_END: "17:00",
  DEFAULT_SLOT_START_MINUTES: parseTimeToMinutes("08:00"),
  DEFAULT_SLOT_END_MINUTES: parseTimeToMinutes("17:00"),
} as const

/** Greedy shift suggester — reliability score from AttendanceRecord lookback. */
export const PART_TIME_SHIFT_SUGGEST = {
  LOOKBACK_DAYS: 90,
  NEUTRAL_SCORE: 50,
  WEIGHT_ATTENDANCE_RATE: 70,
  WEIGHT_LATE_PENALTY: 30,
  LATE_PENALTY_CAP_MINUTES: 60,
} as const

export const PART_TIME_AVAILABILITY_QUERY_PARAMS = {
  WEEK_START: "weekStart",
} as const
