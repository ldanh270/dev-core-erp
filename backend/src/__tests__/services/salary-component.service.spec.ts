/// <reference types="jest" />
import { prisma } from "@/libs/database.ts"
import { AppError } from "@/utils/error.util.ts"

import { ComponentType } from "@prisma/client"
import * as math from "mathjs"

import { SalaryComponentService } from "../../services/salary-component.service"

jest.mock("@/libs/database.ts", () => ({
  prisma: {
    salaryVariable: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock("mathjs", () => ({
  evaluate: jest.fn(),
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      constructor(
        public message: string,
        public statusCode: number,
        public layer: string,
      ) {
        super(message)
      }
    },
  }
})

jest.mock("@/configs/messages/payroll.message", () => ({
  PAYROLL_MESSAGES: {
    ERRORS: {
      INVALID_FORMULA: (err: string) => `Invalid formula: ${err}`,
      FORMULA_MUST_BE_NUMBER: "Formula must evaluate to a number",
    },
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: { SERVICE: "SERVICE" },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: { BAD_REQUEST: 400 },
}))

describe("SalaryComponentService", () => {
  let service: SalaryComponentService
  let mockRepo: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }
    service = new SalaryComponentService(mockRepo)
  })

  describe("listComponents", () => {
    it("UTCID01 - returns array of salary components", async () => {
      // Arrange
      const expected = [{ id: "1", name: "Base", code: "BASE", type: ComponentType.addition }]
      mockRepo.findAll.mockResolvedValue(expected)

      // Act
      const result = await service.listComponents({ type: ComponentType.addition, isActive: true })

      // Assert
      expect(result).toEqual(expected)
      expect(mockRepo.findAll).toHaveBeenCalledWith({
        type: ComponentType.addition,
        isActive: true,
      })
    })

    it("UTCID02 - throws error if repository findAll fails", async () => {
      // Arrange
      const error = new Error("Database connection failed")
      mockRepo.findAll.mockRejectedValue(error)

      // Act & Assert
      await expect(service.listComponents({})).rejects.toThrow("Database connection failed")
    })

    it("UTCID03 - returns empty array when no components match filter", async () => {
      // Arrange
      mockRepo.findAll.mockResolvedValue([])

      // Act
      const result = await service.listComponents({ isActive: false })

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("createComponent", () => {
    it("UTCID01 - successfully creates component with valid formula", async () => {
      // Arrange
      const data = {
        name: "Bonus",
        code: "BONUS",
        type: ComponentType.addition,
        valueType: "FORMULA" as any,
        formula: "baseSalary * 0.1",
        description: undefined,
        isActive: true,
      }
      const createdComponent = { ...data, id: "1", createdById: "user-1" }
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockReturnValue(1000)
      mockRepo.create.mockResolvedValue(createdComponent)

      // Act
      const result = await service.createComponent(data, "user-1")

      // Assert
      expect(result).toEqual(createdComponent)
      expect(mockRepo.create).toHaveBeenCalledWith({ ...data, createdById: "user-1" })
    })

    it("UTCID02 - throws AppError if formula validation fails", async () => {
      // Arrange
      const data = {
        name: "Bonus",
        code: "BONUS",
        type: ComponentType.addition,
        valueType: "FORMULA" as any,
        formula: "invalid_syntax",
        description: undefined,
        isActive: true,
      }
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockImplementation(() => {
        throw new Error("Parse error")
      })

      // Act & Assert
      await expect(service.createComponent(data, "user-1")).rejects.toThrow(AppError)
    })

    it("UTCID03 - throws error if repository create fails", async () => {
      // Arrange
      const data = {
        name: "Bonus",
        code: "BONUS",
        type: ComponentType.addition,
        valueType: "FORMULA" as any,
        formula: "100",
        description: undefined,
        isActive: true,
      }
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockReturnValue(100)
      mockRepo.create.mockRejectedValue(new Error("Write lock failure"))

      // Act & Assert
      await expect(service.createComponent(data, "user-1")).rejects.toThrow("Write lock failure")
    })
  })

  describe("updateComponent", () => {
    it("UTCID01 - successfully updates component with valid formula", async () => {
      // Arrange
      const data = { formula: "baseSalary * 0.2" }
      const updatedComponent = { id: "1", formula: "baseSalary * 0.2" }
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockReturnValue(2000)
      mockRepo.update.mockResolvedValue(updatedComponent)

      // Act
      const result = await service.updateComponent("1", data)

      // Assert
      expect(result).toEqual(updatedComponent)
      expect(mockRepo.update).toHaveBeenCalledWith("1", data)
    })

    it("UTCID02 - throws AppError if updated formula is invalid", async () => {
      // Arrange
      const data = { formula: "NaN_Value" }
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockReturnValue(NaN)

      // Act & Assert
      await expect(service.updateComponent("1", data)).rejects.toThrow(AppError)
    })

    it("UTCID03 - throws error if repository update fails", async () => {
      // Arrange
      const data = { name: "New Name" }
      mockRepo.update.mockRejectedValue(new Error("Record not found"))

      // Act & Assert
      await expect(service.updateComponent("999", data)).rejects.toThrow("Record not found")
    })
  })

  describe("deleteComponent", () => {
    it("UTCID01 - successfully soft deletes component", async () => {
      // Arrange
      mockRepo.softDelete.mockResolvedValue(undefined)

      // Act
      await service.deleteComponent("1")

      // Assert
      expect(mockRepo.softDelete).toHaveBeenCalledWith("1")
    })

    it("UTCID02 - throws error if repository softDelete fails", async () => {
      // Arrange
      mockRepo.softDelete.mockRejectedValue(new Error("Delete prohibited"))

      // Act & Assert
      await expect(service.deleteComponent("1")).rejects.toThrow("Delete prohibited")
    })

    it("UTCID03 - calls softDelete even with empty or missing ID parameter", async () => {
      // Arrange
      mockRepo.softDelete.mockResolvedValue(undefined)

      // Act
      await service.deleteComponent("")

      // Assert
      expect(mockRepo.softDelete).toHaveBeenCalledWith("")
    })
  })

  describe("validateFormula", () => {
    it("UTCID01 - returns valid true for valid math expression", async () => {
      // Arrange
      const variables = [{ code: "CUSTOM_VAR", value: "100", isActive: true }]
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue(variables)
      ;(math.evaluate as jest.Mock).mockReturnValue(1500)

      // Act
      const result = await service.validateFormula("baseSalary + CUSTOM_VAR")

      // Assert
      expect(result).toEqual({ valid: true })
      expect(math.evaluate).toHaveBeenCalledWith(
        "baseSalary + CUSTOM_VAR",
        expect.objectContaining({
          baseSalary: 10000000,
          CUSTOM_VAR: 100,
        }),
      )
    })

    it("UTCID02 - returns valid false and error message when math.evaluate throws", async () => {
      // Arrange
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockImplementation(() => {
        throw new Error("Evaluation error")
      })

      // Act
      const result = await service.validateFormula("invalid + expression")

      // Assert
      expect(result).toEqual({ valid: false, error: "Evaluation error" })
    })

    it("UTCID03 - returns valid false when math.evaluate returns NaN", async () => {
      // Arrange
      ;(prisma.salaryVariable.findMany as jest.Mock).mockResolvedValue([])
      ;(math.evaluate as jest.Mock).mockReturnValue(NaN)

      // Act
      const result = await service.validateFormula("0 / 0")

      // Assert
      expect(result).toEqual({ valid: false, error: "Formula must evaluate to a number" })
    })
  })
})
