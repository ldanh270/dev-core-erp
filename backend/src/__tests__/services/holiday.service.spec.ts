/// <reference types="jest" />
import { HOLIDAY_SCOPE } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import type {
  ICreateHolidayDTO,
  IHolidayCalendarDTO,
  IHolidayRepository,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { jest } from "@jest/globals"

import { HolidayService } from "../../services/holiday.service"

jest.mock("@/configs/entities/attendance.config.ts", () => ({
  HOLIDAY_SCOPE: {
    ALL: "ALL",
    POSITION: "POSITION",
    EMPLOYEES: "EMPLOYEES",
  },
}))

jest.mock("@/configs/entities/employee.config.ts", () => ({
  EMPLOYEE_STATUS: {
    ACTIVE: "ACTIVE",
    ON_LEAVE: "ON_LEAVE",
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/libs/database.ts", () => ({
  prisma: {
    position: {
      findFirst: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number

    layer: string

    code: string

    constructor(message: string, statusCode: number, layer: string, code: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.layer = layer
      this.code = code
    }
  },
}))

type MockedHolidayRepository = {
  listHolidays: jest.MockedFunction<IHolidayRepository["listHolidays"]>
  createHolidayRange: jest.MockedFunction<IHolidayRepository["createHolidayRange"]>
  updateHoliday: jest.MockedFunction<IHolidayRepository["updateHoliday"]>
  deleteHoliday: jest.MockedFunction<IHolidayRepository["deleteHoliday"]>
  checkIsHoliday: jest.MockedFunction<IHolidayRepository["checkIsHoliday"]>
}

function createHolidayResult(overrides: Partial<IHolidayCalendarDTO> = {}): IHolidayCalendarDTO {
  return {
    id: "holiday-1",
    name: "Company Holiday",
    date: new Date("2025-12-25T00:00:00.000Z"),
    type: "national",
    scope: "all",
    positionId: null,
    batchId: null,
    createdById: "user-1",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    position: null,
    assignees: [],
    ...overrides,
  }
}

describe("HolidayService", () => {
  let holidayRepo: MockedHolidayRepository
  let holidayService: HolidayService
  let positionFindFirstMock: jest.MockedFunction<typeof prisma.position.findFirst>
  let employeeCountMock: jest.MockedFunction<typeof prisma.employee.count>

  beforeEach(() => {
    // Arrange
    holidayRepo = {
      listHolidays: jest.fn<IHolidayRepository["listHolidays"]>(),
      createHolidayRange: jest.fn<IHolidayRepository["createHolidayRange"]>(),
      updateHoliday: jest.fn<IHolidayRepository["updateHoliday"]>(),
      deleteHoliday: jest.fn<IHolidayRepository["deleteHoliday"]>(),
      checkIsHoliday: jest.fn<IHolidayRepository["checkIsHoliday"]>(),
    }

    jest.clearAllMocks()

    positionFindFirstMock = prisma.position.findFirst as jest.MockedFunction<
      typeof prisma.position.findFirst
    >
    employeeCountMock = prisma.employee.count as jest.MockedFunction<typeof prisma.employee.count>

    // Act
    holidayService = new HolidayService(holidayRepo as unknown as IHolidayRepository)

    // Assert
    expect(holidayService).toBeInstanceOf(HolidayService)
  })

  describe("listHolidays", () => {
    it("UTCID01 - returns holidays for the provided query", async () => {
      // Arrange
      const query = { year: 2025, scope: HOLIDAY_SCOPE.ALL } as IListHolidaysQueryDTO
      const mockResult = [
        createHolidayResult({ name: "New Year" }),
        createHolidayResult({ id: "holiday-2", name: "Labor Day" }),
      ]
      holidayRepo.listHolidays.mockResolvedValue(mockResult)

      // Act
      const result = await holidayService.listHolidays(query)

      // Assert
      expect(holidayRepo.listHolidays).toHaveBeenCalledTimes(1)
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResult)
    })

    it("UTCID02 - propagates a not found style repository error", async () => {
      // Arrange
      const query = { year: 1999 } as IListHolidaysQueryDTO
      const repoError = new AppError(
        "Holiday records not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "HOLIDAYS_NOT_FOUND",
      )
      holidayRepo.listHolidays.mockRejectedValue(repoError)

      // Act
      const act = holidayService.listHolidays(query)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.listHolidays).toHaveBeenCalledWith(query)
    })

    it("UTCID03 - propagates an internal repository error", async () => {
      // Arrange
      const query = { year: 2025 } as IListHolidaysQueryDTO
      const repoError = new AppError(
        "Database failure",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        "DB_ERROR",
      )
      holidayRepo.listHolidays.mockRejectedValue(repoError)

      // Act
      const act = holidayService.listHolidays(query)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.listHolidays).toHaveBeenCalledTimes(1)
    })
  })

  describe("createHoliday", () => {
    it("UTCID01 - creates a holiday range with default ALL scope and normalized dates", async () => {
      // Arrange
      const data = {
        name: "Company Holiday",
        date: "2025-12-25",
      } as ICreateHolidayDTO
      const createdById = "user-1"
      const mockResult = [createHolidayResult()]
      holidayRepo.createHolidayRange.mockResolvedValue(mockResult)

      // Act
      const result = await holidayService.createHoliday(data, createdById)

      // Assert
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledTimes(1)
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledWith(
        {
          ...data,
          scope: HOLIDAY_SCOPE.ALL,
          startDate: new Date("2025-12-25"),
          endDate: new Date("2025-12-25"),
        },
        createdById,
      )
      expect(result).toEqual(mockResult)
      expect(positionFindFirstMock).not.toHaveBeenCalled()
      expect(employeeCountMock).not.toHaveBeenCalled()
    })

    it("UTCID02 - throws bad request when endDate is earlier than startDate", async () => {
      // Arrange
      const data = {
        name: "Invalid Range Holiday",
        startDate: "2025-12-31",
        endDate: "2025-12-01",
        scope: HOLIDAY_SCOPE.ALL,
      } as ICreateHolidayDTO
      const createdById = "user-1"

      // Act
      const act = holidayService.createHoliday(data, createdById)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "endDate must be greater than or equal to startDate",
        statusCode: HttpStatusCode.BAD_REQUEST,
        layer: ErrorLayer.SERVICE,
        code: "INVALID_DATE_RANGE",
      })
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled()
      expect(positionFindFirstMock).not.toHaveBeenCalled()
      expect(employeeCountMock).not.toHaveBeenCalled()
    })

    it("UTCID03 - throws not found when POSITION scope target does not exist", async () => {
      // Arrange
      const data = {
        name: "Position Holiday",
        startDate: "2025-06-01",
        endDate: "2025-06-02",
        scope: HOLIDAY_SCOPE.POSITION,
        positionId: "position-1",
      } as ICreateHolidayDTO
      const createdById = "user-1"
      positionFindFirstMock.mockResolvedValue(null)

      // Act
      const act = holidayService.createHoliday(data, createdById)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Position not found",
        statusCode: HttpStatusCode.NOT_FOUND,
        layer: ErrorLayer.SERVICE,
        code: "POSITION_NOT_FOUND",
      })
      expect(positionFindFirstMock).toHaveBeenCalledTimes(1)
      expect(positionFindFirstMock).toHaveBeenCalledWith({
        where: { id: "position-1", deletedAt: null },
        select: { id: true },
      })
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled()
    })

    it("UTCID04 - throws unprocessable entity when EMPLOYEES scope has no active employee targets", async () => {
      // Arrange
      const data = {
        name: "Employee Holiday",
        startDate: "2025-08-10",
        endDate: "2025-08-10",
        scope: HOLIDAY_SCOPE.EMPLOYEES,
        // Duplicate IDs verify that target validation operates on distinct employees.
        employeeIds: ["emp-1", "emp-1", "emp-2"],
      } as ICreateHolidayDTO
      const createdById = "user-2"
      employeeCountMock.mockResolvedValue(0)

      // Act
      const act = holidayService.createHoliday(data, createdById)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "No active employees found for the provided ids",
        statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
        layer: ErrorLayer.SERVICE,
        code: "NO_TARGET_EMPLOYEES",
      })
      expect(employeeCountMock).toHaveBeenCalledTimes(1)
      expect(employeeCountMock).toHaveBeenCalledWith({
        where: {
          id: { in: ["emp-1", "emp-2"] },
          deletedAt: null,
          status: { in: [EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.ON_LEAVE] },
        },
      })
      expect(holidayRepo.createHolidayRange).not.toHaveBeenCalled()
    })

    it("UTCID05 - creates a holiday for POSITION scope when the position exists", async () => {
      // Arrange
      const data = {
        name: "Position Holiday",
        startDate: "2025-09-01",
        endDate: "2025-09-03",
        scope: HOLIDAY_SCOPE.POSITION,
        positionId: "position-1",
      } as ICreateHolidayDTO
      const createdById = "user-3"
      const mockResult = [createHolidayResult({ id: "holiday-2", name: "Position Holiday" })]
      positionFindFirstMock.mockResolvedValue({
        id: "position-1",
        code: "POS-001",
        name: "Engineer",
        description: null,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        deletedAt: null,
        allowedTaskTrackers: [],
        allowedApplicationTypes: [],
      })
      holidayRepo.createHolidayRange.mockResolvedValue(mockResult)

      // Act
      const result = await holidayService.createHoliday(data, createdById)

      // Assert
      expect(positionFindFirstMock).toHaveBeenCalledWith({
        where: { id: "position-1", deletedAt: null },
        select: { id: true },
      })
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledWith(
        {
          ...data,
          startDate: new Date("2025-09-01"),
          endDate: new Date("2025-09-03"),
        },
        createdById,
      )
      expect(result).toEqual(mockResult)
    })

    it("UTCID06 - propagates repository internal error after successful scope validation", async () => {
      // Arrange
      const data = {
        name: "Validated Holiday",
        startDate: "2025-10-01",
        endDate: "2025-10-02",
        scope: HOLIDAY_SCOPE.EMPLOYEES,
        employeeIds: ["emp-1"],
      } as ICreateHolidayDTO
      const createdById = "user-4"
      const repoError = new AppError(
        "Insert failed",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        "INSERT_FAILED",
      )
      employeeCountMock.mockResolvedValue(1)
      holidayRepo.createHolidayRange.mockRejectedValue(repoError)

      // Act
      const act = holidayService.createHoliday(data, createdById)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(employeeCountMock).toHaveBeenCalledTimes(1)
      expect(holidayRepo.createHolidayRange).toHaveBeenCalledTimes(1)
    })
  })

  describe("updateHoliday", () => {
    it("UTCID01 - updates a holiday successfully", async () => {
      // Arrange
      const id = "holiday-1"
      const data = { name: "Updated Holiday Name" } as IUpdateHolidayDTO
      const mockResult = createHolidayResult({ id, name: "Updated Holiday Name" })
      holidayRepo.updateHoliday.mockResolvedValue(mockResult)

      // Act
      const result = await holidayService.updateHoliday(id, data)

      // Assert
      expect(holidayRepo.updateHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data)
      expect(result).toEqual(mockResult)
    })

    it("UTCID02 - propagates a not found error from repository", async () => {
      // Arrange
      const id = "missing-holiday"
      const data = { name: "Missing Holiday" } as IUpdateHolidayDTO
      const repoError = new AppError(
        "Holiday not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "HOLIDAY_NOT_FOUND",
      )
      holidayRepo.updateHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.updateHoliday(id, data)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledWith(id, data)
    })

    it("UTCID03 - propagates an internal server error from repository", async () => {
      // Arrange
      const id = "holiday-2"
      const data = { name: "Broken Update" } as IUpdateHolidayDTO
      const repoError = new AppError(
        "Update failed",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        "UPDATE_FAILED",
      )
      holidayRepo.updateHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.updateHoliday(id, data)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.updateHoliday).toHaveBeenCalledTimes(1)
    })
  })

  describe("deleteHoliday", () => {
    it("UTCID01 - deletes a holiday with default deleteBatch behavior", async () => {
      // Arrange
      const id = "holiday-1"
      holidayRepo.deleteHoliday.mockResolvedValue(undefined)

      // Act
      await holidayService.deleteHoliday(id)

      // Assert
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id, true)
    })

    it("UTCID02 - propagates a not found error when holiday does not exist", async () => {
      // Arrange
      const id = "missing-holiday"
      const repoError = new AppError(
        "Holiday not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        "HOLIDAY_NOT_FOUND",
      )
      holidayRepo.deleteHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.deleteHoliday(id, false)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledWith(id, false)
    })

    it("UTCID03 - propagates an internal server error during deletion", async () => {
      // Arrange
      const id = "holiday-3"
      const repoError = new AppError(
        "Delete failed",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        "DELETE_FAILED",
      )
      holidayRepo.deleteHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.deleteHoliday(id, true)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.deleteHoliday).toHaveBeenCalledTimes(1)
    })
  })

  describe("isHoliday", () => {
    it("UTCID01 - returns true when the provided date is a holiday", async () => {
      // Arrange
      const date = "2025-12-25"
      holidayRepo.checkIsHoliday.mockResolvedValue(true)

      // Act
      const result = await holidayService.isHoliday(date)

      // Assert
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledTimes(1)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date)
      expect(result).toBe(true)
    })

    it("UTCID02 - propagates a bad request style error for invalid date input", async () => {
      // Arrange
      const date = "invalid-date"
      const repoError = new AppError(
        "Invalid date",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_DATE",
      )
      holidayRepo.checkIsHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.isHoliday(date)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledWith(date)
    })

    it("UTCID03 - propagates an internal server error from repository", async () => {
      // Arrange
      const date = new Date("2025-01-01")
      const repoError = new AppError(
        "Query failed",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
        "QUERY_FAILED",
      )
      holidayRepo.checkIsHoliday.mockRejectedValue(repoError)

      // Act
      const act = holidayService.isHoliday(date)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(holidayRepo.checkIsHoliday).toHaveBeenCalledTimes(1)
    })
  })
})
