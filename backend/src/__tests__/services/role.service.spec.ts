/// <reference types="jest" />
/* eslint-disable @typescript-eslint/unbound-method */
import { prisma } from "@/libs/database"

import { auditService } from "../../services/audit.service"
import { authorizationService } from "../../services/authorization.service"
import { RoleService } from "../../services/role.service"
import { IRoleRepository, RoleListQuery } from "../../types"

// Mock all external modules
jest.mock("@/libs/database.ts", () => ({
  prisma: {
    permission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      statusCode: number
      service: string
      code?: string
      constructor(message: string, statusCode: number, service: string, code?: string) {
        super(message)
        this.statusCode = statusCode
        this.service = service
        this.code = code
      }
    },
  }
})

jest.mock("../../services/authorization.service", () => ({
  authorizationService: {
    invalidateRoleCache: jest.fn(),
    getAuthorizationContext: jest.fn(),
  },
}))

jest.mock("../../services/audit.service", () => ({
  auditService: {
    log: jest.fn(),
  },
}))

jest.mock("@/configs/auth/auth.config.ts", () => ({
  PROTECTED_PERMISSIONS: ["PROTECTED_PERM"],
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    OK: 200,
    CREATED: 201,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

describe("RoleService", () => {
  const mockRepository = {
    listRolesPaginated: jest.fn() as jest.Mock,
    findById: jest.fn() as jest.Mock,
    findByName: jest.fn() as jest.Mock,
    createRole: jest.fn() as jest.Mock,
    updateRole: jest.fn() as jest.Mock,
    deleteRole: jest.fn() as jest.Mock,
    countRemainingAdminUsers: jest.fn() as jest.Mock,
    findPermissionsByRoleId: jest.fn() as jest.Mock,
    assignPermission: jest.fn() as jest.Mock,
    revokePermission: jest.fn() as jest.Mock,
    updatePermissions: jest.fn() as jest.Mock,
  }

  const mockFindFirst = prisma.permission.findFirst as jest.Mock
  const mockFindMany = prisma.permission.findMany as jest.Mock
  const mockInvalidateRoleCache = jest.mocked(authorizationService.invalidateRoleCache)
  const mockGetAuthorizationContext = jest.mocked(authorizationService.getAuthorizationContext)
  const mockAuditLog = jest.mocked(auditService.log)

  const roleService = new RoleService(mockRepository as unknown as IRoleRepository)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("listRoles", () => {
    it("UTCID01 - should return paginated roles on success (Happy Path)", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const mockResult = { data: [], total: 0, page: 1, limit: 10 }
      mockRepository.listRolesPaginated.mockResolvedValue(mockResult)

      // Act
      const result = await roleService.listRoles(query)

      // Assert
      expect(result).toEqual(mockResult)
      expect(mockRepository.listRolesPaginated).toHaveBeenCalledWith(query)
    })

    it("UTCID02 - should throw error if repository list fails (Error Case 1)", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      mockRepository.listRolesPaginated.mockRejectedValue(new Error("Database Query Error"))

      // Act & Assert
      await expect(roleService.listRoles(query)).rejects.toThrow("Database Query Error")
    })

    it("UTCID03 - should throw error when given null query (Error Case 2)", async () => {
      // Arrange
      const query = null
      mockRepository.listRolesPaginated.mockRejectedValue(new Error("Invalid arguments"))

      // Act & Assert
      await expect(roleService.listRoles(query as unknown as RoleListQuery)).rejects.toThrow(
        "Invalid arguments",
      )
    })
  })

  describe("getRole", () => {
    it("UTCID01 - should return role when it exists (Happy Path)", async () => {
      // Arrange
      const roleId = "role-123"
      const mockRole = { id: roleId, name: "Manager" }
      mockRepository.findById.mockResolvedValue(mockRole)

      // Act
      const result = await roleService.getRole(roleId)

      // Assert
      expect(result).toEqual(mockRole)
      expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
    })

    it("UTCID02 - should throw NOT_FOUND error when role does not exist (Error Case 1)", async () => {
      // Arrange
      const roleId = "non-existent"
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(roleService.getRole(roleId)).rejects.toThrow("Role not found")
      expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
    })

    it("UTCID03 - should throw error if findById database call fails (Error Case 2)", async () => {
      // Arrange
      const roleId = "error-role"
      mockRepository.findById.mockRejectedValue(new Error("Database Connection Fail"))

      // Act & Assert
      await expect(roleService.getRole(roleId)).rejects.toThrow("Database Connection Fail")
    })
  })

  describe("createRole", () => {
    it("UTCID01 - should create a role and log audit when unique name is provided (Happy Path)", async () => {
      // Arrange
      const data = { name: "New Role", description: "Desc", isDefault: false, actorId: "actor-1" }
      const mockCreatedRole = {
        id: "role-1",
        name: "New Role",
        description: "Desc",
        isDefault: false,
      }
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.createRole.mockResolvedValue(mockCreatedRole)

      // Act
      const result = await roleService.createRole(data)

      // Assert
      expect(result).toEqual(mockCreatedRole)
      expect(mockRepository.findByName).toHaveBeenCalledWith("New Role")
      expect(mockRepository.createRole).toHaveBeenCalledWith({
        name: "New Role",
        description: "Desc",
        createdBy: "actor-1",
        isDefault: false,
      })
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetRoleId: "role-1",
        action: "ROLE_CREATED",
        newValue: { name: "New Role", description: "Desc", isDefault: false },
      })
    })

    it("UTCID02 - should throw CONFLICT error when role name already exists (Error Case 1)", async () => {
      // Arrange
      const data = {
        name: "Duplicate Role",
        description: "Desc",
        isDefault: false,
        actorId: "actor-1",
      }
      const existingRole = { id: "role-existing", name: "Duplicate Role" }
      mockRepository.findByName.mockResolvedValue(existingRole)

      // Act & Assert
      await expect(roleService.createRole(data)).rejects.toThrow(
        "Role with name 'Duplicate Role' already exists.",
      )
    })

    it("UTCID03 - should throw error when database insertion fails (Error Case 2)", async () => {
      // Arrange
      const data = { name: "New Role", description: "Desc", isDefault: false, actorId: "actor-1" }
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.createRole.mockRejectedValue(new Error("DB Insert Failure"))

      // Act & Assert
      await expect(roleService.createRole(data)).rejects.toThrow("DB Insert Failure")
    })
  })

  describe("updateRole", () => {
    it("UTCID01 - should update role details and invalidate cache on success (Happy Path)", async () => {
      // Arrange
      const id = "role-1"
      const updateData = {
        name: "Updated Role",
        description: "New Desc",
        isActive: true,
        isDefault: false,
        actorId: "actor-1",
      }
      const currentRole = {
        id,
        name: "Old Role",
        description: "Old Desc",
        isActive: true,
        isDefault: false,
      }
      const updatedRole = {
        id,
        name: "Updated Role",
        description: "New Desc",
        isActive: true,
        isDefault: false,
      }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.updateRole.mockResolvedValue(updatedRole)

      // Act
      const result = await roleService.updateRole(id, updateData)

      // Assert
      expect(result).toEqual(updatedRole)
      expect(mockInvalidateRoleCache).toHaveBeenCalledWith(id)
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetRoleId: id,
        action: "ROLE_UPDATED",
        oldValue: { name: "Old Role", description: "Old Desc", isActive: true, isDefault: false },
        newValue: {
          name: "Updated Role",
          description: "New Desc",
          isActive: true,
          isDefault: false,
        },
      })
    })

    it("UTCID02 - should throw FORBIDDEN error when attempting to rename Admin role (Error Case 1)", async () => {
      // Arrange
      const id = "admin-id"
      const updateData = { name: "Not Admin Anymore", actorId: "actor-1" }
      const currentRole = {
        id,
        name: "Admin",
        description: "Super user",
        isActive: true,
        isDefault: false,
      }

      mockRepository.findById.mockResolvedValue(currentRole)

      // Act & Assert
      await expect(roleService.updateRole(id, updateData)).rejects.toThrow(
        "Cannot rename the Admin role.",
      )
    })

    it("UTCID03 - should throw CONFLICT error when deactivating the last Admin role (Error Case 2)", async () => {
      // Arrange
      const id = "admin-id"
      const updateData = { isActive: false, actorId: "actor-1" }
      const currentRole = {
        id,
        name: "Admin",
        description: "Super user",
        isActive: true,
        isDefault: false,
      }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.countRemainingAdminUsers.mockResolvedValue(0)

      // Act & Assert
      await expect(roleService.updateRole(id, updateData)).rejects.toThrow(
        "Cannot deactivate the last active Admin role assignment in the system.",
      )
    })

    it("UTCID04 - should throw CONFLICT error when update name matches another existing role name (Error Case 3)", async () => {
      // Arrange
      const id = "role-1"
      const updateData = { name: "Existing Role Name", actorId: "actor-1" }
      const currentRole = {
        id,
        name: "Old Role",
        description: "Old Desc",
        isActive: true,
        isDefault: false,
      }
      const duplicateRole = { id: "role-2", name: "Existing Role Name" }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.findByName.mockResolvedValue(duplicateRole)

      // Act & Assert
      await expect(roleService.updateRole(id, updateData)).rejects.toThrow(
        "Role with name 'Existing Role Name' already exists.",
      )
    })

    it("UTCID05 - should handle specific repository exception: CANNOT_DEACTIVATE_DEFAULT_ROLE (Error Case 4)", async () => {
      // Arrange
      const id = "role-1"
      const updateData = { isActive: false, actorId: "actor-1" }
      const currentRole = {
        id,
        name: "Some Role",
        description: "Desc",
        isActive: true,
        isDefault: true,
      }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.updateRole.mockRejectedValue(new Error("CANNOT_DEACTIVATE_DEFAULT_ROLE"))

      // Act & Assert
      await expect(roleService.updateRole(id, updateData)).rejects.toThrow(
        "Cannot deactivate the default role. Assign another role as default first.",
      )
    })
  })

  describe("deleteRole", () => {
    it("UTCID01 - should delete role and return true (Happy Path)", async () => {
      // Arrange
      const id = "role-to-delete"
      const actorId = "actor-1"
      const currentRole = { id, name: "Regular Role", description: "Desc" }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.deleteRole.mockResolvedValue(true)

      // Act
      const result = await roleService.deleteRole(id, actorId)

      // Assert
      expect(result).toBe(true)
      expect(mockInvalidateRoleCache).toHaveBeenCalledWith(id)
      expect(mockRepository.deleteRole).toHaveBeenCalledWith(id, actorId)
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId,
        targetRoleId: id,
        action: "ROLE_DELETED",
      })
    })

    it("UTCID02 - should throw FORBIDDEN error when attempting to delete Admin role (Error Case 1)", async () => {
      // Arrange
      const id = "admin-id"
      const actorId = "actor-1"
      const currentRole = { id, name: "Admin", description: "Super user" }

      mockRepository.findById.mockResolvedValue(currentRole)

      // Act & Assert
      await expect(roleService.deleteRole(id, actorId)).rejects.toThrow(
        "Cannot delete the Admin role.",
      )
    })

    it("UTCID03 - should throw CONFLICT error when repository throws ROLE_ASSIGNED_EMPLOYEE (Error Case 2)", async () => {
      // Arrange
      const id = "assigned-role"
      const actorId = "actor-1"
      const currentRole = { id, name: "Assigned Role", description: "Desc" }

      mockRepository.findById.mockResolvedValue(currentRole)
      mockRepository.deleteRole.mockRejectedValue(new Error("ROLE_ASSIGNED_EMPLOYEE"))

      // Act & Assert
      await expect(roleService.deleteRole(id, actorId)).rejects.toThrow(
        "Role is assigned to one or more employees.",
      )
    })
  })

  describe("getRolePermissions", () => {
    it("UTCID01 - should return list of permissions for valid role (Happy Path)", async () => {
      // Arrange
      const roleId = "role-1"
      const mockPermissions = [{ id: "perm-1", code: "READ_USERS", name: "Read Users" }]
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockRepository.findPermissionsByRoleId.mockResolvedValue(mockPermissions)

      // Act
      const result = await roleService.getRolePermissions(roleId)

      // Assert
      expect(result).toEqual(mockPermissions)
      expect(mockRepository.findPermissionsByRoleId).toHaveBeenCalledWith(roleId)
    })

    it("UTCID02 - should throw NOT_FOUND error when role does not exist (Error Case 1)", async () => {
      // Arrange
      const roleId = "non-existent"
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(roleService.getRolePermissions(roleId)).rejects.toThrow("Role not found")
    })

    it("UTCID03 - should throw error when repository findPermissionsByRoleId fails (Error Case 2)", async () => {
      // Arrange
      const roleId = "role-1"
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockRepository.findPermissionsByRoleId.mockRejectedValue(new Error("DB Error"))

      // Act & Assert
      await expect(roleService.getRolePermissions(roleId)).rejects.toThrow("DB Error")
    })
  })

  describe("assignPermission", () => {
    it("UTCID01 - should assign permission and invalidate cache (Happy Path)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "perm-1"
      const actorId = "actor-1"
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockFindFirst.mockResolvedValue({
        id: permissionId,
        code: "REGULAR_PERM",
        deletedAt: null,
        isActive: true,
      })
      mockRepository.assignPermission.mockResolvedValue({ success: true, created: true })

      // Act
      const result = await roleService.assignPermission(roleId, permissionId, actorId)

      // Assert
      expect(result).toEqual({ success: true, created: true })
      expect(mockInvalidateRoleCache).toHaveBeenCalledWith(roleId)
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId,
        targetRoleId: roleId,
        targetPermissionId: permissionId,
        action: "PERMISSION_ASSIGNED",
      })
    })

    it("UTCID02 - should throw NOT_FOUND error when role is not found (Error Case 1)", async () => {
      // Arrange
      const roleId = "non-existent-role"
      const permissionId = "perm-1"
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(roleService.assignPermission(roleId, permissionId, "actor-1")).rejects.toThrow(
        "Role not found",
      )
    })

    it("UTCID03 - should throw NOT_FOUND error when permission is not found or inactive (Error Case 2)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "non-existent-perm"
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockFindFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(roleService.assignPermission(roleId, permissionId, "actor-1")).rejects.toThrow(
        "Permission not found or inactive",
      )
    })

    it("UTCID04 - should throw FORBIDDEN error when non-admin attempts to assign a protected permission (Error Case 3)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "protected-perm-id"
      const actorId = "non-admin-actor"
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockFindFirst.mockResolvedValue({
        id: permissionId,
        code: "PROTECTED_PERM",
        deletedAt: null,
        isActive: true,
      })
      mockGetAuthorizationContext.mockResolvedValue({
        isDynamicAdmin: false,
        roles: new Set(),
        permissions: new Set(),
      })

      // Act & Assert
      await expect(roleService.assignPermission(roleId, permissionId, actorId)).rejects.toThrow(
        "Only administrators can assign protected permissions.",
      )
    })
  })

  describe("revokePermission", () => {
    it("UTCID01 - should revoke permission and log audit on success (Happy Path)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "perm-1"
      const actorId = "actor-1"
      mockFindFirst.mockResolvedValue({ id: permissionId, code: "REGULAR_PERM", deletedAt: null })
      mockRepository.revokePermission.mockResolvedValue(true)

      // Act
      const result = await roleService.revokePermission(roleId, permissionId, actorId)

      // Assert
      expect(result).toBe(true)
      expect(mockInvalidateRoleCache).toHaveBeenCalledWith(roleId)
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId,
        targetRoleId: roleId,
        targetPermissionId: permissionId,
        action: "PERMISSION_REVOKED",
      })
    })

    it("UTCID02 - should throw FORBIDDEN error when non-admin attempts to revoke a protected permission (Error Case 1)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "protected-perm-id"
      const actorId = "non-admin-actor"
      mockFindFirst.mockResolvedValue({ id: permissionId, code: "PROTECTED_PERM", deletedAt: null })
      mockGetAuthorizationContext.mockResolvedValue({
        isDynamicAdmin: false,
        roles: new Set(),
        permissions: new Set(),
      })

      // Act & Assert
      await expect(roleService.revokePermission(roleId, permissionId, actorId)).rejects.toThrow(
        "Only administrators can revoke protected permissions.",
      )
    })

    it("UTCID03 - should return false if repository revoke fails or returns false (Error Case 2)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionId = "perm-1"
      mockFindFirst.mockResolvedValue({ id: permissionId, code: "REGULAR_PERM", deletedAt: null })
      mockRepository.revokePermission.mockResolvedValue(false)

      // Act
      const result = await roleService.revokePermission(roleId, permissionId, "actor-1")

      // Assert
      expect(result).toBe(false)
      expect(mockInvalidateRoleCache).not.toHaveBeenCalled()
    })
  })

  describe("updatePermissions", () => {
    it("UTCID01 - should replace permissions successfully (Happy Path)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionIds = ["perm-1", "perm-2"]
      const actorId = "actor-1"

      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockRepository.findPermissionsByRoleId.mockResolvedValue([{ id: "perm-3", code: "REG_3" }])
      mockFindMany.mockResolvedValue([
        { id: "perm-1", code: "REG_1" },
        { id: "perm-2", code: "REG_2" },
      ])
      mockRepository.updatePermissions.mockResolvedValue(undefined)

      // Act
      await roleService.updatePermissions(roleId, permissionIds, actorId)

      // Assert
      expect(mockRepository.updatePermissions).toHaveBeenCalledWith(roleId, permissionIds, actorId)
      expect(mockInvalidateRoleCache).toHaveBeenCalledWith(roleId)
      expect(mockAuditLog).toHaveBeenCalledWith({
        actorId,
        targetRoleId: roleId,
        action: "PERMISSION_REPLACED",
        oldValue: { permissionIds: ["perm-3"] },
        newValue: { permissionIds },
      })
    })

    it("UTCID02 - should throw NOT_FOUND error when role is not found (Error Case 1)", async () => {
      // Arrange
      const roleId = "non-existent"
      mockRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(roleService.updatePermissions(roleId, [], "actor-1")).rejects.toThrow(
        "Role not found",
      )
    })

    it("UTCID03 - should throw NOT_FOUND error when one or more permissions are not found or inactive (Error Case 2)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionIds = ["perm-1", "perm-missing"]
      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockRepository.findPermissionsByRoleId.mockResolvedValue([])
      mockFindMany.mockResolvedValue([{ id: "perm-1", code: "REG_1" }])

      // Act & Assert
      await expect(roleService.updatePermissions(roleId, permissionIds, "actor-1")).rejects.toThrow(
        "One or more permissions not found or inactive",
      )
    })

    it("UTCID04 - should throw FORBIDDEN error when non-admin affects protected permissions (Error Case 3)", async () => {
      // Arrange
      const roleId = "role-1"
      const permissionIds = ["protected-perm-id"]
      const actorId = "non-admin-actor"

      mockRepository.findById.mockResolvedValue({ id: roleId, name: "User" })
      mockRepository.findPermissionsByRoleId.mockResolvedValue([])
      mockFindMany.mockResolvedValue([{ id: "protected-perm-id", code: "PROTECTED_PERM" }])
      mockGetAuthorizationContext.mockResolvedValue({
        isDynamicAdmin: false,
        roles: new Set(),
        permissions: new Set(),
      })

      // Act & Assert
      await expect(roleService.updatePermissions(roleId, permissionIds, actorId)).rejects.toThrow(
        "Only administrators can assign protected permissions.",
      )
    })
  })
})
