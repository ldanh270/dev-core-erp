/// <reference types="jest" />
import { AppError } from "@/utils/error.util.ts"

import { AuditService, auditService } from "../../services/audit.service"
import { AuditLogQuery, CreateAuditLogDto, IAuditRepository } from "../../types"

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    OK: 200,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      public statusCode: number
      public source: string

      constructor(message: string, statusCode: number, source: string) {
        super(message)
        this.name = "AppError"
        this.statusCode = statusCode
        this.source = source
      }
    },
  }
})

jest.mock("../../libs/database.ts", () => ({
  prisma: {},
}))

jest.mock("../../repositories/audit.repository.ts", () => {
  return {
    PrismaAuditRepository: jest.fn().mockImplementation(() => {
      return {
        createLog: jest.fn(),
        findLogById: jest.fn(),
        listLogsPaginated: jest.fn(),
        listLogsByEmployeeId: jest.fn(),
        listLogsByRoleId: jest.fn(),
      }
    }),
  }
})

describe("AuditService", () => {
  let mockRepository: {
    createLog: jest.Mock
    findLogById: jest.Mock
    listLogsPaginated: jest.Mock
    listLogsByEmployeeId: jest.Mock
    listLogsByRoleId: jest.Mock
  }
  let service: AuditService

  beforeEach(() => {
    mockRepository = {
      createLog: jest.fn(),
      findLogById: jest.fn(),
      listLogsPaginated: jest.fn(),
      listLogsByEmployeeId: jest.fn(),
      listLogsByRoleId: jest.fn(),
    }
    service = new AuditService(mockRepository as unknown as IAuditRepository)
    jest.restoreAllMocks()
  })

  describe("log", () => {
    let setImmediateSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      setImmediateSpy = jest
        .spyOn(global, "setImmediate")
        .mockImplementation((cb: (...args: unknown[]) => void): NodeJS.Immediate => {
          cb()
          return {} as NodeJS.Immediate
        })
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
      setImmediateSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it("UTCID01 - should successfully schedule and call repository.createLog", async () => {
      // Arrange
      const event = {
        action: "CREATE",
        actorId: "user-1",
        details: { foo: "bar" },
      }
      mockRepository.createLog.mockResolvedValue(undefined)

      // Act
      await service.log(event as CreateAuditLogDto)

      // Assert
      expect(setImmediateSpy).toHaveBeenCalled()
      expect(mockRepository.createLog).toHaveBeenCalledWith(event)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it("UTCID02 - should catch and log error if repository.createLog throws database error", async () => {
      // Arrange
      const event = {
        action: "UPDATE",
        actorId: "user-2",
        details: { x: 1 },
      }
      const dbError = new Error("Database connection failed")
      mockRepository.createLog.mockRejectedValue(dbError)

      // Act
      await service.log(event as CreateAuditLogDto)

      // Assert
      expect(setImmediateSpy).toHaveBeenCalled()
      expect(mockRepository.createLog).toHaveBeenCalledWith(event)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[AuditService] Non-blocking audit logging failed:",
        dbError,
      )
    })

    it("UTCID03 - should catch and log error if repository.createLog throws validation error", async () => {
      // Arrange
      const event = {
        action: "DELETE",
        actorId: "user-3",
        details: {},
      }
      const validationError = new Error("Validation failed")
      mockRepository.createLog.mockRejectedValue(validationError)

      // Act
      await service.log(event as CreateAuditLogDto)

      // Assert
      expect(setImmediateSpy).toHaveBeenCalled()
      expect(mockRepository.createLog).toHaveBeenCalledWith(event)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[AuditService] Non-blocking audit logging failed:",
        validationError,
      )
    })
  })

  describe("getLogById", () => {
    it("UTCID01 - should successfully return an audit log when it exists", async () => {
      // Arrange
      const logId = "log-123"
      const expectedLog = {
        id: logId,
        action: "CREATE",
        actorId: "actor-1",
        targetEmployeeId: null,
        targetRoleId: null,
        createdAt: new Date(),
      }
      mockRepository.findLogById.mockResolvedValue(expectedLog)

      // Act
      const result = await service.getLogById(logId)

      // Assert
      expect(mockRepository.findLogById).toHaveBeenCalledWith(logId)
      expect(result).toEqual(expectedLog)
    })

    it("UTCID02 - should throw AppError (404) when audit log is not found", async () => {
      // Arrange
      const logId = "log-999"
      mockRepository.findLogById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getLogById(logId)).rejects.toThrow(AppError)
      await expect(service.getLogById(logId)).rejects.toThrow("Audit log not found")
      expect(mockRepository.findLogById).toHaveBeenCalledWith(logId)
    })

    it("UTCID03 - should bubble up database connection error", async () => {
      // Arrange
      const logId = "log-123"
      const dbError = new Error("Connection timed out")
      mockRepository.findLogById.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.getLogById(logId)).rejects.toThrow("Connection timed out")
      expect(mockRepository.findLogById).toHaveBeenCalledWith(logId)
    })
  })

  describe("listLogs", () => {
    it("UTCID01 - should successfully return paginated logs", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const expectedResult = {
        data: [{ id: "1", action: "CREATE", targetEmployeeId: null, targetRoleId: null }],
        total: 1,
        page: 1,
        limit: 10,
      }
      mockRepository.listLogsPaginated.mockResolvedValue(expectedResult)

      // Act
      const result = await service.listLogs(query as AuditLogQuery)

      // Assert
      expect(mockRepository.listLogsPaginated).toHaveBeenCalledWith(query)
      expect(result).toEqual(expectedResult)
    })

    it("UTCID02 - should bubble up repository pagination error", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const dbError = new Error("Invalid limit parameter")
      mockRepository.listLogsPaginated.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogs(query as AuditLogQuery)).rejects.toThrow(
        "Invalid limit parameter",
      )
      expect(mockRepository.listLogsPaginated).toHaveBeenCalledWith(query)
    })

    it("UTCID03 - should bubble up repository database connection error", async () => {
      // Arrange
      const query = { page: 2, limit: 20 }
      const dbError = new Error("Database connection failed")
      mockRepository.listLogsPaginated.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogs(query as AuditLogQuery)).rejects.toThrow(
        "Database connection failed",
      )
      expect(mockRepository.listLogsPaginated).toHaveBeenCalledWith(query)
    })
  })

  describe("listLogsByEmployee", () => {
    it("UTCID01 - should successfully return employee specific logs", async () => {
      // Arrange
      const employeeId = "emp-456"
      const query = { page: 1, limit: 10 }
      const expectedResult = {
        data: [{ id: "1", action: "CREATE", targetEmployeeId: employeeId, targetRoleId: null }],
        total: 1,
        page: 1,
        limit: 10,
      }
      mockRepository.listLogsByEmployeeId.mockResolvedValue(expectedResult)

      // Act
      const result = await service.listLogsByEmployee(employeeId, query as AuditLogQuery)

      // Assert
      expect(mockRepository.listLogsByEmployeeId).toHaveBeenCalledWith(employeeId, query)
      expect(result).toEqual(expectedResult)
    })

    it("UTCID02 - should bubble up repository invalid employee error", async () => {
      // Arrange
      const employeeId = "emp-invalid"
      const query = { page: 1, limit: 10 }
      const dbError = new Error("Invalid employee ID")
      mockRepository.listLogsByEmployeeId.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogsByEmployee(employeeId, query as AuditLogQuery)).rejects.toThrow(
        "Invalid employee ID",
      )
      expect(mockRepository.listLogsByEmployeeId).toHaveBeenCalledWith(employeeId, query)
    })

    it("UTCID03 - should bubble up repository database connection error", async () => {
      // Arrange
      const employeeId = "emp-456"
      const query = { page: 1, limit: 10 }
      const dbError = new Error("Database offline")
      mockRepository.listLogsByEmployeeId.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogsByEmployee(employeeId, query as AuditLogQuery)).rejects.toThrow(
        "Database offline",
      )
      expect(mockRepository.listLogsByEmployeeId).toHaveBeenCalledWith(employeeId, query)
    })
  })

  describe("listLogsByRole", () => {
    it("UTCID01 - should successfully return role specific logs", async () => {
      // Arrange
      const roleId = "role-789"
      const query = { page: 1, limit: 5 }
      const expectedResult = {
        data: [{ id: "1", action: "ASSIGN", targetEmployeeId: null, targetRoleId: roleId }],
        total: 1,
        page: 1,
        limit: 5,
      }
      mockRepository.listLogsByRoleId.mockResolvedValue(expectedResult)

      // Act
      const result = await service.listLogsByRole(roleId, query as AuditLogQuery)

      // Assert
      expect(mockRepository.listLogsByRoleId).toHaveBeenCalledWith(roleId, query)
      expect(result).toEqual(expectedResult)
    })

    it("UTCID02 - should bubble up repository invalid role error", async () => {
      // Arrange
      const roleId = "role-invalid"
      const query = { page: 1, limit: 5 }
      const dbError = new Error("Invalid role ID")
      mockRepository.listLogsByRoleId.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogsByRole(roleId, query as AuditLogQuery)).rejects.toThrow(
        "Invalid role ID",
      )
      expect(mockRepository.listLogsByRoleId).toHaveBeenCalledWith(roleId, query)
    })

    it("UTCID03 - should bubble up repository database connection error", async () => {
      // Arrange
      const roleId = "role-789"
      const query = { page: 1, limit: 5 }
      const dbError = new Error("Database query timed out")
      mockRepository.listLogsByRoleId.mockRejectedValue(dbError)

      // Act & Assert
      await expect(service.listLogsByRole(roleId, query as AuditLogQuery)).rejects.toThrow(
        "Database query timed out",
      )
      expect(mockRepository.listLogsByRoleId).toHaveBeenCalledWith(roleId, query)
    })
  })
})

describe("Exported auditService instance", () => {
  it("UTCID01 - should be defined and be an instance of AuditService", () => {
    // Arrange & Act & Assert
    expect(auditService).toBeDefined()
    expect(auditService).toBeInstanceOf(AuditService)
  })
})
