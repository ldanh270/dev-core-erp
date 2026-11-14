/// <reference types="jest" />
/**
 * Unit tests for buildPartTimeShiftSuggestions — the greedy PT shift optimizer.
 *
 * Naming convention: V{n} prefixes label the core invariant being verified:
 *   V2 — eligible filter (availability slot must fit requirement, no double-booking)
 *   V3 — sort order (score desc → assigned-minutes asc → employeeId asc)
 *   V4 — gap reporting (unassignedGaps when requiredCount cannot be filled)
 */
import { PART_TIME_AVAILABILITY_STATUS } from "@/configs/entities/part-time-availability.config.ts"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types.ts"
import { buildPartTimeShiftSuggestions } from "@/utils/part-time-availability/build-part-time-shift-suggestions.util.ts"

/** Minimal availability fixture — one employee with given slots on Monday (dayOfWeek=1). */
const availability = (
  id: string,
  employeeId: string,
  slots: Array<{ startTime: number; endTime: number }>,
): IPartTimeWeeklyAvailability => ({
  id,
  employeeId,
  weekStart: "2026-07-20",
  status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
  note: null,
  submittedAt: null,
  reviewedById: null,
  reviewedAt: null,
  rejectReason: null,
  createdAt: "",
  updatedAt: "",
  employee: { id: employeeId, fullName: employeeId, email: "", employeeType: "part_time" },
  days: [
    {
      dayOfWeek: 1,
      isBusyAllDay: false,
      slots: slots.map((slot, sortOrder) => ({ ...slot, sortOrder })),
    },
  ],
})

describe("buildPartTimeShiftSuggestions", () => {
  /** Shared morning-shift requirement used across most test cases. */
  const requirement = {
    shiftId: "morning",
    shiftName: "Ca sáng",
    dayOfWeek: 1,
    startTime: 480,
    endTime: 720,
    requiredCount: 1,
  }

  it("V2/V3 picks eligible highest reliability employee", () => {
    const result = buildPartTimeShiftSuggestions({
      weekStart: "2026-07-20",
      availabilities: [
        availability("a1", "e1", [{ startTime: 480, endTime: 720 }]),
        availability("a2", "e2", [{ startTime: 480, endTime: 720 }]),
      ],
      scoresByEmployeeId: new Map([
        ["e1", { score: 70, reasons: [] }],
        ["e2", { score: 95, reasons: [] }],
      ]),
      coverageRequirements: [requirement],
      assignedMinutesByEmployeeId: new Map(),
    })
    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0]?.employeeId).toBe("e2")
    expect(result.coverage[0]).toMatchObject({
      requiredCount: 1,
      assignedCount: 1,
      coverageScore: 100,
    })
  })

  it("V3 tie-breaks equal score by fewer assigned minutes", () => {
    const result = buildPartTimeShiftSuggestions({
      weekStart: "2026-07-20",
      availabilities: [
        availability("a1", "e1", [{ startTime: 480, endTime: 720 }]),
        availability("a2", "e2", [{ startTime: 480, endTime: 720 }]),
      ],
      scoresByEmployeeId: new Map([
        ["e1", { score: 80, reasons: [] }],
        ["e2", { score: 80, reasons: [] }],
      ]),
      coverageRequirements: [requirement],
      assignedMinutesByEmployeeId: new Map([
        ["e1", 480],
        ["e2", 120],
      ]),
    })
    expect(result.suggestions[0]?.employeeId).toBe("e2")
  })

  it("V4 reports an unassigned gap when no availability fits", () => {
    const result = buildPartTimeShiftSuggestions({
      weekStart: "2026-07-20",
      availabilities: [availability("a1", "e1", [{ startTime: 780, endTime: 1020 }])],
      scoresByEmployeeId: new Map(),
      coverageRequirements: [{ ...requirement, requiredCount: 2 }],
      assignedMinutesByEmployeeId: new Map(),
    })
    expect(result.coverage[0]).toMatchObject({ assignedCount: 0, coverageScore: 0 })
    expect(result.unassignedGaps[0]).toMatchObject({ missingCount: 2 })
  })

  it("V2 never double-books overlapping requirements", () => {
    const result = buildPartTimeShiftSuggestions({
      weekStart: "2026-07-20",
      availabilities: [availability("a1", "e1", [{ startTime: 480, endTime: 1020 }])],
      scoresByEmployeeId: new Map([["e1", { score: 100, reasons: [] }]]),
      coverageRequirements: [
        requirement,
        { ...requirement, shiftId: "overlap", startTime: 600, endTime: 840 },
      ],
      assignedMinutesByEmployeeId: new Map(),
    })
    expect(result.suggestions[0]?.assignments).toHaveLength(1)
    expect(result.unassignedGaps).toHaveLength(1)
  })
})
