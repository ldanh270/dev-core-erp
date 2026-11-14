/// <reference types="jest" />
import type { IEmployeeShiftRepository, IShiftScheduleRepository } from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  eachScheduleDate,
  formatScheduleDateKey,
  normalizeScheduleDate,
  resolveShiftFromSchedule,
} from "@/utils/schedule.util.ts"

import { jest } from "@jest/globals"

import { ScheduleService } from "../../services/schedule.service"

jest.mock("@/utils/error.util.ts", () => {
  class MockAppError extends Error {
    statusCode: number
    source: string

    constructor(message: string, statusCode: number, source: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.source = source
    }
  }

  return {
    AppError: MockAppError,
  }
})

jest.mock("@/utils/schedule.util.ts", () => ({
  eachScheduleDate: jest.fn(),
  formatScheduleDateKey: jest.fn(),
  normalizeScheduleDate: jest.fn(),
  resolveShiftFromSchedule: jest.fn(),
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
  },
}))

const mockedEachScheduleDate = eachScheduleDate as jest.MockedFunction<typeof eachScheduleDate>
const mockedFormatScheduleDateKey = formatScheduleDateKey as jest.MockedFunction<
  typeof formatScheduleDateKey
>
const mockedNormalizeScheduleDate = normalizeScheduleDate as jest.MockedFunction<
  typeof normalizeScheduleDate
>
const mockedResolveShiftFromSchedule = resolveShiftFromSchedule as jest.MockedFunction<
  typeof resolveShiftFromSchedule
>

type ScheduleRepoMock = jest.Mocked<IShiftScheduleRepository>
type EmployeeShiftRepoMock = jest.Mocked<IEmployeeShiftRepository>

const createScheduleRepo = (): ScheduleRepoMock =>
  ({
    assignSchedule: jest.fn(),
    getScheduleByEmployee: jest.fn(),
    listSchedulesByEmployee: jest.fn(),
    findEmployeeIdsWithActiveTemplateSchedule: jest.fn(),
  }) as unknown as ScheduleRepoMock

const createEmployeeShiftRepo = (): EmployeeShiftRepoMock =>
  ({
    listByEmployeesAndDateRange: jest.fn(),
    overrideShift: jest.fn(),
    generateShiftForDate: jest.fn(),
  }) as unknown as EmployeeShiftRepoMock

describe("ScheduleService.assignSchedule", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - returns assigned schedule on successful assignment", async () => {
    // Arrange
    const data = { employeeId: "emp-1", templateId: "tpl-1", startDate: "2024-01-01" }
    const assignedSchedule = {
      id: "schedule-1",
      employeeId: "emp-1",
      templateId: "tpl-1",
      template: { id: "tpl-1", name: "Morning", days: [] },
    }
    scheduleRepo.assignSchedule.mockResolvedValue(assignedSchedule as never)

    // Act
    const result = await service.assignSchedule(data as never)

    // Assert
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledWith(data)
    expect(result).toEqual(assignedSchedule)
  })

  it("UTCID02 - propagates repository validation error", async () => {
    // Arrange
    const data = { employeeId: "emp-1", templateId: "tpl-1", startDate: "2024-01-01" }
    const error = new Error("Invalid schedule assignment")
    scheduleRepo.assignSchedule.mockRejectedValue(error)

    // Act
    const action = service.assignSchedule(data as never)

    // Assert
    await expect(action).rejects.toThrow("Invalid schedule assignment")
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledWith(data)
  })

  it("UTCID03 - propagates repository internal error", async () => {
    // Arrange
    const data = { employeeId: "emp-2", templateId: "tpl-2", startDate: "2024-02-01" }
    const error = new Error("Database unavailable")
    scheduleRepo.assignSchedule.mockRejectedValue(error)

    // Act
    const action = service.assignSchedule(data as never)

    // Assert
    await expect(action).rejects.toThrow("Database unavailable")
    expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
  })
})

describe("ScheduleService.getScheduleForEmployee", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - returns employee schedule for a date", async () => {
    // Arrange
    const employeeId = "emp-1"
    const date = "2024-03-04"
    const schedule = {
      id: "schedule-1",
      employeeId,
      days: [],
      template: null,
    }
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(schedule as never)

    // Act
    const result = await service.getScheduleForEmployee(employeeId, date)

    // Assert
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(1)
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date)
    expect(result).toEqual(schedule)
  })

  it("UTCID02 - returns null when no schedule exists", async () => {
    // Arrange
    const employeeId = "emp-2"
    const date = "2024-03-05"
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(null)

    // Act
    const result = await service.getScheduleForEmployee(employeeId, date)

    // Assert
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date)
    expect(result).toBeNull()
  })

  it("UTCID03 - propagates repository error when fetching schedule", async () => {
    // Arrange
    const employeeId = "emp-3"
    const date = "2024-03-06"
    scheduleRepo.getScheduleByEmployee.mockRejectedValue(new Error("Query failed"))

    // Act
    const action = service.getScheduleForEmployee(employeeId, date)

    // Assert
    await expect(action).rejects.toThrow("Query failed")
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, date)
  })
})

describe("ScheduleService.listSchedulesForEmployee", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - returns all schedules for an employee", async () => {
    // Arrange
    const employeeId = "emp-1"
    const schedules = [
      { id: "schedule-1", employeeId, days: [], template: null },
      { id: "schedule-2", employeeId, days: [], template: null },
    ]
    scheduleRepo.listSchedulesByEmployee.mockResolvedValue(schedules as never)

    // Act
    const result = await service.listSchedulesForEmployee(employeeId)

    // Assert
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledTimes(1)
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId)
    expect(result).toEqual(schedules)
  })

  it("UTCID02 - returns empty list when employee has no schedules", async () => {
    // Arrange
    const employeeId = "emp-2"
    scheduleRepo.listSchedulesByEmployee.mockResolvedValue([] as never)

    // Act
    const result = await service.listSchedulesForEmployee(employeeId)

    // Assert
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId)
    expect(result).toEqual([])
  })

  it("UTCID03 - propagates repository error when listing schedules", async () => {
    // Arrange
    const employeeId = "emp-3"
    scheduleRepo.listSchedulesByEmployee.mockRejectedValue(new Error("List failed"))

    // Act
    const action = service.listSchedulesForEmployee(employeeId)

    // Assert
    await expect(action).rejects.toThrow("List failed")
    expect(scheduleRepo.listSchedulesByEmployee).toHaveBeenCalledWith(employeeId)
  })
})

describe("ScheduleService.getEmployeeShifts", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - returns employee shifts in date range", async () => {
    // Arrange
    const employeeId = "emp-1"
    const startDate = new Date("2024-04-01T00:00:00.000Z")
    const endDate = new Date("2024-04-07T00:00:00.000Z")
    const shifts = [
      {
        id: "shift-row-1",
        employeeId,
        assignedDate: new Date("2024-04-01T00:00:00.000Z"),
        isOverride: false,
        revokedAt: null,
        shift: { id: "shift-1", name: "Morning" },
      },
    ]
    employeeShiftRepo.listByEmployeesAndDateRange.mockResolvedValue(shifts as never)

    // Act
    const result = await service.getEmployeeShifts(employeeId, startDate, endDate)

    // Assert
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledTimes(1)
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      [employeeId],
      startDate,
      endDate,
    )
    expect(result).toEqual(shifts)
  })

  it("UTCID02 - returns empty array when no shifts exist", async () => {
    // Arrange
    const employeeId = "emp-2"
    const startDate = new Date("2024-04-08T00:00:00.000Z")
    const endDate = new Date("2024-04-14T00:00:00.000Z")
    employeeShiftRepo.listByEmployeesAndDateRange.mockResolvedValue([] as never)

    // Act
    const result = await service.getEmployeeShifts(employeeId, startDate, endDate)

    // Assert
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      [employeeId],
      startDate,
      endDate,
    )
    expect(result).toEqual([])
  })

  it("UTCID03 - propagates repository error when fetching shifts", async () => {
    // Arrange
    const employeeId = "emp-3"
    const startDate = new Date("2024-04-15T00:00:00.000Z")
    const endDate = new Date("2024-04-21T00:00:00.000Z")
    employeeShiftRepo.listByEmployeesAndDateRange.mockRejectedValue(new Error("Shift query failed"))

    // Act
    const action = service.getEmployeeShifts(employeeId, startDate, endDate)

    // Assert
    await expect(action).rejects.toThrow("Shift query failed")
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      [employeeId],
      startDate,
      endDate,
    )
  })
})

describe("ScheduleService.overrideEmployeeShift", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - overrides employee shift successfully", async () => {
    // Arrange
    const data = {
      employeeId: "emp-1",
      assignedDate: "2024-06-01",
      shiftId: "shift-2",
      createdById: "admin-1",
    }
    const overrideResult = {
      id: "override-1",
      employeeId: "emp-1",
      assignedDate: "2024-06-01",
      shiftId: "shift-2",
      revokedAt: null,
    }
    employeeShiftRepo.overrideShift.mockResolvedValue(overrideResult as never)

    // Act
    const result = await service.overrideEmployeeShift(data as never)

    // Assert
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledTimes(1)
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledWith(data)
    expect(result).toEqual(overrideResult)
  })

  it("UTCID02 - propagates repository validation error during override", async () => {
    // Arrange
    const data = {
      employeeId: "emp-2",
      assignedDate: "2024-06-02",
      shiftId: "shift-3",
      createdById: "admin-2",
    }
    employeeShiftRepo.overrideShift.mockRejectedValue(new Error("Invalid override"))

    // Act
    const action = service.overrideEmployeeShift(data as never)

    // Assert
    await expect(action).rejects.toThrow("Invalid override")
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledWith(data)
  })

  it("UTCID03 - propagates repository internal error during override", async () => {
    // Arrange
    const data = {
      employeeId: "emp-3",
      assignedDate: "2024-06-03",
      shiftId: "shift-4",
      createdById: "admin-3",
    }
    employeeShiftRepo.overrideShift.mockRejectedValue(new Error("Override persistence failed"))

    // Act
    const action = service.overrideEmployeeShift(data as never)

    // Assert
    await expect(action).rejects.toThrow("Override persistence failed")
    expect(employeeShiftRepo.overrideShift).toHaveBeenCalledTimes(1)
  })
})

describe("ScheduleService.previewGeneratedShifts", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - returns preview items with pending, existing, override, and no_schedule statuses", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1", "emp-2"],
      startDate: "2024-07-01",
      endDate: "2024-07-02",
      createdById: "admin-1",
    }
    const start = new Date("2024-07-01T00:00:00.000Z")
    const end = new Date("2024-07-02T00:00:00.000Z")
    const day1 = new Date("2024-07-01T00:00:00.000Z")
    const day2 = new Date("2024-07-02T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockImplementation((date: Date) => {
      if (date.toISOString().startsWith("2024-07-01")) {
        return start
      }
      return end
    })
    mockedEachScheduleDate.mockReturnValue([day1, day2] as never)
    mockedFormatScheduleDateKey.mockImplementation((date: Date) => {
      if (date.getTime() === day1.getTime()) {
        return "2024-07-01"
      }
      return "2024-07-02"
    })

    employeeShiftRepo.listByEmployeesAndDateRange.mockResolvedValue([
      {
        id: "es-1",
        employeeId: "emp-1",
        assignedDate: day2,
        isOverride: false,
        revokedAt: null,
        shift: { id: "existing-shift", name: "Evening" },
      },
      {
        id: "es-2",
        employeeId: "emp-2",
        assignedDate: day1,
        isOverride: true,
        revokedAt: null,
        shift: { id: "override-shift", name: "Night" },
      },
    ] as never)

    scheduleRepo.getScheduleByEmployee
      .mockResolvedValueOnce({ id: "schedule-1" } as never)
      .mockResolvedValueOnce({ id: "schedule-2" } as never)
      .mockResolvedValueOnce({ id: "schedule-3" } as never)
      .mockResolvedValueOnce({ id: "schedule-4" } as never)

    mockedResolveShiftFromSchedule
      .mockReturnValueOnce({
        shiftId: "planned-1",
        shift: { id: "planned-1", name: "Morning" },
      } as never)
      .mockReturnValueOnce({
        shiftId: "planned-3",
        shift: { id: "planned-3", name: "Night" },
      } as never)
      .mockReturnValueOnce({
        shiftId: "planned-2",
        shift: { id: "planned-2", name: "Evening" },
      } as never)
      .mockReturnValueOnce(null as never)

    // Act
    const result = await service.previewGeneratedShifts(data as never)

    // Assert
    expect(mockedNormalizeScheduleDate).toHaveBeenCalledTimes(2)
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      data.employeeIds,
      start,
      end,
    )
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(4)
    expect(mockedResolveShiftFromSchedule).toHaveBeenCalledTimes(4)
    expect(result).toEqual([
      {
        employeeId: "emp-1",
        items: [
          {
            date: "2024-07-01",
            shiftId: "planned-1",
            shift: { id: "planned-1", name: "Morning" },
            status: "pending",
          },
          {
            date: "2024-07-02",
            shiftId: "planned-2",
            shift: { id: "planned-2", name: "Evening" },
            status: "existing",
          },
        ],
      },
      {
        employeeId: "emp-2",
        items: [
          {
            date: "2024-07-01",
            shiftId: "planned-3",
            shift: { id: "planned-3", name: "Night" },
            status: "override",
          },
          {
            date: "2024-07-02",
            shiftId: null,
            shift: null,
            status: "no_schedule",
          },
        ],
      },
    ])
  })

  it("UTCID02 - throws AppError when end date is before start date", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1"],
      startDate: "2024-07-10",
      endDate: "2024-07-01",
      createdById: "admin-1",
    }
    const start = new Date("2024-07-10T00:00:00.000Z")
    const end = new Date("2024-07-01T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end)

    // Act
    const action = service.previewGeneratedShifts(data as never)

    // Assert
    await expect(action).rejects.toBeInstanceOf(AppError)
    await expect(action).rejects.toMatchObject({
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      statusCode: 400,
      source: "service",
    })
    expect(employeeShiftRepo.listByEmployeesAndDateRange).not.toHaveBeenCalled()
  })

  it("UTCID03 - propagates repository error when loading existing shifts for preview", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1"],
      startDate: "2024-07-01",
      endDate: "2024-07-02",
      createdById: "admin-1",
    }
    const start = new Date("2024-07-01T00:00:00.000Z")
    const end = new Date("2024-07-02T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end)
    employeeShiftRepo.listByEmployeesAndDateRange.mockRejectedValue(
      new Error("Preview existing shifts failed"),
    )

    // Act
    const action = service.previewGeneratedShifts(data as never)

    // Assert
    await expect(action).rejects.toThrow("Preview existing shifts failed")
    expect(employeeShiftRepo.listByEmployeesAndDateRange).toHaveBeenCalledWith(
      data.employeeIds,
      start,
      end,
    )
  })
})

describe("ScheduleService.generateShifts", () => {
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let service: ScheduleService

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()
    scheduleRepo = createScheduleRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    service = new ScheduleService(scheduleRepo, employeeShiftRepo)

    // Act

    // Assert
  })

  it("UTCID01 - generates shifts and counts created, updated, and skipped results", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1", "emp-2"],
      startDate: "2024-08-01",
      endDate: "2024-08-02",
      createdById: "admin-1",
    }
    const start = new Date("2024-08-01T00:00:00.000Z")
    const end = new Date("2024-08-02T00:00:00.000Z")
    const day1 = new Date("2024-08-01T00:00:00.000Z")
    const day2 = new Date("2024-08-02T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end)
    mockedEachScheduleDate.mockReturnValue([day1, day2] as never)

    // Four employee/day cells cover created, updated, no-schedule, and skipped outcomes.
    scheduleRepo.getScheduleByEmployee
      .mockResolvedValueOnce({ id: "schedule-1" } as never)
      .mockResolvedValueOnce({ id: "schedule-2" } as never)
      .mockResolvedValueOnce({ id: "schedule-3" } as never)
      .mockResolvedValueOnce({ id: "schedule-4" } as never)

    mockedResolveShiftFromSchedule
      .mockReturnValueOnce({
        shiftId: "shift-a",
        shift: { id: "shift-a", name: "Morning" },
      } as never)
      .mockReturnValueOnce({
        shiftId: "shift-b",
        shift: { id: "shift-b", name: "Evening" },
      } as never)
      .mockReturnValueOnce(null as never)
      .mockReturnValueOnce({ shiftId: "shift-c", shift: { id: "shift-c", name: "Night" } } as never)

    employeeShiftRepo.generateShiftForDate
      .mockResolvedValueOnce("created" as never)
      .mockResolvedValueOnce("updated" as never)
      .mockResolvedValueOnce("skipped" as never)

    // Act
    const result = await service.generateShifts(data as never)

    // Assert
    expect(mockedNormalizeScheduleDate).toHaveBeenCalledTimes(2)
    expect(mockedEachScheduleDate).toHaveBeenCalledWith(start, end)
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledTimes(4)
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledTimes(3)
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenNthCalledWith(
      1,
      "emp-1",
      day1,
      "shift-a",
      "schedule-1",
      "admin-1",
    )
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenNthCalledWith(
      2,
      "emp-1",
      day2,
      "shift-b",
      "schedule-2",
      "admin-1",
    )
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenNthCalledWith(
      3,
      "emp-2",
      day2,
      "shift-c",
      "schedule-4",
      "admin-1",
    )
    expect(result).toEqual({ created: 1, updated: 1, skipped: 2 })
  })

  it("UTCID02 - throws AppError when createdById is missing", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1"],
      startDate: "2024-08-01",
      endDate: "2024-08-02",
      createdById: null,
    }

    // Act
    const action = service.generateShifts(data as never)

    // Assert
    await expect(action).rejects.toBeInstanceOf(AppError)
    await expect(action).rejects.toMatchObject({
      message: "Thiếu thông tin người thực hiện",
      statusCode: 400,
      source: "service",
    })
    expect(mockedNormalizeScheduleDate).not.toHaveBeenCalled()
    expect(employeeShiftRepo.generateShiftForDate).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws AppError when end date is before start date", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1"],
      startDate: "2024-08-10",
      endDate: "2024-08-01",
      createdById: "admin-1",
    }
    const start = new Date("2024-08-10T00:00:00.000Z")
    const end = new Date("2024-08-01T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end)

    // Act
    const action = service.generateShifts(data as never)

    // Assert
    await expect(action).rejects.toBeInstanceOf(AppError)
    await expect(action).rejects.toMatchObject({
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      statusCode: 400,
      source: "service",
    })
    expect(mockedEachScheduleDate).not.toHaveBeenCalled()
    expect(employeeShiftRepo.generateShiftForDate).not.toHaveBeenCalled()
  })

  it("UTCID04 - propagates repository error while generating shift for a date", async () => {
    // Arrange
    const data = {
      employeeIds: ["emp-1"],
      startDate: "2024-08-01",
      endDate: "2024-08-01",
      createdById: "admin-1",
    }
    const start = new Date("2024-08-01T00:00:00.000Z")
    const end = new Date("2024-08-01T00:00:00.000Z")
    const day1 = new Date("2024-08-01T00:00:00.000Z")

    mockedNormalizeScheduleDate.mockReturnValueOnce(start).mockReturnValueOnce(end)
    mockedEachScheduleDate.mockReturnValue([day1] as never)
    scheduleRepo.getScheduleByEmployee.mockResolvedValue({ id: "schedule-1" } as never)
    mockedResolveShiftFromSchedule.mockReturnValue({
      shiftId: "shift-a",
      shift: { id: "shift-a", name: "Morning" },
    } as never)
    employeeShiftRepo.generateShiftForDate.mockRejectedValue(new Error("Generation failed"))

    // Act
    const action = service.generateShifts(data as never)

    // Assert
    await expect(action).rejects.toThrow("Generation failed")
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith("emp-1", day1)
    expect(employeeShiftRepo.generateShiftForDate).toHaveBeenCalledWith(
      "emp-1",
      day1,
      "shift-a",
      "schedule-1",
      "admin-1",
    )
  })
})
