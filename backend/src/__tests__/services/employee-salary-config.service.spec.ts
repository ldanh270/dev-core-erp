/// <reference types="jest" />
import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AppError } from "@/utils/error.util.ts"

import { EmployeeSalaryConfigService } from "../../services/employee-salary-config.service"

jest.mock("@/configs/messages/payroll.message", () => ({
  PAYROLL_MESSAGES: {
    ERRORS: {
      SALARY_CONFIG_NOT_FOUND: jest
        .fn()
        .mockImplementation((id) => `Salary config not found for ${id}`),
    },
  },
}))

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

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layer: string
    constructor(message: string, statusCode: number, layer: string) {
      super(message)
      this.statusCode = statusCode
      this.layer = layer
    }
  },
}))

describe("EmployeeSalaryConfigService", () => {
  let service: EmployeeSalaryConfigService
  let mockRepo: any
  let mockPrisma: any
  let mockTx: any

  beforeEach(() => {
    mockRepo = {
      findActiveByEmployee: jest.fn(),
      findAllByEmployee: jest.fn(),
    }
    mockTx = {
      employeeSalaryConfig: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    }
    mockPrisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(mockTx)),
    }
    service = new EmployeeSalaryConfigService(mockRepo, mockPrisma)
  })

  describe("getActiveConfig", () => {
    it("UTCID01 - returns active config when found", async () => {
      // Arrange
      const employeeId = "emp-123"
      const atDate = new Date("2023-05-15")
      const expectedConfig = {
        id: "conf-1",
        employeeId,
        templateId: "temp-1",
        baseSalary: 1000,
        effectiveFrom: new Date("2023-01-01"),
        effectiveTo: null,
        note: null,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockRepo.findActiveByEmployee.mockResolvedValue(expectedConfig)

      // Act
      const result = await service.getActiveConfig(employeeId, atDate)

      // Assert
      expect(mockRepo.findActiveByEmployee).toHaveBeenCalledWith(employeeId, atDate)
      expect(result).toEqual(expectedConfig)
    })

    it("UTCID02 - throws AppError when config not found", async () => {
      // Arrange
      const employeeId = "emp-123"
      mockRepo.findActiveByEmployee.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getActiveConfig(employeeId)).rejects.toThrow(
        new AppError(
          PAYROLL_MESSAGES.ERRORS.SALARY_CONFIG_NOT_FOUND(employeeId),
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        ),
      )
      expect(mockRepo.findActiveByEmployee).toHaveBeenCalledWith(employeeId, expect.any(Date))
    })

    it("UTCID03 - propagates repository database query errors", async () => {
      // Arrange
      const employeeId = "emp-123"
      mockRepo.findActiveByEmployee.mockRejectedValue(new Error("DB failure"))

      // Act & Assert
      await expect(service.getActiveConfig(employeeId)).rejects.toThrow("DB failure")
    })
  })

  describe("getConfigHistory", () => {
    it("UTCID01 - returns list of all configurations for the employee", async () => {
      // Arrange
      const employeeId = "emp-123"
      const expectedHistory = [
        {
          id: "conf-1",
          employeeId,
          templateId: "temp-1",
          baseSalary: 1000,
          effectiveFrom: new Date("2023-01-01"),
          effectiveTo: new Date("2023-05-31"),
          note: "First config",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "conf-2",
          employeeId,
          templateId: "temp-2",
          baseSalary: 1200,
          effectiveFrom: new Date("2023-06-01"),
          effectiveTo: null,
          note: null,
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockRepo.findAllByEmployee.mockResolvedValue(expectedHistory)

      // Act
      const result = await service.getConfigHistory(employeeId)

      // Assert
      expect(mockRepo.findAllByEmployee).toHaveBeenCalledWith(employeeId)
      expect(result).toEqual(expectedHistory)
    })

    it("UTCID02 - returns empty list if no configurations exist", async () => {
      // Arrange
      const employeeId = "emp-123"
      mockRepo.findAllByEmployee.mockResolvedValue([])

      // Act
      const result = await service.getConfigHistory(employeeId)

      // Assert
      expect(result).toEqual([])
    })

    it("UTCID03 - propagates repository error if query fails", async () => {
      // Arrange
      const employeeId = "emp-123"
      mockRepo.findAllByEmployee.mockRejectedValue(new Error("Connection lost"))

      // Act & Assert
      await expect(service.getConfigHistory(employeeId)).rejects.toThrow("Connection lost")
    })
  })

  describe("assignConfig", () => {
    it("UTCID01 - successfully updates existing configs and creates new config in transaction", async () => {
      // Arrange
      const employeeId = "emp-123"
      const createdById = "user-admin"
      const data = {
        templateId: "temp-new",
        baseSalary: 1500,
        effectiveFrom: new Date("2023-07-01"),
        note: "Promo",
      }

      const expectedEffectiveTo = new Date(data.effectiveFrom)
      expectedEffectiveTo.setDate(expectedEffectiveTo.getDate() - 1)

      const mockCreatedConfig = {
        id: "conf-new",
        employeeId,
        templateId: data.templateId,
        baseSalary: data.baseSalary,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: null,
        note: data.note,
        createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTx.employeeSalaryConfig.updateMany.mockResolvedValue({ count: 1 })
      mockTx.employeeSalaryConfig.create.mockResolvedValue(mockCreatedConfig)

      // Act
      const result = await service.assignConfig(employeeId, data, createdById)

      // Assert
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockTx.employeeSalaryConfig.updateMany).toHaveBeenCalledWith({
        where: { employeeId, effectiveTo: null },
        data: { effectiveTo: expectedEffectiveTo },
      })
      expect(mockTx.employeeSalaryConfig.create).toHaveBeenCalledWith({
        data: {
          employeeId,
          templateId: data.templateId,
          baseSalary: data.baseSalary,
          effectiveFrom: data.effectiveFrom,
          note: data.note,
          createdById,
        },
      })
      expect(result).toEqual(mockCreatedConfig)
    })

    it("UTCID02 - rolls back and throws error when updateMany transaction query fails", async () => {
      // Arrange
      const employeeId = "emp-123"
      const createdById = "user-admin"
      const data = {
        templateId: "temp-new",
        baseSalary: 1500,
        effectiveFrom: new Date("2023-07-01"),
        note: undefined,
      }

      mockTx.employeeSalaryConfig.updateMany.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(service.assignConfig(employeeId, data, createdById)).rejects.toThrow(
        "Update failed",
      )
      expect(mockTx.employeeSalaryConfig.create).not.toHaveBeenCalled()
    })

    it("UTCID03 - rolls back and throws error when create transaction query fails", async () => {
      // Arrange
      const employeeId = "emp-123"
      const createdById = "user-admin"
      const data = {
        templateId: "temp-new",
        baseSalary: 1500,
        effectiveFrom: new Date("2023-07-01"),
        note: undefined,
      }

      mockTx.employeeSalaryConfig.updateMany.mockResolvedValue({ count: 1 })
      mockTx.employeeSalaryConfig.create.mockRejectedValue(new Error("Insert failed"))

      // Act & Assert
      await expect(service.assignConfig(employeeId, data, createdById)).rejects.toThrow(
        "Insert failed",
      )
    })
  })
})
