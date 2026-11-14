/// <reference types="jest" />
/* eslint-disable @typescript-eslint/unbound-method */
import { IPermissionRepository } from "@/types"

import { auditService } from "../../services/audit.service"
import { authorizationService } from "../../services/authorization.service"
import { PermissionService } from "../../services/permission.service"

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    NOT_FOUND: 404,
    CONFLICT: 409,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
  },
}))

jest.mock("@/constants/permission.constants.ts", () => ({
  PERMISSION_AUDIT_ACTIONS: {
    CREATED: "CREATED",
    UPDATED: "UPDATED",
    DELETED: "DELETED",
  },
  PERMISSION_ERROR_CODES: {
    SYSTEM_PROTECTED: "SYSTEM_PROTECTED",
    ASSIGNED: "ASSIGNED",
  },
  PERMISSION_ERROR_MESSAGES: {
    NOT_FOUND: "NOT_FOUND",
    SYSTEM_UPDATE: "SYSTEM_UPDATE",
    CODE_IMMUTABLE: "CODE_IMMUTABLE",
    SYSTEM_DELETE: "SYSTEM_DELETE",
    ASSIGNED: "ASSIGNED",
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layer: string
    errorCode: string | null

    constructor(message: string, statusCode: number, layer: string, errorCode?: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.layer = layer
      this.errorCode = errorCode || null
    }
  },
}))

jest.mock("../../services/audit.service.ts", () => ({
  auditService: {
    log: jest.fn(),
  },
}))

jest.mock("../../services/authorization.service.ts", () => ({
  authorizationService: {
    invalidatePermissionCache: jest.fn(),
  },
}))

type MockPermissionRepository = {
  listPermissionsPaginated: jest.Mock
  findById: jest.Mock
  findByCode: jest.Mock
  createPermission: jest.Mock
  updatePermission: jest.Mock
  deletePermission: jest.Mock
}

describe("PermissionService", () => {
  let service: PermissionService
  let mockRepository: MockPermissionRepository

  beforeEach(() => {
    jest.clearAllMocks()

    mockRepository = {
      listPermissionsPaginated: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      createPermission: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
    }

    service = new PermissionService(mockRepository as unknown as IPermissionRepository)
  })

  describe("listPermissions", () => {
    it("UTCID01 - should return a paginated list of permissions successfully", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const expectedResult = {
        data: [
          {
            id: "perm-1",
            name: "Read Users",
            code: "READ_USERS",
            module: "USER_MANAGEMENT",
            description: null,
            isSystem: false,
            isActive: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }
      mockRepository.listPermissionsPaginated.mockResolvedValue(expectedResult)

      // Act
      const result = await service.listPermissions(query)

      // Assert
      expect(mockRepository.listPermissionsPaginated).toHaveBeenCalledWith(query)
      expect(result).toEqual(expectedResult)
    })

    it("UTCID02 - should throw an error when repository paginated call fails", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      mockRepository.listPermissionsPaginated.mockRejectedValue(
        new Error("Database Connection Fail"),
      )

      // Act & Assert
      await expect(service.listPermissions(query)).rejects.toThrow("Database Connection Fail")
    })

    it("UTCID03 - should throw an error when repository throws invalid query validation error", async () => {
      // Arrange
      const query = { page: -1, limit: 10 }
      mockRepository.listPermissionsPaginated.mockRejectedValue(
        new Error("Invalid pagination params"),
      )

      // Act & Assert
      await expect(service.listPermissions(query)).rejects.toThrow("Invalid pagination params")
    })
  })

  describe("getPermission", () => {
    it("UTCID01 - should return permission details when found by ID", async () => {
      // Arrange
      const id = "perm-1"
      const expectedPermission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(expectedPermission)

      // Act
      const result = await service.getPermission(id)

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(expectedPermission)
    })

    it("UTCID02 - should throw AppError NOT_FOUND when permission is not found", async () => {
      // Arrange
      const id = "non-existent"
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getPermission(id)).rejects.toThrow(
        expect.objectContaining({
          message: "NOT_FOUND",
          statusCode: 404,
          layer: "SERVICE",
        }),
      )
      expect(mockRepository.findById).toHaveBeenCalledWith(id)
    })

    it("UTCID03 - should propagate repository query failures", async () => {
      // Arrange
      const id = "perm-1"
      mockRepository.findById.mockRejectedValue(new Error("Query Timeout"))

      // Act & Assert
      await expect(service.getPermission(id)).rejects.toThrow("Query Timeout")
    })
  })

  describe("createPermission", () => {
    it("UTCID01 - should successfully create a permission and log an audit action", async () => {
      // Arrange
      const dto = {
        name: "Write Users",
        code: "WRITE_USERS",
        module: "USER_MANAGEMENT",
        description: "Allows writing user data",
        actorId: "actor-123",
      }
      const createdPermission = {
        id: "perm-2",
        name: dto.name,
        code: dto.code,
        module: dto.module,
        description: dto.description,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findByCode.mockResolvedValue(null)
      mockRepository.createPermission.mockResolvedValue(createdPermission)

      // Act
      const result = await service.createPermission(dto)

      // Assert
      expect(mockRepository.findByCode).toHaveBeenCalledWith(dto.code)
      expect(mockRepository.createPermission).toHaveBeenCalledWith({
        name: dto.name,
        code: dto.code,
        module: dto.module,
        description: dto.description,
        createdBy: dto.actorId,
      })
      expect(jest.mocked(auditService.log)).toHaveBeenCalledWith({
        actorId: dto.actorId,
        targetPermissionId: createdPermission.id,
        action: "CREATED",
        newValue: {
          name: createdPermission.name,
          code: createdPermission.code,
          module: createdPermission.module,
        },
      })
      expect(result).toEqual(createdPermission)
    })

    it("UTCID02 - should throw AppError CONFLICT when permission with same code already exists", async () => {
      // Arrange
      const dto = {
        name: "Write Users",
        code: "WRITE_USERS",
        module: "USER_MANAGEMENT",
        description: "Allows writing user data",
        actorId: "actor-123",
      }
      const existingPermission = {
        id: "perm-existing",
        name: "Existing",
        code: dto.code,
        module: "OTHER",
        description: null,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findByCode.mockResolvedValue(existingPermission)

      // Act & Assert
      await expect(service.createPermission(dto)).rejects.toThrow(
        expect.objectContaining({
          message: "Permission with code 'WRITE_USERS' already exists.",
          statusCode: 409,
          layer: "SERVICE",
        }),
      )
      expect(mockRepository.createPermission).not.toHaveBeenCalled()
      expect(jest.mocked(auditService.log)).not.toHaveBeenCalled()
    })

    it("UTCID03 - should throw error when repository execution fails during creation", async () => {
      // Arrange
      const dto = {
        name: "Write Users",
        code: "WRITE_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        actorId: "actor-123",
      }
      mockRepository.findByCode.mockResolvedValue(null)
      mockRepository.createPermission.mockRejectedValue(new Error("Transaction Aborted"))

      // Act & Assert
      await expect(service.createPermission(dto)).rejects.toThrow("Transaction Aborted")
      expect(auditService.log).not.toHaveBeenCalled()
    })
  })

  describe("updatePermission", () => {
    it("UTCID01 - should successfully update permission, invalidate cache, and log audit", async () => {
      // Arrange
      const id = "perm-1"
      const dto = {
        name: "Updated Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT_UPDATED",
        description: "Updated description",
        isActive: true,
        actorId: "actor-123",
      }
      const currentPermission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: "Old Description",
        isSystem: false,
        isActive: true,
      }
      const updatedPermission = {
        id,
        name: dto.name,
        code: dto.code,
        module: dto.module,
        description: dto.description,
        isSystem: false,
        isActive: dto.isActive,
      }

      mockRepository.findById.mockResolvedValue(currentPermission)
      mockRepository.updatePermission.mockResolvedValue(updatedPermission)

      // Act
      const result = await service.updatePermission(id, dto)

      // Assert
      expect(mockRepository.updatePermission).toHaveBeenCalledWith(id, {
        name: dto.name,
        code: dto.code,
        module: dto.module,
        description: dto.description,
        isActive: dto.isActive,
        updatedBy: dto.actorId,
      })
      expect(jest.mocked(authorizationService.invalidatePermissionCache)).toHaveBeenCalledWith(id)
      expect(jest.mocked(auditService.log)).toHaveBeenCalledWith({
        actorId: dto.actorId,
        targetPermissionId: id,
        action: "UPDATED",
        oldValue: {
          name: currentPermission.name,
          description: currentPermission.description,
          isActive: currentPermission.isActive,
        },
        newValue: {
          name: updatedPermission.name,
          description: updatedPermission.description,
          isActive: updatedPermission.isActive,
        },
      })
      expect(result).toEqual(updatedPermission)
    })

    it("UTCID02 - should throw AppError NOT_FOUND if permission to update does not exist", async () => {
      // Arrange
      const id = "non-existent"
      const dto = {
        name: "Update",
        actorId: "actor-123",
      }
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.updatePermission(id, dto)).rejects.toThrow(
        expect.objectContaining({
          message: "NOT_FOUND",
          statusCode: 404,
          layer: "SERVICE",
        }),
      )
      expect(mockRepository.updatePermission).not.toHaveBeenCalled()
    })

    it("UTCID03 - should throw AppError FORBIDDEN when updating a system-protected permission", async () => {
      // Arrange
      const id = "system-perm"
      const dto = {
        name: "Change Sys Name",
        actorId: "actor-123",
      }
      const systemPermission = {
        id,
        name: "System Permission",
        code: "SYSTEM_CODE",
        module: "SYSTEM",
        description: null,
        isSystem: true,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(systemPermission)

      // Act & Assert
      await expect(service.updatePermission(id, dto)).rejects.toThrow(
        expect.objectContaining({
          message: "SYSTEM_UPDATE",
          statusCode: 403,
          layer: "SERVICE",
          errorCode: "SYSTEM_PROTECTED",
        }),
      )
      expect(mockRepository.updatePermission).not.toHaveBeenCalled()
    })

    it("UTCID04 - should throw AppError BAD_REQUEST when trying to change the immutable code of permission", async () => {
      // Arrange
      const id = "perm-1"
      const dto = {
        name: "Read Users",
        code: "NEW_CODE_VALUE",
        actorId: "actor-123",
      }
      const currentPermission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(currentPermission)

      // Act & Assert
      await expect(service.updatePermission(id, dto)).rejects.toThrow(
        expect.objectContaining({
          message: "CODE_IMMUTABLE",
          statusCode: 400,
          layer: "SERVICE",
        }),
      )
      expect(mockRepository.updatePermission).not.toHaveBeenCalled()
    })
  })

  describe("deletePermission", () => {
    it("UTCID01 - should successfully soft-delete permission, invalidate cache, and log audit", async () => {
      // Arrange
      const id = "perm-1"
      const actorId = "actor-123"
      const permission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        isSystem: false,
        isActive: true,
      }

      mockRepository.findById.mockResolvedValue(permission)
      mockRepository.deletePermission.mockResolvedValue(true)

      // Act
      const result = await service.deletePermission(id, actorId)

      // Assert
      expect(mockRepository.deletePermission).toHaveBeenCalledWith(id, actorId)
      expect(authorizationService.invalidatePermissionCache).toHaveBeenCalledWith(id)
      expect(auditService.log).toHaveBeenCalledWith({
        actorId,
        targetPermissionId: id,
        action: "DELETED",
      })
      expect(result).toBe(true)
    })

    it("UTCID02 - should throw AppError FORBIDDEN when attempting to delete a system permission", async () => {
      // Arrange
      const id = "system-perm"
      const actorId = "actor-123"
      const systemPermission = {
        id,
        name: "System Permission",
        code: "SYSTEM_CODE",
        module: "SYSTEM",
        description: null,
        isSystem: true,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(systemPermission)

      // Act & Assert
      await expect(service.deletePermission(id, actorId)).rejects.toThrow(
        expect.objectContaining({
          message: "SYSTEM_DELETE",
          statusCode: 403,
          layer: "SERVICE",
          errorCode: "SYSTEM_PROTECTED",
        }),
      )
      expect(mockRepository.deletePermission).not.toHaveBeenCalled()
    })

    it("UTCID03 - should throw AppError CONFLICT when repository throws ASSIGNED error code", async () => {
      // Arrange
      const id = "perm-1"
      const actorId = "actor-123"
      const permission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(permission)
      mockRepository.deletePermission.mockRejectedValue(new Error("ASSIGNED"))

      // Act & Assert
      await expect(service.deletePermission(id, actorId)).rejects.toThrow(
        expect.objectContaining({
          message: "ASSIGNED",
          statusCode: 409,
          layer: "SERVICE",
          errorCode: "ASSIGNED",
        }),
      )
    })

    it("UTCID04 - should bubble up standard errors thrown by repository during deletion", async () => {
      // Arrange
      const id = "perm-1"
      const actorId = "actor-123"
      const permission = {
        id,
        name: "Read Users",
        code: "READ_USERS",
        module: "USER_MANAGEMENT",
        description: null,
        isSystem: false,
        isActive: true,
      }
      mockRepository.findById.mockResolvedValue(permission)
      mockRepository.deletePermission.mockRejectedValue(new Error("Unexpected DB Error"))

      // Act & Assert
      await expect(service.deletePermission(id, actorId)).rejects.toThrow("Unexpected DB Error")
    })
  })
})
