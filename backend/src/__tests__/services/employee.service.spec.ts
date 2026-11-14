/// <reference types="jest" />
import { prisma } from "@/libs/database.ts"
import { IEmployeeRepository } from "@/types"
import { EmailUtil } from "@/utils/email.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { auditService } from "../../services/audit.service"
import { authorizationService } from "../../services/authorization.service"
import { EmployeeService } from "../../services/employee.service"

const prismaMock = prisma as any

jest.mock("@/configs/entities/employee.config.ts", () => ({
  EMPLOYEE_STATUS: { ACTIVE: "active", INACTIVE: "inactive", TERMINATED: "terminated" },
  SYSTEM_ROLE: { EMPLOYEE: "employee" },
  EMPLOYEE_TYPE: {
    FULL_TIME: "full_time",
    PART_TIME: "part_time",
    CONTRACTOR: "contractor",
    INTERN: "intern",
  },
  WORK_SCHEDULE_TYPE: {
    FULL_TIME: "full_time",
    PART_TIME: "part_time",
  },
}))

jest.mock("@/configs/auth/auth.config.ts", () => ({
  ACTIVITY_ACTION: {},
  ACTIVITY_CATEGORY: {},
}))

jest.mock("@/configs/rules/approval.config.ts", () => ({
  APPROVAL_CATEGORY: { APPLICATION: "APPLICATION" },
  APPROVAL_CONFIG: { APPLICATION: { roles: ["MANAGER", "DIRECTOR"] } },
}))

jest.mock("@/configs/system/db.config.ts", () => ({
  DB_ERROR_CODES: { UNIQUE_CONSTRAINT: ["P2002"] },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: { SERVICE: "SERVICE" },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/libs/database.ts", () => {
  const localTx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    employee: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    employeeRole: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  }
  return {
    prisma: {
      appRole: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      employee: {
        findMany: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      employeeRole: {
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(localTx)),
      $executeRaw: jest.fn().mockResolvedValue(1),
      _mockTx: localTx,
    },
  }
})

jest.mock("../../services/authorization.service", () => ({
  authorizationService: {
    invalidateUserCache: jest.fn().mockResolvedValue(null),
  },
}))

jest.mock("../../services/audit.service", () => ({
  auditService: {
    log: jest.fn().mockResolvedValue(null),
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    errorLayer: string
    constructor(message: string, statusCode: number, errorLayer: string) {
      super(message)
      this.statusCode = statusCode
      this.errorLayer = errorLayer
    }
  },
}))

jest.mock("@/utils/hash.util.ts", () => ({
  HashUtil: {
    hash: jest.fn().mockResolvedValue("mocked-hash"),
  },
}))

jest.mock("@/utils/email.util.ts", () => ({
  EmailUtil: {
    sendNewEmployeeCredentialsEmail: jest.fn().mockResolvedValue({ id: "mocked-email-id" }),
  },
}))

describe("EmployeeService", () => {
  let service: EmployeeService
  let mockRepo: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo = {
      listEmployeesPaginated: jest.fn(),
      findById: jest.fn(),
      createEmployee: jest.fn(),
      updateEmployee: jest.fn(),
      countActiveAdmins: jest.fn(),
      findRolesByEmployeeId: jest.fn(),
      assignRole: jest.fn(),
      updateRoles: jest.fn(),
    }
    service = new EmployeeService(mockRepo as unknown as IEmployeeRepository)
  })

  describe("listEmployees", () => {
    it("UTCID01 - returns paginated employees list", async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10 }
      mockRepo.listEmployeesPaginated.mockResolvedValue(mockResult)

      const res = await service.listEmployees({ page: 1, limit: 10 })

      expect(res).toEqual(mockResult)
      expect(mockRepo.listEmployeesPaginated).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it("UTCID02 - propagates internal service errors", async () => {
      mockRepo.listEmployeesPaginated.mockRejectedValue(new Error("Db Failure"))

      await expect(service.listEmployees({})).rejects.toThrow("Db Failure")
    })

    it("UTCID03 - handles query with invalid filtering types", async () => {
      mockRepo.listEmployeesPaginated.mockRejectedValue(new Error("Invalid Query"))

      await expect(service.listEmployees({ status: "INVALID" as any })).rejects.toThrow(
        "Invalid Query",
      )
    })
  })

  describe("getEmployee", () => {
    it("UTCID01 - returns employee if exists", async () => {
      const mockEmp = { id: "emp-1", email: "a@a.com", deletedAt: null }
      mockRepo.findById.mockResolvedValue(mockEmp)

      const res = await service.getEmployee("emp-1")

      expect(res).toEqual(mockEmp)
      expect(mockRepo.findById).toHaveBeenCalledWith("emp-1")
    })

    it("UTCID02 - throws NOT_FOUND when employee does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.getEmployee("emp-0")).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - throws database execution error", async () => {
      mockRepo.findById.mockRejectedValue(new Error("Query Error"))

      await expect(service.getEmployee("emp-x")).rejects.toThrow("Query Error")
    })
  })

  describe("createEmployee", () => {
    it("UTCID01 - creates employee with hashed password", async () => {
      prismaMock.appRole.findFirst.mockResolvedValue({ id: "role-1" })
      mockRepo.createEmployee.mockResolvedValue({
        id: "emp-1",
        email: "e@e.com",
        username: "e_user",
        deletedAt: null,
      })

      const res = await service.createEmployee({
        email: "e@e.com",
        username: "e_user",
        fullName: "E User",
        password: "plain-password",
        role: "admin",
      })

      expect(res).toEqual({ id: "emp-1", email: "e@e.com", username: "e_user", deletedAt: null })
      expect(HashUtil.hash).toHaveBeenCalledWith("plain-password")
      expect(mockRepo.createEmployee).toHaveBeenCalledWith({
        email: "e@e.com",
        username: "e_user",
        fullName: "E User",
        passwordHash: "mocked-hash",
        roleId: "role-1",
      })
      expect(EmailUtil.sendNewEmployeeCredentialsEmail).toHaveBeenCalledWith(
        "e@e.com",
        "e_user",
        "plain-password",
      )
    })

    it("UTCID02 - throws BAD_REQUEST when password is empty", async () => {
      await expect(
        service.createEmployee({ email: "e@e.com", username: "e_user", fullName: "E User" }),
      ).rejects.toThrow("Password is required to create employee")
    })

    it("UTCID03 - throws NOT_FOUND when role is inactive or missing", async () => {
      prismaMock.appRole.findFirst.mockResolvedValue(null)

      await expect(
        service.createEmployee({
          email: "e@e.com",
          username: "e_user",
          fullName: "E User",
          password: "pwd",
          role: "INVALID" as any,
        }),
      ).rejects.toThrow("Role not found or inactive")
    })

    it("UTCID04 - throws CONFLICT on DB unique key violation", async () => {
      prismaMock.appRole.findFirst.mockResolvedValue({ id: "role-1" })
      const error = new Error("Unique constraint failed") as any
      error.code = "P2002"
      mockRepo.createEmployee.mockRejectedValue(error)

      await expect(
        service.createEmployee({
          email: "dup@e.com",
          username: "dup_user",
          fullName: "Dup User",
          password: "pwd",
        }),
      ).rejects.toThrow("Username, email, phone, or national ID already exists")
    })
  })

  describe("updateEmployee", () => {
    it("UTCID01 - updates basic details and invalidates cache", async () => {
      const currentEmp = { id: "emp-1", status: "active", deletedAt: null }
      mockRepo.findById.mockResolvedValue(currentEmp)
      mockRepo.updateEmployee.mockResolvedValue({ ...currentEmp, fullName: "New Name" })

      const res = await service.updateEmployee("emp-1", { fullName: "New Name" })

      expect(res).toEqual({ id: "emp-1", status: "active", fullName: "New Name", deletedAt: null })
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
    })

    it("UTCID02 - returns null/throws error if target employee does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.updateEmployee("emp-0", { fullName: "N" })).rejects.toThrow(
        "Employee not found",
      )
    })

    it("UTCID03 - updates password by hashing if provided", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      mockRepo.updateEmployee.mockResolvedValue({ id: "emp-1", deletedAt: null })

      await service.updateEmployee("emp-1", { password: "new-password" })

      expect(HashUtil.hash).toHaveBeenCalledWith("new-password")
      expect(mockRepo.updateEmployee).toHaveBeenCalledWith("emp-1", {
        passwordHash: "mocked-hash",
      })
    })

    it("UTCID04 - propagates repository database failures during update", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      mockRepo.updateEmployee.mockRejectedValue(new Error("Update failed"))

      await expect(service.updateEmployee("emp-1", { fullName: "New Name" })).rejects.toThrow(
        "Update failed",
      )
    })
  })

  describe("updateStatus", () => {
    it("UTCID01 - updates status and logs audit if status changed to inactive", async () => {
      const currentEmp = { id: "emp-1", status: "active", deletedAt: null }
      mockRepo.findById.mockResolvedValue(currentEmp)
      prismaMock._mockTx.employee.update.mockResolvedValue({
        id: "emp-1",
        status: "inactive",
        deletedAt: null,
      })
      mockRepo.countActiveAdmins.mockResolvedValue(2)

      const res = await service.updateStatus("emp-1", "inactive", "actor-1", "127.0.0.1")

      expect(res).toEqual(currentEmp)
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetEmployeeId: "emp-1",
        action: "EMPLOYEE_DEACTIVATED",
        oldValue: { status: "active" },
        newValue: { status: "inactive" },
      })
    })

    it("UTCID02 - throws NOT_FOUND if employee to update is missing", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.updateStatus("emp-0", "inactive")).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - throws CONFLICT if status change leaves 0 admins", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", status: "active", deletedAt: null })
      prismaMock._mockTx.employee.update.mockResolvedValue({
        id: "emp-1",
        status: "inactive",
        deletedAt: null,
      })
      mockRepo.countActiveAdmins.mockResolvedValue(0)

      await expect(service.updateStatus("emp-1", "inactive")).rejects.toThrow(
        "CANNOT_REMOVE_LAST_ADMIN",
      )
    })
  })

  describe("deleteEmployee", () => {
    it("UTCID01 - soft deletes employee and updates status to terminated", async () => {
      mockRepo.findById.mockResolvedValue({
        id: "emp-1",
        status: "active",
        email: "e@e.com",
        deletedAt: null,
      })
      prismaMock._mockTx.employee.findFirst.mockResolvedValue({
        id: "emp-1",
        email: "e@e.com",
        deletedAt: null,
      })
      prismaMock._mockTx.employee.update.mockResolvedValue({ id: "emp-1", status: "terminated" })
      mockRepo.countActiveAdmins.mockResolvedValue(1)

      const success = await service.deleteEmployee("emp-1", "actor-1")

      expect(success).toBe(true)
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetEmployeeId: "emp-1",
        action: "EMPLOYEE_DELETED",
      })
    })

    it("UTCID02 - returns false if employee records missing during transaction", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", status: "active", deletedAt: null })
      prismaMock._mockTx.employee.findFirst.mockResolvedValue(null)

      const success = await service.deleteEmployee("emp-1")

      expect(success).toBe(false)
    })

    it("UTCID03 - throws CONFLICT when deleting last admin", async () => {
      mockRepo.findById.mockResolvedValue({
        id: "emp-1",
        status: "active",
        email: "e@e.com",
        deletedAt: null,
      })
      prismaMock._mockTx.employee.findFirst.mockResolvedValue({
        id: "emp-1",
        email: "e@e.com",
        deletedAt: null,
      })
      mockRepo.countActiveAdmins.mockResolvedValue(0)

      await expect(service.deleteEmployee("emp-1")).rejects.toThrow("CANNOT_REMOVE_LAST_ADMIN")
    })
  })

  describe("getEmployeeRoles", () => {
    it("UTCID01 - returns mapped array of application roles", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      mockRepo.findRolesByEmployeeId.mockResolvedValue([{ id: "role-1", name: "admin" }])

      const roles = await service.getEmployeeRoles("emp-1")

      expect(roles).toEqual([{ id: "role-1", name: "admin" }])
    })

    it("UTCID02 - throws NOT_FOUND when target employee does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.getEmployeeRoles("emp-0")).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - fails on repository error propagation", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      mockRepo.findRolesByEmployeeId.mockRejectedValue(new Error("DB read error"))

      await expect(service.getEmployeeRoles("emp-1")).rejects.toThrow("DB read error")
    })
  })

  describe("assignRole", () => {
    it("UTCID01 - assigns role, invalidates user cache and logs audit activity", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      prismaMock.appRole.findFirst.mockResolvedValue({
        id: "role-1",
        isActive: true,
        deletedAt: null,
      })
      mockRepo.assignRole.mockResolvedValue({ success: true, created: true })

      const res = await service.assignRole("emp-1", "role-1", "actor-1")

      expect(res).toEqual({ success: true, created: true })
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetEmployeeId: "emp-1",
        targetRoleId: "role-1",
        action: "ROLE_ASSIGNED",
        newValue: { roleId: "role-1" },
      })
    })

    it("UTCID02 - throws NOT_FOUND if employee is missing", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.assignRole("emp-0", "role-1")).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - throws NOT_FOUND if role is inactive or missing", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      prismaMock.appRole.findFirst.mockResolvedValue(null)

      await expect(service.assignRole("emp-1", "role-invalid")).rejects.toThrow(
        "Role not found or inactive",
      )
    })
  })

  describe("revokeRole", () => {
    it("UTCID01 - revokes role, decreases count, invalidates cache and logs activity", async () => {
      prismaMock._mockTx.employeeRole.findMany.mockResolvedValue([
        { employeeId: "emp-1", roleId: "role-1" },
      ])
      mockRepo.countActiveAdmins.mockResolvedValue(1)

      const res = await service.revokeRole("emp-1", "role-1", "actor-1")

      expect(res).toBe(true)
      expect(prismaMock._mockTx.employeeRole.delete).toHaveBeenCalledWith({
        where: { employeeId_roleId: { employeeId: "emp-1", roleId: "role-1" } },
      })
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetEmployeeId: "emp-1",
        targetRoleId: "role-1",
        action: "ROLE_REVOKED",
        oldValue: { roleId: "role-1" },
      })
    })

    it("UTCID02 - returns false if role not currently assigned to employee", async () => {
      prismaMock._mockTx.employeeRole.findMany.mockResolvedValue([])

      const res = await service.revokeRole("emp-1", "role-1")

      expect(res).toBe(false)
    })

    it("UTCID03 - throws CONFLICT if revoking role deletes last active admin", async () => {
      prismaMock._mockTx.employeeRole.findMany.mockResolvedValue([
        { employeeId: "emp-1", roleId: "role-1" },
      ])
      mockRepo.countActiveAdmins.mockResolvedValue(0)

      await expect(service.revokeRole("emp-1", "role-1")).rejects.toThrow(
        "CANNOT_REMOVE_LAST_ADMIN",
      )
    })
  })

  describe("updateRoles", () => {
    it("UTCID01 - replaces role sets, invalidates cache and logs audit log", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      prismaMock.appRole.findMany.mockResolvedValue([{ id: "role-1" }, { id: "role-2" }])
      mockRepo.findRolesByEmployeeId.mockResolvedValue([{ id: "role-3" }])

      await service.updateRoles("emp-1", ["role-1", "role-2"], 1, "actor-1")

      expect(mockRepo.updateRoles).toHaveBeenCalledWith("emp-1", ["role-1", "role-2"], 1, "actor-1")
      expect(authorizationService.invalidateUserCache).toHaveBeenCalledWith("emp-1")
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: "actor-1",
        targetEmployeeId: "emp-1",
        action: "ROLE_REPLACED",
        oldValue: { roleIds: ["role-3"] },
        newValue: { roleIds: ["role-1", "role-2"] },
      })
    })

    it("UTCID02 - throws NOT_FOUND if employee is not found", async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.updateRoles("emp-0", [], 1)).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - throws NOT_FOUND when matching db roles count mismatch requested", async () => {
      mockRepo.findById.mockResolvedValue({ id: "emp-1", deletedAt: null })
      prismaMock.appRole.findMany.mockResolvedValue([{ id: "role-1" }])

      await expect(service.updateRoles("emp-1", ["role-1", "role-2"], 1)).rejects.toThrow(
        "One or more roles not found or inactive",
      )
    })
  })

  describe("listApprovers", () => {
    it("UTCID01 - lists and maps active approver employees by configured role names", async () => {
      const mockDbApprovers = [
        {
          id: "emp-1",
          fullName: "Manager Bob",
          position: "Lead",
          employeeRoles: [{ role: { name: "MANAGER" } }],
        },
      ]
      prismaMock.employee.findMany.mockResolvedValue(mockDbApprovers)

      const res = await service.listApprovers()

      expect(res).toEqual([
        {
          id: "emp-1",
          fullName: "Manager Bob",
          position: "Lead",
          role: "MANAGER",
        },
      ])
    })

    it("UTCID02 - returns empty list if no query matches approval config rules", async () => {
      prismaMock.employee.findMany.mockResolvedValue([])

      const res = await service.listApprovers()

      expect(res).toEqual([])
    })

    it("UTCID03 - filters out records with undefined primary config roles", async () => {
      const mockDbApprovers = [
        {
          id: "emp-2",
          fullName: "No Approval Role User",
          position: null,
          employeeRoles: [],
        },
      ]
      prismaMock.employee.findMany.mockResolvedValue(mockDbApprovers)

      const res = await service.listApprovers()

      expect(res).toEqual([])
    })

    it("UTCID04 - throws exception if database find operation fails", async () => {
      prismaMock.employee.findMany.mockRejectedValue(new Error("DB failure"))

      await expect(service.listApprovers()).rejects.toThrow("DB failure")
    })

    it("UTCID05 - propagates database connection errors during querying", async () => {
      prismaMock.employee.findMany.mockRejectedValue(new Error("Connection lost"))

      await expect(service.listApprovers()).rejects.toThrow("Connection lost")
    })
  })
})
