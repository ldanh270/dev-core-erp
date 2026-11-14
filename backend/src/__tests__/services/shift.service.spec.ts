/// <reference types="jest" />
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type {
  ICreateWorkingShiftDTO,
  IUpdateWorkingShiftDTO,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { handleDbUniqueError } from "@/utils/db-error.util.ts"
import { AppError } from "@/utils/error.util.ts"

import { jest } from "@jest/globals"

import { ShiftService } from "../../services/shift.service"

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    NOT_FOUND: 404,
  },
}))

jest.mock("@/types/shift.types.ts", () => ({}))

jest.mock("@/utils/db-error.util.ts", () => ({
  handleDbUniqueError: jest.fn(),
}))

jest.mock("@/utils/error.util.ts", () => {
  class MockAppError extends Error {
    statusCode: number
    layer: string

    constructor(message: string, statusCode: number, layer: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.layer = layer
    }
  }

  return {
    AppError: MockAppError,
  }
})

type ShiftEntity = NonNullable<Awaited<ReturnType<IWorkingShiftRepository["findById"]>>>

type ShiftRepoMock = {
  create: jest.MockedFunction<IWorkingShiftRepository["create"]>
  update: jest.MockedFunction<IWorkingShiftRepository["update"]>
  findById: jest.MockedFunction<IWorkingShiftRepository["findById"]>
  delete: jest.MockedFunction<IWorkingShiftRepository["delete"]>
  listAll: jest.MockedFunction<IWorkingShiftRepository["listAll"]>
}

const createMockShift = (overrides: Partial<ShiftEntity> = {}): ShiftEntity => ({
  id: "shift-1",
  name: "Morning Shift",
  startTime: 800,
  endTime: 1700,
  breakStartTime: null,
  breakEndTime: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  gracePeriodMinutes: 15,
  gpsLat: null,
  gpsLng: null,
  gpsRadiusMeters: 100,
  isActive: true,
  createdById: "user-1",
  ...overrides,
})

describe("ShiftService", () => {
  let shiftRepo: ShiftRepoMock
  let service: ShiftService
  let mockedHandleDbUniqueError: jest.MockedFunction<typeof handleDbUniqueError>

  beforeEach(() => {
    // Arrange
    jest.clearAllMocks()

    shiftRepo = {
      create: jest.fn<IWorkingShiftRepository["create"]>(),
      update: jest.fn<IWorkingShiftRepository["update"]>(),
      findById: jest.fn<IWorkingShiftRepository["findById"]>(),
      delete: jest.fn<IWorkingShiftRepository["delete"]>(),
      listAll: jest.fn<IWorkingShiftRepository["listAll"]>(),
    }

    mockedHandleDbUniqueError = handleDbUniqueError as jest.MockedFunction<
      typeof handleDbUniqueError
    >
    service = new ShiftService(shiftRepo as unknown as IWorkingShiftRepository)
  })

  describe("createShift", () => {
    beforeEach(() => {
      // Arrange
      mockedHandleDbUniqueError.mockImplementation((error: unknown) => {
        throw error
      })
    })

    it("UTCID01 - creates a shift successfully", async () => {
      // Arrange
      const data = {
        name: "Morning Shift",
        startTime: "08:00",
        endTime: "17:00",
        createdById: "user-1",
        gracePeriodMinutes: 15,
        gpsLat: null,
        gpsLng: null,
        gpsRadiusMeters: 100,
        isActive: true,
      } as ICreateWorkingShiftDTO
      const createdShift = createMockShift()
      shiftRepo.create.mockResolvedValue(createdShift)

      // Act
      const result = await service.createShift(data)

      // Assert
      expect(shiftRepo.create).toHaveBeenCalledTimes(1)
      expect(shiftRepo.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(createdShift)
      expect(mockedHandleDbUniqueError).not.toHaveBeenCalled()
    })

    it("UTCID02 - throws processed duplicate error when repository create fails with unique constraint", async () => {
      // Arrange
      const data = {
        name: "Morning Shift",
        startTime: "08:00",
        endTime: "17:00",
        createdById: "user-1",
        gracePeriodMinutes: 15,
        gpsLat: null,
        gpsLng: null,
        gpsRadiusMeters: 100,
        isActive: true,
      } as ICreateWorkingShiftDTO
      const dbError = new Error("duplicate key")
      const processedError = new AppError("Shift name already exists", 409, "ShiftService")

      shiftRepo.create.mockRejectedValue(dbError)
      mockedHandleDbUniqueError.mockImplementation(
        (error: unknown, serviceName: string, fields: Record<string, string>, message?: string) => {
          expect(error).toBe(dbError)
          expect(serviceName).toBe("ShiftService")
          expect(fields).toEqual({ name: "Shift name" })
          expect(message).toBe("Shift name already exists")
          throw processedError
        },
      )

      // Act
      const action = service.createShift(data)

      // Assert
      await expect(action).rejects.toBe(processedError)
      expect(shiftRepo.create).toHaveBeenCalledTimes(1)
      expect(mockedHandleDbUniqueError).toHaveBeenCalledTimes(1)
    })

    it("UTCID03 - propagates generic handler error when repository create fails", async () => {
      // Arrange
      const data = {
        name: "Night Shift",
        startTime: "22:00",
        endTime: "06:00",
        createdById: "user-2",
        gracePeriodMinutes: 10,
        gpsLat: null,
        gpsLng: null,
        gpsRadiusMeters: 150,
        isActive: true,
      } as ICreateWorkingShiftDTO
      const dbError = new Error("database unavailable")
      const handlerError = new Error("mapped database error")

      shiftRepo.create.mockRejectedValue(dbError)
      mockedHandleDbUniqueError.mockImplementation(() => {
        throw handlerError
      })

      // Act
      const action = service.createShift(data)

      // Assert
      await expect(action).rejects.toThrow("mapped database error")
      expect(shiftRepo.create).toHaveBeenCalledWith(data)
      expect(mockedHandleDbUniqueError).toHaveBeenCalledWith(
        dbError,
        "ShiftService",
        { name: "Shift name" },
        "Shift name already exists",
      )
    })
  })

  describe("updateShift", () => {
    beforeEach(() => {
      // Arrange
      mockedHandleDbUniqueError.mockImplementation((error: unknown) => {
        throw error
      })
    })

    it("UTCID01 - updates a shift successfully", async () => {
      // Arrange
      const id = "shift-1"
      const data = {
        name: "Updated Morning Shift",
        startTime: "09:00",
      } as IUpdateWorkingShiftDTO
      const updatedShift = createMockShift({
        id,
        name: "Updated Morning Shift",
        startTime: 900,
      })
      shiftRepo.update.mockResolvedValue(updatedShift)

      // Act
      const result = await service.updateShift(id, data)

      // Assert
      expect(shiftRepo.update).toHaveBeenCalledTimes(1)
      expect(shiftRepo.update).toHaveBeenCalledWith(id, data)
      expect(result).toEqual(updatedShift)
      expect(mockedHandleDbUniqueError).not.toHaveBeenCalled()
    })

    it("UTCID02 - throws not found error when repository returns null", async () => {
      // Arrange
      const id = "missing-shift"
      const data = {
        name: "Missing Shift",
      } as IUpdateWorkingShiftDTO

      shiftRepo.update.mockResolvedValue(null)
      mockedHandleDbUniqueError.mockImplementation((error: unknown) => {
        throw error
      })

      // Act
      const action = service.updateShift(id, data)

      // Assert
      await expect(action).rejects.toMatchObject({
        message: "Shift not found",
        statusCode: HttpStatusCode.NOT_FOUND,
        layer: "ShiftService",
      })
      expect(shiftRepo.update).toHaveBeenCalledWith(id, data)
      expect(mockedHandleDbUniqueError).toHaveBeenCalledTimes(1)
      expect(mockedHandleDbUniqueError.mock.calls[0]?.[1]).toBe("ShiftService")
      expect(mockedHandleDbUniqueError.mock.calls[0]?.[2]).toEqual({ name: "Shift name" })
      expect(mockedHandleDbUniqueError.mock.calls[0]?.[3]).toBe("Shift name already exists")
    })

    it("UTCID03 - throws processed duplicate error when repository update fails with unique constraint", async () => {
      // Arrange
      const id = "shift-1"
      const data = {
        name: "Existing Shift Name",
      } as IUpdateWorkingShiftDTO
      const dbError = new Error("duplicate key")
      const processedError = new AppError("Shift name already exists", 409, "ShiftService")

      shiftRepo.update.mockRejectedValue(dbError)
      mockedHandleDbUniqueError.mockImplementation(() => {
        throw processedError
      })

      // Act
      const action = service.updateShift(id, data)

      // Assert
      await expect(action).rejects.toBe(processedError)
      expect(shiftRepo.update).toHaveBeenCalledWith(id, data)
      expect(mockedHandleDbUniqueError).toHaveBeenCalledWith(
        dbError,
        "ShiftService",
        { name: "Shift name" },
        "Shift name already exists",
      )
    })
  })

  describe("deleteShift", () => {
    it("UTCID01 - deletes a shift successfully when it exists", async () => {
      // Arrange
      const id = "shift-1"
      const existingShift = createMockShift({ id })

      shiftRepo.findById.mockResolvedValue(existingShift)
      shiftRepo.delete.mockResolvedValue(undefined)

      // Act
      await service.deleteShift(id)

      // Assert
      expect(shiftRepo.findById).toHaveBeenCalledTimes(1)
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
      expect(shiftRepo.delete).toHaveBeenCalledTimes(1)
      expect(shiftRepo.delete).toHaveBeenCalledWith(id)
    })

    it("UTCID02 - throws not found error when shift does not exist", async () => {
      // Arrange
      const id = "missing-shift"
      shiftRepo.findById.mockResolvedValue(null)

      // Act
      const action = service.deleteShift(id)

      // Assert
      await expect(action).rejects.toMatchObject({
        message: "Shift not found",
        statusCode: HttpStatusCode.NOT_FOUND,
        layer: ErrorLayer.SERVICE,
      })
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
      expect(shiftRepo.delete).not.toHaveBeenCalled()
    })

    it("UTCID03 - propagates repository delete failure after finding the shift", async () => {
      // Arrange
      const id = "shift-1"
      const existingShift = createMockShift({ id })
      const deleteError = new Error("delete failed")

      shiftRepo.findById.mockResolvedValue(existingShift)
      shiftRepo.delete.mockRejectedValue(deleteError)

      // Act
      const action = service.deleteShift(id)

      // Assert
      await expect(action).rejects.toThrow("delete failed")
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
      expect(shiftRepo.delete).toHaveBeenCalledWith(id)
    })
  })

  describe("getShift", () => {
    it("UTCID01 - returns a shift successfully when it exists", async () => {
      // Arrange
      const id = "shift-1"
      const existingShift = createMockShift({ id })

      shiftRepo.findById.mockResolvedValue(existingShift)

      // Act
      const result = await service.getShift(id)

      // Assert
      expect(shiftRepo.findById).toHaveBeenCalledTimes(1)
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(existingShift)
    })

    it("UTCID02 - throws not found error when shift does not exist", async () => {
      // Arrange
      const id = "missing-shift"
      shiftRepo.findById.mockResolvedValue(null)

      // Act
      const action = service.getShift(id)

      // Assert
      await expect(action).rejects.toMatchObject({
        message: "Shift not found",
        statusCode: HttpStatusCode.NOT_FOUND,
        layer: "ShiftService",
      })
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
    })

    it("UTCID03 - propagates repository findById failure", async () => {
      // Arrange
      const id = "shift-1"
      const repoError = new Error("find failed")

      shiftRepo.findById.mockRejectedValue(repoError)

      // Act
      const action = service.getShift(id)

      // Assert
      await expect(action).rejects.toThrow("find failed")
      expect(shiftRepo.findById).toHaveBeenCalledWith(id)
    })
  })

  describe("listShifts", () => {
    it("UTCID01 - returns all shifts successfully", async () => {
      // Arrange
      const shifts: ShiftEntity[] = [
        createMockShift({
          id: "shift-1",
          name: "Morning Shift",
          startTime: 800,
          endTime: 1700,
          createdById: "user-1",
        }),
        createMockShift({
          id: "shift-2",
          name: "Night Shift",
          startTime: 2200,
          endTime: 600,
          createdById: "user-2",
        }),
      ]

      shiftRepo.listAll.mockResolvedValue(shifts)

      // Act
      const result = await service.listShifts()

      // Assert
      expect(shiftRepo.listAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual(shifts)
    })

    it("UTCID02 - propagates repository listAll generic failure", async () => {
      // Arrange
      const repoError = new Error("list failed")
      shiftRepo.listAll.mockRejectedValue(repoError)

      // Act
      const action = service.listShifts()

      // Assert
      await expect(action).rejects.toThrow("list failed")
      expect(shiftRepo.listAll).toHaveBeenCalledTimes(1)
    })

    it("UTCID03 - propagates repository listAll AppError failure", async () => {
      // Arrange
      const repoError = new AppError("service unavailable", 500, "ShiftService")
      shiftRepo.listAll.mockRejectedValue(repoError)

      // Act
      const action = service.listShifts()

      // Assert
      await expect(action).rejects.toBe(repoError)
      expect(shiftRepo.listAll).toHaveBeenCalledTimes(1)
    })
  })
})
