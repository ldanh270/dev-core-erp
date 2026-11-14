/**
 * Domain and repository contracts for weekly part-time availability.
 * Transport schemas are converted into these minute-based types before business processing.
 */
import type {
  IPartTimeAvailabilityStatus,
  PartTimeSuggestionDecision,
} from "@/configs/entities/part-time-availability.config.ts"
import type { AssignPartTimeShiftsSchemaType } from "@/schemas/part-time-availability.schema.ts"

export interface IPartTimeAvailabilitySlot {
  id?: string
  startTime: number
  endTime: number
  sortOrder: number
}

/** Minutes-from-midnight slots within a weekday; empty when isBusyAllDay is true. */
export interface IPartTimeAvailabilityDay {
  id?: string
  dayOfWeek: number
  isBusyAllDay: boolean
  slots: IPartTimeAvailabilitySlot[]
}

/** One employee × one ISO week; status gates employee edits; assign requires submitted (approval optional). */
export interface IPartTimeWeeklyAvailability {
  id: string
  employeeId: string
  weekStart: string
  status: IPartTimeAvailabilityStatus
  note: string | null
  submittedAt: string | null
  reviewedById: string | null
  reviewedAt: string | null
  rejectReason: string | null
  createdAt: string
  updatedAt: string
  days: IPartTimeAvailabilityDay[]
  /** Admin roster: assigned shift times per dayOfWeek when overrides exist for the week. */
  assignedDaySummaries?: Partial<Record<number, string>>
  assignedDaySlots?: Partial<Record<number, Array<{ startTime: string; endTime: string }>>>
  hasAssignedShifts?: boolean
  employee?: {
    id: string
    fullName: string
    email: string
    employeeType: string
    workScheduleType?: string | null
  }
}

export interface IUpsertPartTimeAvailabilityDayDTO {
  dayOfWeek: number
  isBusyAllDay: boolean
  slots: Array<{ startTime: number; endTime: number }>
}

export interface IUpsertPartTimeAvailabilityDTO {
  weekStart: string | Date
  note?: string | null
  status?: IPartTimeAvailabilityStatus
  days: IUpsertPartTimeAvailabilityDayDTO[]
  employeeId?: string
}

/** Admin assigns shifts from submitted availability — writes EmployeeShift rows bounded by declared slots. */
export interface IAssignPartTimeShiftsDTO {
  availabilityId: string
  assignments: AssignPartTimeShiftsSchemaType["assignments"]
  createdById: string
  suggestionDecision?: PartTimeSuggestionDecision
}

/** Optional review: approve locks further edits; reject returns to employee. Assign does not require approve — only submitted. */
export interface IReviewPartTimeAvailabilityDTO {
  availabilityId: string
  reviewedById: string
  rejectReason?: string
}

export interface IPartTimeAvailabilityRepository {
  findByEmployeeAndWeek(
    employeeId: string,
    weekStart: Date,
  ): Promise<IPartTimeWeeklyAvailability | null>
  listByWeek(weekStart: Date): Promise<IPartTimeWeeklyAvailability[]>
  upsert(
    data: IUpsertPartTimeAvailabilityDTO & { employeeId: string },
  ): Promise<IPartTimeWeeklyAvailability>
  findById(id: string): Promise<IPartTimeWeeklyAvailability | null>
  updateStatus(
    id: string,
    status: IPartTimeAvailabilityStatus,
    reviewedById: string,
    rejectReason?: string,
  ): Promise<IPartTimeWeeklyAvailability>
}

/** One suggested shift slot — HH:mm strings matching assign-shifts payload. */
export interface ISuggestPartTimeAssignment {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface IPartTimeCoverageRequirement {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  startTime: number
  endTime: number
  requiredCount: number
}

export interface ISuggestPartTimeEmployeeSuggestion {
  availabilityId: string
  employeeId: string
  employeeName: string
  score: number
  reasons: string[]
  assignments: ISuggestPartTimeAssignment[]
}

export interface ISuggestPartTimeCoverage {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  requiredCount: number
  assignedCount: number
  coverageScore: number
}

export interface IPartTimeUnassignedGap {
  shiftId: string
  shiftName: string
  dayOfWeek: number
  missingCount: number
  reason: string
}

export interface ISuggestPartTimeShiftsResult {
  weekStart: string
  suggestions: ISuggestPartTimeEmployeeSuggestion[]
  coverage: ISuggestPartTimeCoverage[]
  unassignedGaps: IPartTimeUnassignedGap[]
}

export interface IPtShiftSuggestionService {
  suggest(input: {
    weekStart: string
    coverageRequirements?: Array<Omit<IPartTimeCoverageRequirement, "shiftName">>
  }): Promise<ISuggestPartTimeShiftsResult>
}

export interface IPartTimeAvailabilityService {
  getMine(employeeId: string, weekStart: string): Promise<IPartTimeWeeklyAvailability | null>
  upsertMine(
    accountId: string,
    data: IUpsertPartTimeAvailabilityDTO,
  ): Promise<IPartTimeWeeklyAvailability>
  listForWeek(weekStart: string): Promise<IPartTimeWeeklyAvailability[]>
  getByEmployee(employeeId: string, weekStart: string): Promise<IPartTimeWeeklyAvailability | null>
  approve(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability>
  reject(data: IReviewPartTimeAvailabilityDTO): Promise<IPartTimeWeeklyAvailability>
  assignShifts(data: IAssignPartTimeShiftsDTO): Promise<{ assigned: number; skipped: number }>
}

/** Prisma include shape — ordered days/slots for week grid rendering. */
export const partTimeAvailabilityInclude = {
  days: {
    orderBy: { dayOfWeek: "asc" as const },
    include: {
      slots: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeType: true,
      workScheduleType: true,
    },
  },
} as const
