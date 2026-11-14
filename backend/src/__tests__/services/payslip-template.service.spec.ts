/// <reference types="jest" />
import { ICreatePayslipTemplateDTO, IUpdatePayslipTemplateDTO } from "@/types/payroll.types.ts"
import { AppError } from "@/utils/error.util.ts"

import { PayslipTemplateService } from "../../services/payslip-template.service"

jest.mock("@/configs/messages/payroll.message", () => ({
  PAYROLL_MESSAGES: {
    ERRORS: {
      TEMPLATE_NOT_FOUND_CREATE: "TEMPLATE_NOT_FOUND_CREATE",
      TEMPLATE_NOT_FOUND_UPDATE: "TEMPLATE_NOT_FOUND_UPDATE",
    },
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: { SERVICE: "SERVICE" },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: { NOT_FOUND: 404, INTERNAL_SERVER_ERROR: 500 },
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      public statusCode: number
      public errorLayer: string
      constructor(message: string, statusCode: number, errorLayer: string) {
        super(message)
        this.message = message
        this.statusCode = statusCode
        this.errorLayer = errorLayer
      }
    },
  }
})

describe("PayslipTemplateService", () => {
  let service: PayslipTemplateService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }
    service = new PayslipTemplateService(mockRepo)
  })

  describe("listTemplates", () => {
    it("UTCID01 - listTemplates returns templates successfully", async () => {
      const filter = { isActive: true }
      const expectedTemplates = [{ id: "1", name: "Temp" }]
      mockRepo.findAll.mockResolvedValue(expectedTemplates)

      const result = await service.listTemplates(filter)

      expect(mockRepo.findAll).toHaveBeenCalledWith(filter)
      expect(result).toEqual(expectedTemplates)
    })

    it("UTCID02 - listTemplates throws error when repo findAll fails", async () => {
      const filter = { isActive: true }
      mockRepo.findAll.mockRejectedValue(new Error("DB Error"))

      await expect(service.listTemplates(filter)).rejects.toThrow("DB Error")
    })

    it("UTCID03 - listTemplates throws network timeout error", async () => {
      const filter = { isActive: false }
      mockRepo.findAll.mockRejectedValue(new Error("Timeout"))

      await expect(service.listTemplates(filter)).rejects.toThrow("Timeout")
    })
  })

  describe("createTemplate", () => {
    it("UTCID01 - createTemplate successfully creates and returns template", async () => {
      const data: ICreatePayslipTemplateDTO = { name: "Temp", components: [] }
      const createdById = "user1"
      const created = { id: "t1" }
      const fullTemplate = { id: "t1", name: "Temp", components: [] }
      mockRepo.create.mockResolvedValue(created)
      mockRepo.findById.mockResolvedValue(fullTemplate)

      const result = await service.createTemplate(data, createdById)

      expect(mockRepo.create).toHaveBeenCalledWith(data, createdById)
      expect(mockRepo.findById).toHaveBeenCalledWith("t1")
      expect(result).toEqual(fullTemplate)
    })

    it("UTCID02 - createTemplate throws AppError when created template is not found", async () => {
      const data: ICreatePayslipTemplateDTO = { name: "Temp", components: [] }
      const createdById = "user1"
      const created = { id: "t1" }
      mockRepo.create.mockResolvedValue(created)
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.createTemplate(data, createdById)).rejects.toThrow(
        new AppError("TEMPLATE_NOT_FOUND_CREATE", 404, "SERVICE"),
      )
    })

    it("UTCID03 - createTemplate throws error when repo create fails", async () => {
      const data: ICreatePayslipTemplateDTO = { name: "Temp", components: [] }
      const createdById = "user1"
      mockRepo.create.mockRejectedValue(new Error("Write error"))

      await expect(service.createTemplate(data, createdById)).rejects.toThrow("Write error")
    })
  })

  describe("updateTemplate", () => {
    it("UTCID01 - updateTemplate successfully updates and returns template", async () => {
      const id = "t1"
      const data: IUpdatePayslipTemplateDTO = { name: "Temp Updated" }
      const fullTemplate = { id: "t1", name: "Temp Updated", components: [] }
      mockRepo.update.mockResolvedValue(undefined)
      mockRepo.findById.mockResolvedValue(fullTemplate)

      const result = await service.updateTemplate(id, data)

      expect(mockRepo.update).toHaveBeenCalledWith(id, data)
      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(fullTemplate)
    })

    it("UTCID02 - updateTemplate throws AppError when updated template is not found", async () => {
      const id = "t1"
      const data: IUpdatePayslipTemplateDTO = { name: "Temp Updated" }
      mockRepo.update.mockResolvedValue(undefined)
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.updateTemplate(id, data)).rejects.toThrow(
        new AppError("TEMPLATE_NOT_FOUND_UPDATE", 404, "SERVICE"),
      )
    })

    it("UTCID03 - updateTemplate throws error when repo update fails", async () => {
      const id = "t1"
      const data: IUpdatePayslipTemplateDTO = { name: "Temp Updated" }
      mockRepo.update.mockRejectedValue(new Error("Update failed"))

      await expect(service.updateTemplate(id, data)).rejects.toThrow("Update failed")
    })
  })

  describe("deleteTemplate", () => {
    it("UTCID01 - deleteTemplate successfully soft deletes template", async () => {
      const id = "t1"
      mockRepo.softDelete.mockResolvedValue(undefined)

      await service.deleteTemplate(id)

      expect(mockRepo.softDelete).toHaveBeenCalledWith(id)
    })

    it("UTCID02 - deleteTemplate throws error when repo softDelete fails", async () => {
      const id = "t1"
      mockRepo.softDelete.mockRejectedValue(new Error("Delete error"))

      await expect(service.deleteTemplate(id)).rejects.toThrow("Delete error")
    })

    it("UTCID03 - deleteTemplate throws error on invalid parameters", async () => {
      const id = null as any
      mockRepo.softDelete.mockRejectedValue(new Error("Invalid ID"))

      await expect(service.deleteTemplate(id)).rejects.toThrow("Invalid ID")
    })
  })
})
