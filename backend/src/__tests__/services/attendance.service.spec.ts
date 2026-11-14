/// <reference types="jest" />
import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import type {
  IAttendanceRecordDTO,
  IAttendanceRecordQueryDTO,
  IAttendanceRepository,
  IHolidayRepository,
} from "@/types/attendance.types.ts"
import type { IEmployeeRepository } from "@/types/employee.types.ts"
import type {
  IEmployeeShiftRepository,
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { assertWithinShiftGps } from "@/utils/attendance/attendance-gps.util.ts"
import { computeAttendanceMetrics } from "@/utils/attendance/attendance-metrics.util.ts"
import {
  findActiveAttendanceRecord,
  normalizeAttendanceDate,
} from "@/utils/attendance/attendance-record.util.ts"
import {
  assertCheckInWindow,
  getMinutesFromDateTime,
  isActualShiftMatched,
  isBeforeCheckOutWindow,
  isWithinShiftSelectionWindow,
} from "@/utils/attendance/attendance-shift.util.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { resolveShiftFromSchedule } from "@/utils/schedule.util.ts"

import { AttendanceService } from "../../services/attendance.service"

jest.mock("@/utils/employee/is-part-time-work-schedule.util.ts", () => ({
  isPartTimeWorkSchedule: jest.fn(),
}))

jest.mock("@/configs/messages/attendance.message.ts", () => ({
  ATTENDANCE_ERROR_MESSAGES: {
    ALREADY_CHECKED_IN: "ALREADY_CHECKED_IN",
    PT_NO_ASSIGNED_SHIFT: "PT_NO_ASSIGNED_SHIFT",
    SHIFT_NOT_FOUND: "SHIFT_NOT_FOUND",
    NO_SCHEDULE_TODAY: "NO_SCHEDULE_TODAY",
    CHECK_OUT_BEFORE_IN: "CHECK_OUT_BEFORE_IN",
    CHECK_OUT_TOO_EARLY: "CHECK_OUT_TOO_EARLY",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    BAD_REQUEST: 400,
  },
}))

jest.mock("@/constants/attendance.constants.ts", () => ({
  ATTENDANCE_LAYERS: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/types/attendance.types.ts", () => ({}))
jest.mock("@/types/shift.types.ts", () => ({}))
jest.mock("@/types/employee.types.ts", () => ({}))

jest.mock("@/utils/attendance/attendance-metrics.util.ts", () => ({
  computeAttendanceMetrics: jest.fn(),
}))

jest.mock("@/utils/attendance/attendance-gps.util.ts", () => ({
  assertWithinShiftGps: jest.fn(),
}))

jest.mock("@/utils/attendance/attendance-record.util.ts", () => ({
  findActiveAttendanceRecord: jest.fn(),
  normalizeAttendanceDate: jest.fn(),
}))

jest.mock("@/utils/attendance/attendance-shift.util.ts", () => ({
  assertCheckInWindow: jest.fn(),
  getMinutesFromDateTime: jest.fn(),
  isActualShiftMatched: jest.fn(),
  isBeforeCheckOutWindow: jest.fn(),
  isWithinShiftSelectionWindow: jest.fn(),
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class MockAppError extends Error {
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

jest.mock("@/utils/schedule.util.ts", () => ({
  resolveShiftFromSchedule: jest.fn(),
}))

const mockedIsPartTimeWorkSchedule = isPartTimeWorkSchedule as jest.MockedFunction<
  typeof isPartTimeWorkSchedule
>
const mockedComputeAttendanceMetrics = computeAttendanceMetrics as jest.MockedFunction<
  typeof computeAttendanceMetrics
>
const mockedAssertWithinShiftGps = assertWithinShiftGps as jest.MockedFunction<
  typeof assertWithinShiftGps
>
const mockedFindActiveAttendanceRecord = findActiveAttendanceRecord as jest.MockedFunction<
  typeof findActiveAttendanceRecord
>
const mockedNormalizeAttendanceDate = normalizeAttendanceDate as jest.MockedFunction<
  typeof normalizeAttendanceDate
>
const mockedAssertCheckInWindow = assertCheckInWindow as jest.MockedFunction<
  typeof assertCheckInWindow
>
const mockedGetMinutesFromDateTime = getMinutesFromDateTime as jest.MockedFunction<
  typeof getMinutesFromDateTime
>
const mockedIsActualShiftMatched = isActualShiftMatched as jest.MockedFunction<
  typeof isActualShiftMatched
>
const mockedIsBeforeCheckOutWindow = isBeforeCheckOutWindow as jest.MockedFunction<
  typeof isBeforeCheckOutWindow
>
const mockedIsWithinShiftSelectionWindow = isWithinShiftSelectionWindow as jest.MockedFunction<
  typeof isWithinShiftSelectionWindow
>
const mockedResolveShiftFromSchedule = resolveShiftFromSchedule as jest.MockedFunction<
  typeof resolveShiftFromSchedule
>

type AttendanceRepoMock = jest.Mocked<IAttendanceRepository>
type EmployeeShiftRepoMock = jest.Mocked<IEmployeeShiftRepository>
type ScheduleRepoMock = jest.Mocked<IShiftScheduleRepository>
type HolidayRepoMock = jest.Mocked<IHolidayRepository>
type WorkingShiftRepoMock = jest.Mocked<IWorkingShiftRepository>
type EmployeeRepoMock = jest.Mocked<IEmployeeRepository>

const createAttendanceRepo = (): AttendanceRepoMock =>
  ({
    findByEmployeeAndDate: jest.fn(),
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    queryRecords: jest.fn(),
  }) as unknown as AttendanceRepoMock

const createEmployeeShiftRepo = (): EmployeeShiftRepoMock =>
  ({
    getShiftForEmployeeDate: jest.fn(),
    ensureShiftForEmployeeDate: jest.fn(),
  }) as unknown as EmployeeShiftRepoMock

const createScheduleRepo = (): ScheduleRepoMock =>
  ({
    getScheduleByEmployee: jest.fn(),
  }) as unknown as ScheduleRepoMock

const createHolidayRepo = (): HolidayRepoMock =>
  ({
    checkIsHoliday: jest.fn(),
  }) as unknown as HolidayRepoMock

const createWorkingShiftRepo = (): WorkingShiftRepoMock =>
  ({
    listAll: jest.fn(),
    findById: jest.fn(),
  }) as unknown as WorkingShiftRepoMock

const createEmployeeRepo = (): EmployeeRepoMock =>
  ({
    findById: jest.fn(),
  }) as unknown as EmployeeRepoMock

describe("AttendanceService.checkIn", () => {
  let attendanceRepo: AttendanceRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let scheduleRepo: ScheduleRepoMock
  let holidayRepo: HolidayRepoMock
  let workingShiftRepo: WorkingShiftRepoMock
  let employeeRepo: EmployeeRepoMock
  let service: AttendanceService

  const employeeId = "emp-1"
  const createdById = "admin-1"
  const location = { lat: 1.23, lng: 4.56 }
  const today = new Date("2024-01-01T00:00:00.000Z")
  const now = new Date("2024-01-01T08:00:00.000Z")

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(now)

    attendanceRepo = createAttendanceRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    scheduleRepo = createScheduleRepo()
    holidayRepo = createHolidayRepo()
    workingShiftRepo = createWorkingShiftRepo()
    employeeRepo = createEmployeeRepo()

    service = new AttendanceService(
      attendanceRepo,
      employeeShiftRepo,
      scheduleRepo,
      holidayRepo,
      workingShiftRepo,
      employeeRepo,
    )

    mockedNormalizeAttendanceDate.mockReturnValue(today)
    mockedFindActiveAttendanceRecord.mockResolvedValue(null)
    mockedGetMinutesFromDateTime.mockReturnValue(480)
    mockedIsPartTimeWorkSchedule.mockReturnValue(false)
    mockedAssertCheckInWindow.mockImplementation(() => undefined)
    mockedAssertWithinShiftGps.mockImplementation(() => undefined)
    holidayRepo.checkIsHoliday.mockResolvedValue(false)
    mockedResolveShiftFromSchedule.mockReturnValue(null)
    mockedIsWithinShiftSelectionWindow.mockReturnValue(false)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("UTCID01 - returns attendance record for full-time employee using fallback shift", async () => {
    // Arrange
    const employee = { id: employeeId, employmentType: "FULL_TIME" }
    const fallbackShift = { id: "shift-1", isActive: true }
    const employeeShift = { id: "emp-shift-1", shiftId: "shift-1" }
    const attendanceRecord = {
      id: "att-1",
      employeeId,
      checkInAt: now.toISOString(),
      checkOutAt: null,
    }

    employeeRepo.findById.mockResolvedValue(employee as never)
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null as never)
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(null as never)
    workingShiftRepo.listAll.mockResolvedValue([fallbackShift] as never)
    workingShiftRepo.findById.mockResolvedValue(fallbackShift as never)
    employeeShiftRepo.ensureShiftForEmployeeDate.mockResolvedValue(employeeShift as never)
    attendanceRepo.checkIn.mockResolvedValue(attendanceRecord as never)

    // Act
    const result = await service.checkIn(employeeId, location, createdById)

    // Assert
    expect(mockedNormalizeAttendanceDate).toHaveBeenCalledWith(now)
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now)
    expect(employeeRepo.findById).toHaveBeenCalledWith(employeeId)
    expect(employeeShiftRepo.getShiftForEmployeeDate).toHaveBeenCalledWith(employeeId, today, {
      atMinutes: 480,
    })
    expect(scheduleRepo.getScheduleByEmployee).toHaveBeenCalledWith(employeeId, today)
    expect(workingShiftRepo.listAll).toHaveBeenCalledTimes(1)
    expect(workingShiftRepo.findById).toHaveBeenCalledWith("shift-1")
    expect(mockedAssertCheckInWindow).toHaveBeenCalledWith(now, today, fallbackShift)
    expect(mockedAssertWithinShiftGps).toHaveBeenCalledWith(location, fallbackShift)
    expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenCalledWith(
      employeeId,
      today,
      "shift-1",
      createdById,
    )
    expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(today)
    expect(attendanceRepo.checkIn).toHaveBeenCalledWith(employeeId, location, "emp-shift-1")
    expect(result).toEqual(attendanceRecord)
  })

  it("UTCID02 - throws conflict when employee already has an active check-in record", async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue({
      id: "att-open",
      checkInAt: "2024-01-01T07:00:00.000Z",
      checkOutAt: null,
    } as IAttendanceRecordDTO)

    // Act
    const act = service.checkIn(employeeId, location, createdById)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
      statusCode: HttpStatusCode.CONFLICT,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
    expect(employeeRepo.findById).not.toHaveBeenCalled()
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws unprocessable entity for part-time employee without assigned shift", async () => {
    // Arrange
    const employee = { id: employeeId, employmentType: "PART_TIME" }
    employeeRepo.findById.mockResolvedValue(employee as never)
    mockedIsPartTimeWorkSchedule.mockReturnValue(true)
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null as never)

    // Act
    const act = service.checkIn(employeeId, location, createdById)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.PT_NO_ASSIGNED_SHIFT,
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
    expect(workingShiftRepo.findById).not.toHaveBeenCalled()
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled()
  })

  it("UTCID04 - throws bad request when weekly schedule exists but no shift is resolved for today", async () => {
    // Arrange
    const employee = { id: employeeId, employmentType: "FULL_TIME" }
    const schedule = { id: "schedule-1", workingShiftId: null }
    employeeRepo.findById.mockResolvedValue(employee as never)
    employeeShiftRepo.getShiftForEmployeeDate.mockResolvedValue(null as never)
    scheduleRepo.getScheduleByEmployee.mockResolvedValue(schedule as never)
    mockedResolveShiftFromSchedule.mockReturnValue(null)

    // Act
    const act = service.checkIn(employeeId, location, createdById)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.NO_SCHEDULE_TODAY,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
    expect(workingShiftRepo.listAll).not.toHaveBeenCalled()
    expect(attendanceRepo.checkIn).not.toHaveBeenCalled()
  })
})

describe("AttendanceService.checkOut", () => {
  let attendanceRepo: AttendanceRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let scheduleRepo: ScheduleRepoMock
  let holidayRepo: HolidayRepoMock
  let workingShiftRepo: WorkingShiftRepoMock
  let employeeRepo: EmployeeRepoMock
  let service: AttendanceService

  const employeeId = "emp-1"
  const location = { lat: 1.23, lng: 4.56 }
  const now = new Date("2024-01-01T17:30:00.000Z")

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(now)

    attendanceRepo = createAttendanceRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    scheduleRepo = createScheduleRepo()
    holidayRepo = createHolidayRepo()
    workingShiftRepo = createWorkingShiftRepo()
    employeeRepo = createEmployeeRepo()

    service = new AttendanceService(
      attendanceRepo,
      employeeShiftRepo,
      scheduleRepo,
      holidayRepo,
      workingShiftRepo,
      employeeRepo,
    )

    mockedAssertWithinShiftGps.mockImplementation(() => undefined)
    mockedIsBeforeCheckOutWindow.mockReturnValue(false)
    mockedComputeAttendanceMetrics.mockReturnValue({
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 30,
    } as never)
    mockedGetMinutesFromDateTime.mockImplementation((date: Date) => {
      if (date instanceof Date && date.toISOString() === "2024-01-01T09:00:00.000Z") {
        return 540
      }
      return 1050
    })
    mockedIsActualShiftMatched.mockReturnValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("UTCID01 - returns updated attendance record with computed metrics on successful check-out", async () => {
    // Arrange
    const shift = { id: "shift-1" }
    const activeRecord = {
      id: "att-1",
      checkInAt: "2024-01-01T09:00:00.000Z",
      checkOutAt: null,
      employeeShift: {
        id: "emp-shift-1",
        shift,
      },
    }
    const updatedRecord = {
      ...activeRecord,
      checkOutAt: now.toISOString(),
    }

    mockedFindActiveAttendanceRecord.mockResolvedValue(activeRecord as IAttendanceRecordDTO)
    attendanceRepo.checkOut.mockResolvedValue(updatedRecord as never)

    // Act
    const result = await service.checkOut(employeeId, location)

    // Assert
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now)
    expect(mockedIsBeforeCheckOutWindow).toHaveBeenCalledWith(now, activeRecord, shift)
    expect(mockedAssertWithinShiftGps).toHaveBeenCalledWith(location, shift)
    expect(mockedComputeAttendanceMetrics).toHaveBeenCalledWith(activeRecord, shift, now)
    expect(mockedIsActualShiftMatched).toHaveBeenCalledWith(540, 1050, shift)
    expect(attendanceRepo.checkOut).toHaveBeenCalledWith(
      "att-1",
      location,
      {
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 30,
      },
      {
        actualEndTime: 1050,
        isMatched: true,
      },
    )
    expect(result).toEqual(updatedRecord)
  })

  it("UTCID02 - throws bad request when there is no active attendance record", async () => {
    // Arrange
    mockedFindActiveAttendanceRecord.mockResolvedValue(null)

    // Act
    const act = service.checkOut(employeeId, location)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_BEFORE_IN,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
    expect(attendanceRepo.checkOut).not.toHaveBeenCalled()
  })

  it("UTCID03 - throws bad request when employee tries to check out too early", async () => {
    // Arrange
    const activeRecord = {
      id: "att-1",
      checkInAt: "2024-01-01T09:00:00.000Z",
      checkOutAt: null,
      employeeShift: {
        id: "emp-shift-1",
        shift: { id: "shift-1" },
      },
    }
    mockedFindActiveAttendanceRecord.mockResolvedValue(activeRecord as IAttendanceRecordDTO)
    mockedIsBeforeCheckOutWindow.mockReturnValue(true)

    // Act
    const act = service.checkOut(employeeId, location)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
      statusCode: HttpStatusCode.BAD_REQUEST,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
    expect(mockedAssertWithinShiftGps).not.toHaveBeenCalled()
    expect(attendanceRepo.checkOut).not.toHaveBeenCalled()
  })

  it("UTCID04 - propagates GPS validation error during check-out", async () => {
    // Arrange
    const activeRecord = {
      id: "att-1",
      checkInAt: "2024-01-01T09:00:00.000Z",
      checkOutAt: null,
      employeeShift: {
        id: "emp-shift-1",
        shift: { id: "shift-1" },
      },
    }
    const gpsError = new AppError("GPS_OUT_OF_RANGE", 400, "SERVICE")
    mockedFindActiveAttendanceRecord.mockResolvedValue(activeRecord as IAttendanceRecordDTO)
    mockedAssertWithinShiftGps.mockImplementation(() => {
      throw gpsError
    })

    // Act
    const act = service.checkOut(employeeId, location)

    // Assert
    await expect(act).rejects.toBe(gpsError)
    expect(mockedComputeAttendanceMetrics).not.toHaveBeenCalled()
    expect(attendanceRepo.checkOut).not.toHaveBeenCalled()
  })
})

describe("AttendanceService.scan", () => {
  let attendanceRepo: AttendanceRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let scheduleRepo: ScheduleRepoMock
  let holidayRepo: HolidayRepoMock
  let workingShiftRepo: WorkingShiftRepoMock
  let employeeRepo: EmployeeRepoMock
  let service: AttendanceService

  const employeeId = "emp-1"
  const createdById = "admin-1"
  const location = { lat: 1.23, lng: 4.56 }
  const now = new Date("2024-01-01T12:00:00.000Z")

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(now)

    attendanceRepo = createAttendanceRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    scheduleRepo = createScheduleRepo()
    holidayRepo = createHolidayRepo()
    workingShiftRepo = createWorkingShiftRepo()
    employeeRepo = createEmployeeRepo()

    service = new AttendanceService(
      attendanceRepo,
      employeeShiftRepo,
      scheduleRepo,
      holidayRepo,
      workingShiftRepo,
      employeeRepo,
    )

    mockedIsBeforeCheckOutWindow.mockReturnValue(false)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("UTCID01 - delegates to check-in when there is no active record", async () => {
    // Arrange
    const expectedRecord = {
      id: "att-1",
      checkInAt: now.toISOString(),
      checkOutAt: null,
    }
    mockedFindActiveAttendanceRecord.mockResolvedValue(null)
    const checkInSpy = jest.spyOn(service, "checkIn").mockResolvedValue(expectedRecord as never)

    // Act
    const result = await service.scan(employeeId, location, createdById)

    // Assert
    expect(mockedFindActiveAttendanceRecord).toHaveBeenCalledWith(attendanceRepo, employeeId, now)
    expect(checkInSpy).toHaveBeenCalledWith(employeeId, location, createdById)
    expect(result).toEqual(expectedRecord)
  })

  it("UTCID02 - throws conflict when already checked in and check-out window is not open yet", async () => {
    // Arrange
    const activeRecord = {
      id: "att-1",
      checkInAt: "2024-01-01T09:00:00.000Z",
      checkOutAt: null,
      employeeShift: {
        id: "emp-shift-1",
        shift: { id: "shift-1" },
      },
    }
    mockedFindActiveAttendanceRecord.mockResolvedValue(activeRecord as IAttendanceRecordDTO)
    mockedIsBeforeCheckOutWindow.mockReturnValue(true)

    // Act
    const act = service.scan(employeeId, location, createdById)

    // Assert
    await expect(act).rejects.toMatchObject({
      message: ATTENDANCE_ERROR_MESSAGES.ALREADY_CHECKED_IN,
      statusCode: HttpStatusCode.CONFLICT,
      layer: ATTENDANCE_LAYERS.SERVICE,
    })
  })

  it("UTCID03 - propagates check-out error when active record exists and check-out fails", async () => {
    // Arrange
    const activeRecord = {
      id: "att-1",
      checkInAt: "2024-01-01T09:00:00.000Z",
      checkOutAt: null,
      employeeShift: {
        id: "emp-shift-1",
        shift: { id: "shift-1" },
      },
    }
    const checkoutError = new AppError(
      ATTENDANCE_ERROR_MESSAGES.CHECK_OUT_TOO_EARLY,
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    )
    mockedFindActiveAttendanceRecord.mockResolvedValue(activeRecord as IAttendanceRecordDTO)
    mockedIsBeforeCheckOutWindow.mockReturnValue(false)
    jest.spyOn(service, "checkOut").mockRejectedValue(checkoutError)

    // Act
    const act = service.scan(employeeId, location, createdById)

    // Assert
    await expect(act).rejects.toBe(checkoutError)
  })
})

describe("AttendanceService.getAttendanceRecords", () => {
  let attendanceRepo: AttendanceRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let scheduleRepo: ScheduleRepoMock
  let holidayRepo: HolidayRepoMock
  let workingShiftRepo: WorkingShiftRepoMock
  let employeeRepo: EmployeeRepoMock
  let service: AttendanceService

  beforeEach(() => {
    jest.clearAllMocks()

    attendanceRepo = createAttendanceRepo()
    employeeShiftRepo = createEmployeeShiftRepo()
    scheduleRepo = createScheduleRepo()
    holidayRepo = createHolidayRepo()
    workingShiftRepo = createWorkingShiftRepo()
    employeeRepo = createEmployeeRepo()

    service = new AttendanceService(
      attendanceRepo,
      employeeShiftRepo,
      scheduleRepo,
      holidayRepo,
      workingShiftRepo,
      employeeRepo,
    )
  })

  it("UTCID01 - returns attendance records for a valid query", async () => {
    // Arrange
    const query = { employeeId: "emp-1", fromDate: "2024-01-01", toDate: "2024-01-31" }
    const records = [
      { id: "att-1", employeeId: "emp-1", checkInAt: "2024-01-01T09:00:00.000Z", checkOutAt: null },
      { id: "att-2", employeeId: "emp-1", checkInAt: "2024-01-02T09:00:00.000Z", checkOutAt: null },
    ]
    attendanceRepo.queryRecords.mockResolvedValue(records as never)

    // Act
    const result = await service.getAttendanceRecords(query as IAttendanceRecordQueryDTO)

    // Assert
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith(query)
    expect(result).toEqual(records)
  })

  it("UTCID02 - propagates repository error when queryRecords rejects", async () => {
    // Arrange
    const query = { employeeId: "emp-1" }
    const repositoryError = new AppError("QUERY_FAILED", 500, "SERVICE")
    attendanceRepo.queryRecords.mockRejectedValue(repositoryError)

    // Act
    const act = service.getAttendanceRecords(query as IAttendanceRecordQueryDTO)

    // Assert
    await expect(act).rejects.toBe(repositoryError)
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith(query)
  })

  it("UTCID03 - propagates validation-like error for malformed query from repository layer", async () => {
    // Arrange
    const query = { employeeId: null, fromDate: "invalid-date", toDate: "invalid-date" }
    const validationError = new AppError("INVALID_QUERY", 400, "SERVICE")
    attendanceRepo.queryRecords.mockRejectedValue(validationError)

    // Act
    const act = service.getAttendanceRecords(query as unknown as IAttendanceRecordQueryDTO)

    // Assert
    await expect(act).rejects.toBe(validationError)
    expect(attendanceRepo.queryRecords).toHaveBeenCalledWith(query)
  })
})
