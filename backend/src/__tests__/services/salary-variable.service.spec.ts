/// <reference types="jest" />
import { SalaryVariableService } from "../../services/salary-variable.service"

jest.mock("@/configs/messages/payroll.message", () => ({
  PAYROLL_MESSAGES: {
    ERRORS: {
      SALARY_VARIABLE_NOT_FOUND: "SALARY_VARIABLE_NOT_FOUND",
      SALARY_VARIABLE_EXISTS: "SALARY_VARIABLE_EXISTS",
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
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    constructor(
      public message: string,
      public statusCode: number,
      public layer: string,
    ) {
      super(message)
      this.name = "AppError"
    }
  },
}))

describe("SalaryVariableService", () => {
  let service: SalaryVariableService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }
    service = new SalaryVariableService(mockRepo)
  })

  describe("listVariables", () => {
    it("UTCID01 - returns list of variables matching filter", async () => {
      // Arrange
      const mockFilter = { isActive: true }
      const mockResult = [
        {
          id: "1",
          code: "BASIC_SALARY",
          name: "Basic Salary",
          value: 1000,
          description: null,
          isActive: true,
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockRepo.findAll.mockResolvedValue(mockResult)

      // Act
      const result = await service.listVariables(mockFilter)

      // Assert
      expect(mockRepo.findAll).toHaveBeenCalledWith(mockFilter)
      expect(result).toEqual(mockResult)
    })

    it("UTCID02 - throws repository mapping error when search fails", async () => {
      // Arrange
      mockRepo.findAll.mockRejectedValue(new Error("DB_QUERY_FAILURE"))

      // Act & Assert
      await expect(service.listVariables()).rejects.toThrow("DB_QUERY_FAILURE")
    })

    it("UTCID03 - throws error when database connection times out", async () => {
      // Arrange
      mockRepo.findAll.mockRejectedValue(new Error("CONNECTION_TIMEOUT"))

      // Act & Assert
      await expect(service.listVariables()).rejects.toThrow("CONNECTION_TIMEOUT")
    })
  })

  describe("getVariable", () => {
    it("UTCID01 - returns single variable when found by id", async () => {
      // Arrange
      const mockVariable = {
        id: "1",
        code: "BASIC_SALARY",
        name: "Basic Salary",
        value: 1000,
        description: null,
        isActive: true,
        createdById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockRepo.findById.mockResolvedValue(mockVariable)

      // Act
      const result = await service.getVariable("1")

      // Assert
      expect(mockRepo.findById).toHaveBeenCalledWith("1")
      expect(result).toEqual(mockVariable)
    })

    it("UTCID02 - throws AppError 404 when variable is not found", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getVariable("invalid-id")).rejects.toThrow(
        expect.objectContaining({
          message: "SALARY_VARIABLE_NOT_FOUND",
          statusCode: 404,
          layer: "SERVICE",
        }),
      )
    })

    it("UTCID03 - throws error when repository query fails", async () => {
      // Arrange
      mockRepo.findById.mockRejectedValue(new Error("DB_READ_ERROR"))

      // Act & Assert
      await expect(service.getVariable("1")).rejects.toThrow("DB_READ_ERROR")
    })
  })

  describe("createVariable", () => {
    const inputDto = {
      code: "ALLOWANCE",
      name: "Allowance",
      value: 200 as any,
      description: undefined,
      isActive: true,
    }
    const createdById = "admin-1"

    it("UTCID01 - creates a new variable successfully", async () => {
      // Arrange
      const createdRecord = {
        ...inputDto,
        description: null,
        id: "new-id",
        createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockRepo.findByCode.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(createdRecord)

      // Act
      const result = await service.createVariable(inputDto, createdById)

      // Assert
      expect(mockRepo.findByCode).toHaveBeenCalledWith("ALLOWANCE")
      expect(mockRepo.create).toHaveBeenCalledWith({ ...inputDto, createdById })
      expect(result).toEqual(createdRecord)
    })

    it("UTCID02 - throws AppError 400 when code already exists", async () => {
      // Arrange
      mockRepo.findByCode.mockResolvedValue({ id: "existing-id", code: "ALLOWANCE" })

      // Act & Assert
      await expect(service.createVariable(inputDto, createdById)).rejects.toThrow(
        expect.objectContaining({
          message: "SALARY_VARIABLE_EXISTS",
          statusCode: 400,
          layer: "SERVICE",
        }),
      )
    })

    it("UTCID03 - throws error when repository creation fails", async () => {
      // Arrange
      mockRepo.findByCode.mockResolvedValue(null)
      mockRepo.create.mockRejectedValue(new Error("INSERT_FAILED"))

      // Act & Assert
      await expect(service.createVariable(inputDto, createdById)).rejects.toThrow("INSERT_FAILED")
    })
  })

  describe("updateVariable", () => {
    const updateDto = {
      code: "NEW_ALLOWANCE",
      name: "Updated Allowance",
    }
    const existingRecord = {
      id: "existing-id",
      code: "ALLOWANCE",
      name: "Allowance",
      value: 200,
      description: null,
      isActive: true,
      createdById: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it("UTCID01 - updates a variable successfully when code matches existing", async () => {
      // Arrange
      const updatedRecord = { ...existingRecord, ...updateDto }
      mockRepo.findById.mockResolvedValue(existingRecord)
      mockRepo.findByCode.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue(updatedRecord)

      // Act
      const result = await service.updateVariable("existing-id", updateDto)

      // Assert
      expect(mockRepo.findById).toHaveBeenCalledWith("existing-id")
      expect(mockRepo.findByCode).toHaveBeenCalledWith("NEW_ALLOWANCE")
      expect(mockRepo.update).toHaveBeenCalledWith("existing-id", updateDto)
      expect(result).toEqual(updatedRecord)
    })

    it("UTCID02 - throws AppError 404 when updating non-existent variable", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.updateVariable("non-existent", updateDto)).rejects.toThrow(
        expect.objectContaining({
          message: "SALARY_VARIABLE_NOT_FOUND",
          statusCode: 404,
          layer: "SERVICE",
        }),
      )
    })

    it("UTCID03 - throws AppError 400 when updating code to one that is already in use", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(existingRecord)
      mockRepo.findByCode.mockResolvedValue({ id: "other-id", code: "NEW_ALLOWANCE" })

      // Act & Assert
      await expect(service.updateVariable("existing-id", updateDto)).rejects.toThrow(
        expect.objectContaining({
          message: "SALARY_VARIABLE_EXISTS",
          statusCode: 400,
          layer: "SERVICE",
        }),
      )
    })
  })

  describe("deleteVariable", () => {
    const existingRecord = {
      id: "existing-id",
      code: "ALLOWANCE",
      name: "Allowance",
      value: 200,
      description: null,
      isActive: true,
      createdById: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it("UTCID01 - soft deletes a variable successfully", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(existingRecord)
      mockRepo.softDelete.mockResolvedValue(undefined)

      // Act
      await service.deleteVariable("existing-id")

      // Assert
      expect(mockRepo.findById).toHaveBeenCalledWith("existing-id")
      expect(mockRepo.softDelete).toHaveBeenCalledWith("existing-id")
    })

    it("UTCID02 - throws AppError 404 when deleting non-existent variable", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.deleteVariable("non-existent")).rejects.toThrow(
        expect.objectContaining({
          message: "SALARY_VARIABLE_NOT_FOUND",
          statusCode: 404,
          layer: "SERVICE",
        }),
      )
    })

    it("UTCID03 - throws error when repository softDelete operation fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(existingRecord)
      mockRepo.softDelete.mockRejectedValue(new Error("SOFT_DELETE_FAILED"))

      // Act & Assert
      await expect(service.deleteVariable("existing-id")).rejects.toThrow("SOFT_DELETE_FAILED")
    })
  })
})
