/// <reference types="jest" />
import { PART_TIME_AVAILABILITY_STATUS } from "@/configs/entities/part-time-availability.config.ts"
import { PART_TIME_AVAILABILITY_MESSAGES } from "@/configs/messages/part-time-availability.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { resolvePersonalEmployeeId } from "@/utils/attendance/resolve-personal-employee-id.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import {
  getDateForWeekDay,
  isPastOrCurrentAvailabilityWeek,
  minutesToTime,
  normalizeWeekStart,
  parseTimeToMinutes,
  shiftFitsAvailabilityDay,
} from "@/utils/part-time-availability.util.ts"
import {
  assertSubmittedForAssign,
  assertSubmittedForReview,
  normalizeAvailabilityDays,
  validateAvailabilityDays,
} from "@/utils/part-time-availability/validate-availability-days.util.ts"

import { jest } from "@jest/globals"

import { auditService } from "../../services/audit.service"
import { PartTimeAvailabilityService } from "../../services/part-time-availability.service"

jest.mock("@/configs/entities/attendance.config.ts", () => ({
  DAY_OF_WEEK_VALUES: [1, 2, 3, 4, 5, 6, 7],
}))

jest.mock("@/utils/employee/is-part-time-work-schedule.util.ts", () => ({
  isPartTimeWorkSchedule: jest.fn(),
}))

jest.mock("@/configs/entities/part-time-availability.config.ts", () => ({
  PART_TIME_AVAILABILITY_STATUS: {
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },
  PART_TIME_SUGGESTION_DECISION: {
    ACCEPTED: "accepted",
    EDITED: "edited",
    MANUAL: "manual",
  },
}))

jest.mock("@/configs/messages/part-time-availability.message.ts", () => ({
  PART_TIME_AVAILABILITY_MESSAGES: {
    PAST_OR_CURRENT_WEEK_NOT_ALLOWED: "PAST_OR_CURRENT_WEEK_NOT_ALLOWED",
    WEEK_ALREADY_ASSIGNED: "WEEK_ALREADY_ASSIGNED",
    REJECT_REASON_REQUIRED: "REJECT_REASON_REQUIRED",
    ASSIGN_INVALID_RANGE: "ASSIGN_INVALID_RANGE",
    SHIFT_NOT_IN_SLOT: "SHIFT_NOT_IN_SLOT",
    NOT_FOUND: "NOT_FOUND",
    NOT_PART_TIME: "NOT_PART_TIME",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
  },
}))

jest.mock("@/types/employee.types.ts", () => ({}))
jest.mock("@/types/part-time-availability.types.ts", () => ({}))
jest.mock("@/types/shift.types.ts", () => ({}))

jest.mock("@/utils/attendance/resolve-personal-employee-id.ts", () => ({
  resolvePersonalEmployeeId: jest.fn(),
}))

jest.mock("@/utils/part-time-availability/validate-availability-days.util.ts", () => ({
  assertSubmittedForAssign: jest.fn(),
  assertSubmittedForReview: jest.fn(),
  normalizeAvailabilityDays: jest.fn(),
  PART_TIME_AVAILABILITY_LAYERS: {
    SERVICE: "SERVICE",
  },
  validateAvailabilityDays: jest.fn(),
}))

jest.mock("@/utils/part-time-availability.util.ts", () => ({
  getDateForWeekDay: jest.fn(),
  isPastOrCurrentAvailabilityWeek: jest.fn(),
  minutesToTime: jest.fn(),
  normalizeWeekStart: jest.fn(),
  parseTimeToMinutes: jest.fn(),
  shiftFitsAvailabilityDay: jest.fn(),
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layer: string

    constructor(message: string, statusCode: number, layer: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.layer = layer
    }
  },
}))

jest.mock("../../services/audit.service", () => ({
  auditService: {
    log: jest.fn(),
  },
}))

type AvailabilitySlot = {
  startTime: number
  endTime: number
}

type AvailabilityDay = {
  dayOfWeek: number
  isBusyAllDay: boolean
  slots: AvailabilitySlot[]
}

type AvailabilityRecord = {
  id: string
  employeeId: string
  weekStart: string
  days: AvailabilityDay[]
  status?: string
  note?: string | null
  rejectReason?: string | null
  assignedDaySummaries?: Array<Record<string, unknown>>
  hasAssignedShifts?: boolean
}

type EmployeeRecord = {
  id: string
  lockedUntil: null
  revokedAt: null
}

type EmployeeShiftRow = {
  employeeId: string
  assignedDate: Date
  shiftId: string
}

type WorkingShiftRow = {
  id: string
  startTime: number
  endTime: number
}

type WorkingShiftCreatePayload = {
  name: string
  startTime: string
  endTime: string
  isActive: boolean
  createdById: string
}

type AvailabilityRepoMock = {
  findByEmployeeAndWeek: jest.MockedFunction<
    (employeeId: string, weekStart: string) => Promise<AvailabilityRecord | null>
  >
  upsert: jest.MockedFunction<
    (data: {
      employeeId: string
      weekStart: string
      note: string
      status: string
      days: AvailabilityDay[]
    }) => Promise<AvailabilityRecord>
  >
  listByWeek: jest.MockedFunction<(weekStart: string) => Promise<AvailabilityRecord[]>>
  findById: jest.MockedFunction<(id: string) => Promise<AvailabilityRecord | null>>
  updateStatus: jest.MockedFunction<
    (
      id: string,
      status: string,
      reviewedById: string,
      rejectReason?: string,
    ) => Promise<AvailabilityRecord>
  >
}

type EmployeeRepoMock = {
  findById: jest.MockedFunction<(id: string) => Promise<EmployeeRecord | null>>
}

type EmployeeShiftRepoMock = {
  hasOverridesForEmployeeDates: jest.MockedFunction<
    (employeeId: string, weekDates: Date[]) => Promise<boolean>
  >
  listByEmployeesAndDateRange: jest.MockedFunction<
    (employeeIds: string[], startDate: Date, endDate: Date) => Promise<EmployeeShiftRow[]>
  >
  replacePartTimeOverrides: jest.MockedFunction<
    (
      employeeId: string,
      weekDates: Date[],
      pendingOverrides: Array<{
        employeeId: string
        assignedDate: Date
        shiftId: string
        createdById: string
      }>,
    ) => Promise<void>
  >
}

type WorkingShiftRepoMock = {
  listAll: jest.MockedFunction<() => Promise<WorkingShiftRow[]>>
  create: jest.MockedFunction<(data: WorkingShiftCreatePayload) => Promise<{ id: string }>>
}

type ServiceBundle = {
  service: PartTimeAvailabilityService
  availabilityRepo: AvailabilityRepoMock
  employeeRepo: EmployeeRepoMock
  employeeShiftRepo: EmployeeShiftRepoMock
  workingShiftRepo: WorkingShiftRepoMock
}

const mockIsPartTimeWorkSchedule = isPartTimeWorkSchedule as jest.MockedFunction<
  typeof isPartTimeWorkSchedule
>
const mockResolvePersonalEmployeeId = resolvePersonalEmployeeId as jest.MockedFunction<
  typeof resolvePersonalEmployeeId
>
const mockAssertSubmittedForAssign = assertSubmittedForAssign as jest.MockedFunction<
  typeof assertSubmittedForAssign
>
const mockAssertSubmittedForReview = assertSubmittedForReview as jest.MockedFunction<
  typeof assertSubmittedForReview
>
const mockNormalizeAvailabilityDays = normalizeAvailabilityDays as jest.MockedFunction<
  typeof normalizeAvailabilityDays
>
const mockValidateAvailabilityDays = validateAvailabilityDays as jest.MockedFunction<
  typeof validateAvailabilityDays
>
const mockGetDateForWeekDay = getDateForWeekDay as jest.MockedFunction<typeof getDateForWeekDay>
const mockIsPastOrCurrentAvailabilityWeek = isPastOrCurrentAvailabilityWeek as jest.MockedFunction<
  typeof isPastOrCurrentAvailabilityWeek
>
const mockMinutesToTime = minutesToTime as jest.MockedFunction<typeof minutesToTime>
const mockNormalizeWeekStart = normalizeWeekStart as jest.MockedFunction<typeof normalizeWeekStart>
const mockParseTimeToMinutes = parseTimeToMinutes as jest.MockedFunction<typeof parseTimeToMinutes>
const mockShiftFitsAvailabilityDay = shiftFitsAvailabilityDay as jest.MockedFunction<
  typeof shiftFitsAvailabilityDay
>
const { log: mockAuditLog } = auditService as unknown as {
  log: jest.MockedFunction<typeof auditService.log>
}

function createServiceBundle(): ServiceBundle {
  const availabilityRepo: AvailabilityRepoMock = {
    findByEmployeeAndWeek: jest.fn() as AvailabilityRepoMock["findByEmployeeAndWeek"],
    upsert: jest.fn() as AvailabilityRepoMock["upsert"],
    listByWeek: jest.fn() as AvailabilityRepoMock["listByWeek"],
    findById: jest.fn() as AvailabilityRepoMock["findById"],
    updateStatus: jest.fn() as AvailabilityRepoMock["updateStatus"],
  }

  const employeeRepo: EmployeeRepoMock = {
    findById: jest.fn() as EmployeeRepoMock["findById"],
  }

  const employeeShiftRepo: EmployeeShiftRepoMock = {
    hasOverridesForEmployeeDates:
      jest.fn() as EmployeeShiftRepoMock["hasOverridesForEmployeeDates"],
    listByEmployeesAndDateRange: jest
      .fn()
      .mockReturnValue(
        Promise.resolve([]),
      ) as unknown as EmployeeShiftRepoMock["listByEmployeesAndDateRange"],
    replacePartTimeOverrides: jest.fn() as EmployeeShiftRepoMock["replacePartTimeOverrides"],
  }

  const workingShiftRepo: WorkingShiftRepoMock = {
    listAll: jest.fn() as WorkingShiftRepoMock["listAll"],
    create: jest.fn() as WorkingShiftRepoMock["create"],
  }

  const service = new PartTimeAvailabilityService(
    availabilityRepo as never,
    employeeRepo as never,
    employeeShiftRepo as never,
    workingShiftRepo as never,
  )

  return {
    service,
    availabilityRepo,
    employeeRepo,
    employeeShiftRepo,
    workingShiftRepo,
  }
}

describe("PartTimeAvailabilityService.getMine", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo

    jest.clearAllMocks()
    mockNormalizeWeekStart.mockReturnValue("2025-01-06" as never)
  })

  it("UTCID01 - returns weekly availability for normalized week start", async () => {
    // Arrange
    const expected: AvailabilityRecord = {
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      days: [],
    }
    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(expected)

    // Act
    const result = await service.getMine("emp-1", "2025-01-08")

    // Assert
    expect(mockNormalizeWeekStart).toHaveBeenCalledWith("2025-01-08")
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith("emp-1", "2025-01-06")
    expect(result).toEqual(expected)
  })

  it("UTCID02 - returns null when no weekly availability exists", async () => {
    // Arrange
    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(null)

    // Act
    const result = await service.getMine("emp-404", "2025-01-08")

    // Assert
    expect(result).toBeNull()
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith("emp-404", "2025-01-06")
  })

  it("UTCID03 - propagates repository errors", async () => {
    // Arrange
    const error = new Error("repository failed")
    availabilityRepo.findByEmployeeAndWeek.mockRejectedValue(error)

    // Act
    const act = service.getMine("emp-1", "2025-01-08")

    // Assert
    await expect(act).rejects.toThrow("repository failed")
  })
})

describe("PartTimeAvailabilityService.upsertMine", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock
  let employeeRepo: EmployeeRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo
    employeeRepo = bundle.employeeRepo
    employeeShiftRepo = bundle.employeeShiftRepo

    jest.clearAllMocks()
    mockResolvePersonalEmployeeId.mockResolvedValue("emp-1" as never)
    employeeRepo.findById.mockResolvedValue({ id: "emp-1", lockedUntil: null, revokedAt: null })
    mockIsPartTimeWorkSchedule.mockReturnValue(true as never)
    mockIsPastOrCurrentAvailabilityWeek.mockReturnValue(false as never)
    mockNormalizeWeekStart.mockReturnValue("2025-01-06" as never)
    mockGetDateForWeekDay.mockImplementation((weekStart: Date, dayOfWeek: number) => {
      return new Date(`2025-01-0${dayOfWeek}`)
    })
    employeeShiftRepo.hasOverridesForEmployeeDates.mockResolvedValue(false)
    mockNormalizeAvailabilityDays.mockReturnValue([
      { dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] },
    ] as never)
    mockValidateAvailabilityDays.mockImplementation(() => undefined)
  })

  it("UTCID01 - upserts submitted availability for a future week", async () => {
    // Arrange
    const data = {
      weekStart: "2025-01-08",
      note: "available mornings",
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    }
    const expected: AvailabilityRecord = {
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      note: "available mornings",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    }
    availabilityRepo.upsert.mockResolvedValue(expected)

    // Act
    const result = await service.upsertMine("acc-1", data)

    // Assert
    expect(mockResolvePersonalEmployeeId).toHaveBeenCalledWith("acc-1")
    expect(employeeRepo.findById).toHaveBeenCalledWith("emp-1")
    expect(mockIsPartTimeWorkSchedule).toHaveBeenCalledWith({
      id: "emp-1",
      lockedUntil: null,
      revokedAt: null,
    })
    expect(mockIsPastOrCurrentAvailabilityWeek).toHaveBeenCalledWith("2025-01-08")
    expect(mockNormalizeAvailabilityDays).toHaveBeenCalledWith(data.days)
    expect(mockValidateAvailabilityDays).toHaveBeenCalledWith([
      { dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] },
    ])
    expect(availabilityRepo.upsert).toHaveBeenCalledWith({
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      note: "available mornings",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    })
    expect(result).toEqual(expected)
  })

  it("UTCID02 - throws when week is past or current", async () => {
    // Arrange
    mockIsPastOrCurrentAvailabilityWeek.mockReturnValue(true as never)
    const data = {
      weekStart: "2025-01-01",
      note: "note",
      days: [],
    }

    // Act
    const act = service.upsertMine("acc-1", data)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.PAST_OR_CURRENT_WEEK_NOT_ALLOWED,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    })
    expect(availabilityRepo.upsert).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws when assigned shifts already exist for the week", async () => {
    // Arrange
    employeeShiftRepo.hasOverridesForEmployeeDates.mockResolvedValue(true)
    const data = {
      weekStart: "2025-01-08",
      note: "note",
      days: [],
    }

    // Act
    const act = service.upsertMine("acc-1", data)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.WEEK_ALREADY_ASSIGNED,
      statusCode: HttpStatusCode.CONFLICT,
    })
    expect(availabilityRepo.upsert).not.toHaveBeenCalled()
  })

  it("UTCID04 - throws when employee is not part time", async () => {
    // Arrange
    mockIsPartTimeWorkSchedule.mockReturnValue(false as never)
    const data = {
      weekStart: "2025-01-08",
      note: "note",
      days: [],
    }

    // Act
    const act = service.upsertMine("acc-1", data)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_PART_TIME,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    })
    expect(availabilityRepo.upsert).not.toHaveBeenCalled()
  })
})

describe("PartTimeAvailabilityService.listForWeek", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo

    jest.clearAllMocks()
    mockNormalizeWeekStart.mockReturnValue("2025-01-06" as never)
  })

  it("UTCID01 - returns weekly availability", async () => {
    // Arrange
    const items: AvailabilityRecord[] = [
      { id: "av-1", employeeId: "emp-1", weekStart: "2025-01-06", days: [] },
      { id: "av-2", employeeId: "emp-2", weekStart: "2025-01-06", days: [] },
    ]

    availabilityRepo.listByWeek.mockResolvedValue(items)

    // Act
    const result = await service.listForWeek("2025-01-08")

    // Assert
    expect(mockNormalizeWeekStart).toHaveBeenCalledWith("2025-01-08")
    expect(availabilityRepo.listByWeek).toHaveBeenCalledWith("2025-01-06")
    expect(result).toEqual([
      {
        ...items[0],
        assignedDaySlots: {},
        assignedDaySummaries: {},
        hasAssignedShifts: false,
      },
      {
        ...items[1],
        assignedDaySlots: {},
        assignedDaySummaries: {},
        hasAssignedShifts: false,
      },
    ])
  })

  it("UTCID02 - returns empty array when no availability exists for the week", async () => {
    // Arrange
    availabilityRepo.listByWeek.mockResolvedValue([])

    // Act
    const result = await service.listForWeek("2025-01-08")

    // Assert
    expect(result).toEqual([])
  })

  it("UTCID03 - propagates repository list errors", async () => {
    // Arrange
    availabilityRepo.listByWeek.mockRejectedValue(new Error("list failed"))

    // Act
    const act = service.listForWeek("2025-01-08")

    // Assert
    await expect(act).rejects.toThrow("list failed")
  })
})

describe("PartTimeAvailabilityService.getByEmployee", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo

    jest.clearAllMocks()
    mockNormalizeWeekStart.mockReturnValue("2025-01-06" as never)
  })

  it("UTCID01 - returns employee weekly availability", async () => {
    // Arrange
    const expected: AvailabilityRecord = {
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      days: [],
    }
    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(expected)

    // Act
    const result = await service.getByEmployee("emp-1", "2025-01-08")

    // Assert
    expect(mockNormalizeWeekStart).toHaveBeenCalledWith("2025-01-08")
    expect(availabilityRepo.findByEmployeeAndWeek).toHaveBeenCalledWith("emp-1", "2025-01-06")
    expect(result).toEqual(expected)
  })

  it("UTCID02 - returns null when employee availability is missing", async () => {
    // Arrange
    availabilityRepo.findByEmployeeAndWeek.mockResolvedValue(null)

    // Act
    const result = await service.getByEmployee("emp-404", "2025-01-08")

    // Assert
    expect(result).toBeNull()
  })

  it("UTCID03 - propagates repository errors", async () => {
    // Arrange
    availabilityRepo.findByEmployeeAndWeek.mockRejectedValue(new Error("find failed"))

    // Act
    const act = service.getByEmployee("emp-1", "2025-01-08")

    // Assert
    await expect(act).rejects.toThrow("find failed")
  })
})

describe("PartTimeAvailabilityService.approve", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo

    jest.clearAllMocks()
    mockAssertSubmittedForReview.mockImplementation(() => undefined)
  })

  it("UTCID01 - approves submitted availability", async () => {
    // Arrange
    const availability: AvailabilityRecord = {
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [],
    }
    const updated: AvailabilityRecord = {
      ...availability,
      status: PART_TIME_AVAILABILITY_STATUS.APPROVED,
    }
    availabilityRepo.findById.mockResolvedValue(availability)
    availabilityRepo.updateStatus.mockResolvedValue(updated)

    // Act
    const result = await service.approve({ availabilityId: "av-1", reviewedById: "admin-1" })

    // Assert
    expect(availabilityRepo.findById).toHaveBeenCalledWith("av-1")
    expect(mockAssertSubmittedForReview).toHaveBeenCalledWith(
      PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
    )
    expect(availabilityRepo.updateStatus).toHaveBeenCalledWith(
      "av-1",
      PART_TIME_AVAILABILITY_STATUS.APPROVED,
      "admin-1",
    )
    expect(result).toEqual(updated)
  })

  it("UTCID02 - throws not found when availability does not exist", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue(null)

    // Act
    const act = service.approve({ availabilityId: "av-404", reviewedById: "admin-1" })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
      statusCode: HttpStatusCode.NOT_FOUND,
    })
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled()
  })

  it("UTCID03 - propagates review status assertion errors", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue({
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: "REJECTED_ALREADY",
      days: [],
    })
    mockAssertSubmittedForReview.mockImplementation(() => {
      throw new Error("invalid review state")
    })

    // Act
    const act = service.approve({ availabilityId: "av-1", reviewedById: "admin-1" })

    // Assert
    await expect(act).rejects.toThrow("invalid review state")
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled()
  })
})

describe("PartTimeAvailabilityService.reject", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo

    jest.clearAllMocks()
    mockAssertSubmittedForReview.mockImplementation(() => undefined)
  })

  it("UTCID01 - rejects submitted availability with trimmed reason", async () => {
    // Arrange
    const availability: AvailabilityRecord = {
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [],
    }
    const updated: AvailabilityRecord = {
      ...availability,
      status: PART_TIME_AVAILABILITY_STATUS.REJECTED,
      rejectReason: "Need clearer slots",
    }
    availabilityRepo.findById.mockResolvedValue(availability)
    availabilityRepo.updateStatus.mockResolvedValue(updated)

    // Act
    const result = await service.reject({
      availabilityId: "av-1",
      reviewedById: "admin-1",
      rejectReason: "  Need clearer slots  ",
    })

    // Assert
    expect(mockAssertSubmittedForReview).toHaveBeenCalledWith(
      PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
    )
    expect(availabilityRepo.updateStatus).toHaveBeenCalledWith(
      "av-1",
      PART_TIME_AVAILABILITY_STATUS.REJECTED,
      "admin-1",
      "Need clearer slots",
    )
    expect(result).toEqual(updated)
  })

  it("UTCID02 - throws when reject reason is missing", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue({
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [],
    })

    // Act
    const act = service.reject({
      availabilityId: "av-1",
      reviewedById: "admin-1",
      rejectReason: "   ",
    })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.REJECT_REASON_REQUIRED,
      statusCode: HttpStatusCode.BAD_REQUEST,
    })
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws not found when availability does not exist", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue(null)

    // Act
    const act = service.reject({
      availabilityId: "av-404",
      reviewedById: "admin-1",
      rejectReason: "Invalid",
    })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
      statusCode: HttpStatusCode.NOT_FOUND,
    })
    expect(availabilityRepo.updateStatus).not.toHaveBeenCalled()
  })
})

describe("PartTimeAvailabilityService.assignShifts", () => {
  let service: PartTimeAvailabilityService
  let availabilityRepo: AvailabilityRepoMock
  let employeeRepo: EmployeeRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let workingShiftRepo: WorkingShiftRepoMock

  beforeEach(() => {
    const bundle = createServiceBundle()

    service = bundle.service
    availabilityRepo = bundle.availabilityRepo
    employeeRepo = bundle.employeeRepo
    employeeShiftRepo = bundle.employeeShiftRepo
    workingShiftRepo = bundle.workingShiftRepo

    jest.clearAllMocks()
    mockAssertSubmittedForAssign.mockImplementation(() => undefined)
    employeeRepo.findById.mockResolvedValue({ id: "emp-1", lockedUntil: null, revokedAt: null })
    mockIsPartTimeWorkSchedule.mockReturnValue(true as never)
    mockNormalizeWeekStart.mockReturnValue("2025-01-06" as never)
    mockGetDateForWeekDay.mockImplementation((weekStart: Date, dayOfWeek: number) => {
      return new Date(`2025-01-0${dayOfWeek}`)
    })
    mockShiftFitsAvailabilityDay.mockReturnValue(true as never)
    workingShiftRepo.listAll.mockResolvedValue([
      { id: "shift-existing", startTime: 540, endTime: 720 },
    ])
    mockMinutesToTime.mockImplementation((minutesValue: number) => {
      const timeByMinutes = new Map<number, string>([
        [540, "09:00"],
        [720, "12:00"],
        [780, "13:00"],
        [1020, "17:00"],
      ])
      return (timeByMinutes.get(minutesValue) ?? "00:00") as never
    })
  })

  it("UTCID01 - assigns shifts and skips off days successfully", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue({
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [
        { dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] },
        { dayOfWeek: 2, isBusyAllDay: false, slots: [{ startTime: 780, endTime: 1020 }] },
      ],
    })
    mockParseTimeToMinutes.mockImplementation((value: string) => {
      const minutesByTime = new Map<string, number>([
        ["09:00", 540],
        ["12:00", 720],
      ])
      return minutesByTime.get(value) as never
    })
    employeeShiftRepo.replacePartTimeOverrides.mockResolvedValue(undefined)
    mockAuditLog.mockResolvedValue(undefined as never)

    // Act
    const result = await service.assignShifts({
      availabilityId: "av-1",
      createdById: "admin-1",
      assignments: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 2, startTime: null, endTime: null },
      ],
    })

    // Assert
    expect(mockAssertSubmittedForAssign).toHaveBeenCalledWith(
      PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
    )
    expect(employeeRepo.findById).toHaveBeenCalledWith("emp-1")
    expect(employeeShiftRepo.replacePartTimeOverrides).toHaveBeenCalledWith(
      "emp-1",
      [
        new Date("2025-01-01"),
        new Date("2025-01-02"),
        new Date("2025-01-03"),
        new Date("2025-01-04"),
        new Date("2025-01-05"),
        new Date("2025-01-06"),
        new Date("2025-01-07"),
      ],
      [
        {
          employeeId: "emp-1",
          assignedDate: new Date("2025-01-01"),
          shiftId: "shift-existing",
          createdById: "admin-1",
        },
      ],
    )
    expect(mockAuditLog).toHaveBeenCalledWith({
      actorId: "admin-1",
      targetEmployeeId: "emp-1",
      action: "PART_TIME_SHIFTS_ASSIGNED",
      newValue: {
        availabilityId: "av-1",
        weekStart: "2025-01-06",
        assigned: 1,
        skipped: 1,
        suggestionDecision: "manual",
      },
    })
    expect(result).toEqual({ assigned: 1, skipped: 1 })
  })

  it("UTCID02 - throws when assignment time range is invalid", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue({
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    })
    mockParseTimeToMinutes.mockImplementation((value: string) => {
      const minutesByTime = new Map<string, number>([
        ["12:00", 720],
        ["09:00", 540],
      ])
      return minutesByTime.get(value) as never
    })

    // Act
    const act = service.assignShifts({
      availabilityId: "av-1",
      createdById: "admin-1",
      assignments: [{ dayOfWeek: 1, startTime: "12:00", endTime: "09:00" }],
    })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.ASSIGN_INVALID_RANGE,
      statusCode: HttpStatusCode.BAD_REQUEST,
    })
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws when shift does not fit availability slot", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue({
      id: "av-1",
      employeeId: "emp-1",
      weekStart: "2025-01-06",
      status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
      days: [{ dayOfWeek: 1, isBusyAllDay: false, slots: [{ startTime: 540, endTime: 720 }] }],
    })
    mockParseTimeToMinutes.mockImplementation((value: string) => {
      const minutesByTime = new Map<string, number>([
        ["09:00", 540],
        ["12:00", 720],
      ])
      return minutesByTime.get(value) as never
    })
    mockShiftFitsAvailabilityDay.mockReturnValue(false as never)

    // Act
    const act = service.assignShifts({
      availabilityId: "av-1",
      createdById: "admin-1",
      assignments: [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }],
    })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.SHIFT_NOT_IN_SLOT,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    })
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled()
  })

  it("UTCID04 - throws not found when availability does not exist", async () => {
    // Arrange
    availabilityRepo.findById.mockResolvedValue(null)

    // Act
    const act = service.assignShifts({
      availabilityId: "av-404",
      createdById: "admin-1",
      assignments: [],
    })

    // Assert
    await expect(act).rejects.toMatchObject({
      message: PART_TIME_AVAILABILITY_MESSAGES.NOT_FOUND,
      statusCode: HttpStatusCode.NOT_FOUND,
    })
    expect(employeeShiftRepo.replacePartTimeOverrides).not.toHaveBeenCalled()
  })
})

describe("PartTimeAvailabilityService.mapPayloadDays", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - maps HH:mm slots into minute-based payload days", () => {
    // Arrange
    mockParseTimeToMinutes
      .mockReturnValueOnce(540 as never)
      .mockReturnValueOnce(720 as never)
      .mockReturnValueOnce(780 as never)
      .mockReturnValueOnce(1020 as never)

    const payload: Array<{
      dayOfWeek: number
      isBusyAllDay: boolean
      slots: Array<{ startTime: string; endTime: string }>
    }> = [
      {
        dayOfWeek: 1,
        isBusyAllDay: false,
        slots: [
          { startTime: "09:00", endTime: "12:00" },
          { startTime: "13:00", endTime: "17:00" },
        ],
      },
    ]

    // Act
    const result = PartTimeAvailabilityService.mapPayloadDays(payload)

    // Assert
    expect(mockParseTimeToMinutes).toHaveBeenCalledWith("09:00")
    expect(mockParseTimeToMinutes).toHaveBeenCalledWith("12:00")
    expect(mockParseTimeToMinutes).toHaveBeenCalledWith("13:00")
    expect(mockParseTimeToMinutes).toHaveBeenCalledWith("17:00")
    expect(result).toEqual([
      {
        dayOfWeek: 1,
        isBusyAllDay: false,
        slots: [
          { startTime: 540, endTime: 720 },
          { startTime: 780, endTime: 1020 },
        ],
      },
    ])
  })

  it("UTCID02 - returns empty array when input days are empty", () => {
    // Arrange
    const payload: Array<{
      dayOfWeek: number
      isBusyAllDay: boolean
      slots: Array<{ startTime: string; endTime: string }>
    }> = []

    // Act
    const result = PartTimeAvailabilityService.mapPayloadDays(payload)

    // Assert
    expect(result).toEqual([])
    expect(mockParseTimeToMinutes).not.toHaveBeenCalled()
  })

  it("UTCID03 - propagates parse time errors", () => {
    // Arrange
    mockParseTimeToMinutes.mockImplementation(() => {
      throw new Error("invalid time")
    })
    const payload: Array<{
      dayOfWeek: number
      isBusyAllDay: boolean
      slots: Array<{ startTime: string; endTime: string }>
    }> = [
      {
        dayOfWeek: 1,
        isBusyAllDay: false,
        slots: [{ startTime: "invalid", endTime: "12:00" }],
      },
    ]

    // Act
    const act = (): ReturnType<typeof PartTimeAvailabilityService.mapPayloadDays> =>
      PartTimeAvailabilityService.mapPayloadDays(payload)

    // Assert
    expect(act).toThrow("invalid time")
  })
})
