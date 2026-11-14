/// <reference types="jest" />
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type {
  IShiftChangeRequestRepository,
  ISubmitShiftChangeRequestDTO,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { jest } from "@jest/globals"

import { ShiftChangeRequestService } from "../../services/shift-change-request.service"

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    NOT_FOUND: 404,
  },
}))

jest.mock("@/types/shift.types.ts", () => ({}))

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

type MockedShiftChangeRequestRepository = jest.Mocked<IShiftChangeRequestRepository>

const createMockRepo = (): MockedShiftChangeRequestRepository =>
  ({
    submit: jest.fn(),
    findByEmployee: jest.fn(),
    findById: jest.fn(),
    listPending: jest.fn(),
  }) as MockedShiftChangeRequestRepository

describe("ShiftChangeRequestService", () => {
  describe("submitRequest", () => {
    let repo: MockedShiftChangeRequestRepository
    let service: ShiftChangeRequestService

    beforeEach(() => {
      // Arrange
      repo = createMockRepo()

      // Act
      service = new ShiftChangeRequestService(repo)

      // Assert
      jest.clearAllMocks()
    })

    it("UTCID01 - returns the created shift change request when submission is valid", async () => {
      // Arrange
      const payload = {
        employeeId: "emp-001",
        swapWithEmployeeId: "emp-002",
        reason: "Personal schedule conflict",
      } as unknown as ISubmitShiftChangeRequestDTO
      const createdRequest = {
        id: "req-001",
        employeeId: "emp-001",
        swapWithEmployeeId: "emp-002",
        requestShiftId: "shift-001",
        reason: "Personal schedule conflict",
        status: "pending",
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
      }
      repo.submit.mockResolvedValue(createdRequest)

      // Act
      const result = await service.submitRequest(payload)

      // Assert
      expect(repo.submit).toHaveBeenCalledTimes(1)
      expect(repo.submit).toHaveBeenCalledWith(payload)
      expect(result).toEqual(createdRequest)
    })

    it("UTCID02 - throws AppError when employee attempts to swap with themselves", async () => {
      // Arrange
      const payload = {
        employeeId: "emp-001",
        swapWithEmployeeId: "emp-001",
        reason: "Invalid self swap",
      } as unknown as ISubmitShiftChangeRequestDTO

      // Act
      const act = service.submitRequest(payload)

      // Assert
      await expect(act).rejects.toMatchObject({
        name: "AppError",
        message: "Cannot request shift swap with yourself",
        statusCode: HttpStatusCode.BAD_REQUEST,
        layer: ErrorLayer.SERVICE,
      })
      expect(repo.submit).not.toHaveBeenCalled()
    })

    it("UTCID03 - propagates repository AppError when submit fails", async () => {
      // Arrange
      const payload = {
        employeeId: "emp-001",
        swapWithEmployeeId: "emp-003",
        reason: "Need urgent swap",
      } as unknown as ISubmitShiftChangeRequestDTO
      const repoError = new AppError(
        "Repository failed to create request",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorLayer.SERVICE,
      )
      repo.submit.mockRejectedValue(repoError)

      // Act
      const act = service.submitRequest(payload)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(repo.submit).toHaveBeenCalledTimes(1)
      expect(repo.submit).toHaveBeenCalledWith(payload)
    })

    it("UTCID04 - propagates generic repository error when submit crashes", async () => {
      // Arrange
      const payload = {
        employeeId: "emp-010",
        swapWithEmployeeId: "emp-011",
        reason: "Unexpected issue path",
      } as unknown as ISubmitShiftChangeRequestDTO
      const repoError = new Error("Unexpected repository crash")
      repo.submit.mockRejectedValue(repoError)

      // Act
      const act = service.submitRequest(payload)

      // Assert
      await expect(act).rejects.toThrow("Unexpected repository crash")
      expect(repo.submit).toHaveBeenCalledTimes(1)
      expect(repo.submit).toHaveBeenCalledWith(payload)
    })
  })

  describe("getMyRequests", () => {
    let repo: MockedShiftChangeRequestRepository
    let service: ShiftChangeRequestService

    beforeEach(() => {
      // Arrange
      repo = createMockRepo()

      // Act
      service = new ShiftChangeRequestService(repo)

      // Assert
      jest.clearAllMocks()
    })

    it("UTCID01 - returns all shift change requests for the given employee", async () => {
      // Arrange
      const employeeId = "emp-100"
      const requests = [
        {
          id: "req-100",
          employeeId: "emp-100",
          swapWithEmployeeId: "emp-101",
          requestShiftId: "shift-100",
          status: "pending",
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
        },
        {
          id: "req-101",
          employeeId: "emp-100",
          swapWithEmployeeId: "emp-102",
          requestShiftId: "shift-101",
          status: "approved",
          approvedBy: "mgr-001",
          approvedAt: "2024-01-10T10:00:00.000Z",
          rejectedBy: null,
          rejectedAt: null,
        },
      ]
      repo.findByEmployee.mockResolvedValue(requests)

      // Act
      const result = await service.getMyRequests(employeeId)

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1)
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId)
      expect(result).toEqual(requests)
    })

    it("UTCID02 - propagates repository AppError when fetching requests fails", async () => {
      // Arrange
      const employeeId = "emp-404"
      const repoError = new AppError(
        "Employee requests not found",
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
      repo.findByEmployee.mockRejectedValue(repoError)

      // Act
      const act = service.getMyRequests(employeeId)

      // Assert
      await expect(act).rejects.toBe(repoError)
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1)
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId)
    })

    it("UTCID03 - propagates generic repository error when fetching requests crashes", async () => {
      // Arrange
      const employeeId = "emp-500"
      const repoError = new Error("Database connection lost")
      repo.findByEmployee.mockRejectedValue(repoError)

      // Act
      const act = service.getMyRequests(employeeId)

      // Assert
      await expect(act).rejects.toThrow("Database connection lost")
      expect(repo.findByEmployee).toHaveBeenCalledTimes(1)
      expect(repo.findByEmployee).toHaveBeenCalledWith(employeeId)
    })
  })
})
