/// <reference types="jest" />
import { prisma } from "@/libs/database.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import type { IApplicationRepository } from "@/types/attendance.types.ts"
import type { IPositionService } from "@/types/position.types.ts"

import { ApplicationService } from "../../services/application.service"

// Mock all external modules
jest.mock("@/configs/entities/attendance.config.ts", () => ({
  APPLICATION_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    PARTNER_PENDING: "partner_pending",
  },
  APPLICATION_TYPES: {
    LEAVE: { LABEL: "leave" },
    OVERTIME: { LABEL: "overtime" },
    LATE_EARLY: { LABEL: "late_early" },
    SHIFT_SWAP: { LABEL: "shift_swap" },
    RESIGNATION: { LABEL: "resignation" },
  },
  LEAVE_BALANCE_DEFAULTS: {},
  PAID_LEAVE_TYPES: {},
}))

jest.mock("@/configs/entities/employee.config.ts", () => ({
  EMPLOYEE_STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
  },
}))

jest.mock("@/configs/entities/permission.config.ts", () => ({
  PERMISSION_CODE: {
    APPLICATION_READ: "application.read",
    APPLICATION_APPROVE: "application.approve",
  },
}))

jest.mock("@/configs/entities/project.config.ts", () => ({
  PROJECT_STATUS: {
    ACTIVE: "ACTIVE",
  },
}))

jest.mock("@/configs/messages/application.message.ts", () => ({
  APPLICATION_ERROR_MESSAGES: {
    INVALID_DATE_RANGE: "Invalid date range",
    NOT_FOUND: "Application not found",
    CANCEL_FORBIDDEN: "Cancel forbidden",
    CANCEL_INVALID_STATUS: (status: string) => `Cannot cancel application with status ${status}`,
    CANCEL_FAILED: "Cancel failed",
    VIEW_FORBIDDEN: "View forbidden",
    VIEW_PROJECT_FORBIDDEN: "View project forbidden",
    EMPLOYEE_NOT_FOUND: (id: string) => `Employee not found: ${id}`,
    EMPLOYEE_INACTIVE: (id: string) => `Employee inactive: ${id}`,
    CANNOT_APPROVE_STATUS: (status: string) => `Cannot approve status ${status}`,
    APPROVE_FAILED: "Approve failed",
    CANNOT_REJECT_STATUS: (status: string) => `Cannot reject status ${status}`,
    REJECT_FAILED: "Reject failed",
    REJECT_REASON_REQUIRED: "Reject reason required",
    INVALID_STATUS_TRANSITION: (status: string) => `Invalid status transition: ${status}`,
    LEAVE_OVERLAP: "Leave overlap",
    SHIFT_NOT_FOUND: (id: string) => `Shift not found: ${id}`,
    SHIFT_NOT_OWNED: "Shift not owned",
    SWAP_TARGET_SHIFT_NOT_FOUND: "Swap target shift not found",
    APPROVER_NOT_FOUND: (id: string) => `Approver not found: ${id}`,
    PROCESSOR_NOT_ELIGIBLE: "Processor not eligible",
    SWAP_PARTNER_FORBIDDEN: "Swap partner forbidden",
    SWAP_CONFIRM_FAILED: "Swap confirm failed",
    SWAP_REJECT_FAILED: "Swap reject failed",
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/libs/database.ts", () => ({
  prisma: {
    project: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    employeeShift: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/services/authorization.service.ts", () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn(),
  },
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      statusCode: number
      layer: string
      errorCode?: string
      constructor(message: string, statusCode: number, layer: string, errorCode?: string) {
        super(message)
        this.statusCode = statusCode
        this.layer = layer
        this.errorCode = errorCode
      }
    },
  }
})

jest.mock("@/utils/schedule.util.ts", () => ({
  formatScheduleDateKey: jest.fn((date: Date) => date.toISOString().split("T")[0]),
}))

describe("ApplicationService", () => {
  type MockedApplicationRepository = Record<keyof IApplicationRepository, jest.Mock>
  type MockedPositionService = Record<keyof IPositionService, jest.Mock>

  let mockRepo: MockedApplicationRepository
  let mockPositionService: MockedPositionService
  let service: ApplicationService

  beforeEach(() => {
    mockRepo = {
      submit: jest.fn(),
      submitBulk: jest.fn(),
      findById: jest.fn(),
      cancel: jest.fn(),
      findAll: jest.fn(),
      findByEmployee: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      checkLeaveOverlap: jest.fn(),
      findApprovals: jest.fn(),
      partnerConfirm: jest.fn(),
      partnerReject: jest.fn(),
      findLeaveOverlappingEmployees: jest.fn(),
      getUsedLeaveDays: jest.fn(),
    }

    mockPositionService = {
      validateApplicationSubmission: jest.fn(),
    } as unknown as MockedPositionService

    service = new ApplicationService(
      mockRepo as unknown as IApplicationRepository,
      mockPositionService as unknown as IPositionService,
    )
    jest.clearAllMocks()
  })

  describe("submitApplication", () => {
    it("UTCID01 - should successfully submit resignation application without extra checks", async () => {
      // Arrange
      const data = {
        employeeId: "emp-123",
        type: "resignation",
        startDate: "2023-10-01",
        endDate: "2023-10-05",
        detail: {},
        assignedToId: "approver-1",
      }
      const prismaEmployeeFindUniqueMock = prisma.employee.findUnique as jest.Mock
      prismaEmployeeFindUniqueMock.mockResolvedValue({ id: "approver-1", status: "ACTIVE" })

      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({ isDynamicAdmin: true })

      mockRepo.submit.mockResolvedValue({ id: "app-1", status: "pending" })

      // Act
      const result = await service.submitApplication(
        data as unknown as Parameters<typeof service.submitApplication>[0],
      )

      // Assert
      expect(result).toEqual({ id: "app-1", status: "pending" })
      expect(mockRepo.submit).toHaveBeenCalledWith(data)
    })

    it("UTCID02 - should throw BAD_REQUEST if endDate is less than startDate", async () => {
      // Arrange
      const data = {
        employeeId: "emp-123",
        type: "resignation",
        startDate: "2023-10-05",
        endDate: "2023-10-01",
        detail: {},
      }

      // Act & Assert
      await expect(
        service.submitApplication(
          data as unknown as Parameters<typeof service.submitApplication>[0],
        ),
      ).rejects.toThrow("Invalid date range")
    })

    it("UTCID03 - should throw NOT_FOUND if assigned approver does not exist", async () => {
      // Arrange
      const data = {
        employeeId: "emp-123",
        type: "resignation",
        startDate: "2023-10-01",
        endDate: "2023-10-05",
        detail: {},
        assignedToId: "non-existent-approver",
      }
      const prismaEmployeeFindUniqueMock = prisma.employee.findUnique as jest.Mock
      prismaEmployeeFindUniqueMock.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.submitApplication(
          data as unknown as Parameters<typeof service.submitApplication>[0],
        ),
      ).rejects.toThrow("Approver not found: non-existent-approver")
    })

    it("UTCID04 - should throw FORBIDDEN if overtime application is submitted for a shift the employee does not own", async () => {
      // Arrange
      const data = {
        employeeId: "emp-123",
        type: "overtime",
        startDate: "2023-10-01",
        endDate: "2023-10-01",
        detail: { employeeShiftId: "shift-999" },
      }
      const prismaShiftFindUniqueMock = prisma.employeeShift.findUnique as jest.Mock
      prismaShiftFindUniqueMock.mockResolvedValue({ employeeId: "emp-different" })

      // Act & Assert
      await expect(
        service.submitApplication(
          data as unknown as Parameters<typeof service.submitApplication>[0],
        ),
      ).rejects.toThrow("Shift not owned")
    })
  })

  describe("submitBulkApplications", () => {
    it("UTCID01 - should submit multiple applications successfully", async () => {
      // Arrange
      const data = [
        { employeeId: "emp-123", type: "resignation", startDate: "2023-10-01", detail: {} },
        { employeeId: "emp-123", type: "resignation", startDate: "2023-10-02", detail: {} },
      ]
      mockRepo.submitBulk.mockResolvedValue([{ id: "1" }, { id: "2" }])

      // Act
      const result = await service.submitBulkApplications(
        data as unknown as Parameters<typeof service.submitBulkApplications>[0],
      )

      // Assert
      expect(result).toHaveLength(2)
      expect(mockRepo.submitBulk).toHaveBeenCalledWith(data)
    })

    it("UTCID02 - should throw error if any submission fails date range validation", async () => {
      // Arrange
      const data = [
        { employeeId: "emp-123", type: "resignation", startDate: "2023-10-01", detail: {} },
        {
          employeeId: "emp-123",
          type: "resignation",
          startDate: "2023-10-02",
          endDate: "2023-10-01",
          detail: {},
        },
      ]

      // Act & Assert
      await expect(
        service.submitBulkApplications(
          data as unknown as Parameters<typeof service.submitBulkApplications>[0],
        ),
      ).rejects.toThrow("Invalid date range")
    })

    it("UTCID03 - should throw error if position service validation fails", async () => {
      // Arrange
      const data = [
        { employeeId: "emp-123", type: "resignation", startDate: "2023-10-01", detail: {} },
      ]
      mockPositionService.validateApplicationSubmission.mockRejectedValue(
        new Error("Position constraint failed"),
      )

      // Act & Assert
      await expect(
        service.submitBulkApplications(
          data as unknown as Parameters<typeof service.submitBulkApplications>[0],
        ),
      ).rejects.toThrow("Position constraint failed")
    })
  })

  describe("cancelApplication", () => {
    it("UTCID01 - should cancel application successfully if requester is the owner and status is pending", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", employeeId: "emp-123", status: "pending" })
      mockRepo.cancel.mockResolvedValue({ id: "app-1", status: "cancelled" })

      // Act
      const result = await service.cancelApplication("app-1", "emp-123")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "cancelled" })
      expect(mockRepo.cancel).toHaveBeenCalledWith("app-1", "emp-123")
    })

    it("UTCID02 - should throw NOT_FOUND error if application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.cancelApplication("app-invalid", "emp-123")).rejects.toThrow(
        "Application not found",
      )
    })

    it("UTCID03 - should throw FORBIDDEN error if requester is not the owner", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        employeeId: "emp-owner",
        status: "pending",
      })

      // Act & Assert
      await expect(service.cancelApplication("app-1", "emp-attacker")).rejects.toThrow(
        "Cancel forbidden",
      )
    })

    it("UTCID04 - should throw BAD_REQUEST if status is not pending", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        employeeId: "emp-123",
        status: "approved",
      })

      // Act & Assert
      await expect(service.cancelApplication("app-1", "emp-123")).rejects.toThrow(
        "Cannot cancel application with status approved",
      )
    })

    it("UTCID05 - should throw INTERNAL_SERVER_ERROR if repository returns null for cancelled application", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", employeeId: "emp-123", status: "pending" })
      mockRepo.cancel.mockResolvedValue(null)

      // Act & Assert
      await expect(service.cancelApplication("app-1", "emp-123")).rejects.toThrow("Cancel failed")
    })
  })

  describe("getApplicationById", () => {
    it("UTCID01 - should return application details if requester is owner", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", employeeId: "emp-123" })

      // Act
      const result = await service.getApplicationById("app-1", { empId: "emp-123" })

      // Assert
      expect(result).toEqual({ id: "app-1", employeeId: "emp-123" })
    })

    it("UTCID02 - should throw NOT_FOUND if application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getApplicationById("app-invalid")).rejects.toThrow(
        "Application not found",
      )
    })

    it("UTCID03 - should throw FORBIDDEN if non-owner requester is not a global approver and has no project overlap", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", employeeId: "emp-owner" })
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: false,
        permissions: new Set(),
      })

      // Act & Assert
      await expect(service.getApplicationById("app-1", { empId: "emp-other" })).rejects.toThrow(
        "View forbidden",
      )
    })

    it("UTCID04 - should throw FORBIDDEN if requester has approve permission but no active project with employee", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", employeeId: "emp-owner" })
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: false,
        permissions: new Set(["application.approve"]),
      })
      const prismaProjectFindFirstMock = prisma.project.findFirst as jest.Mock
      prismaProjectFindFirstMock.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getApplicationById("app-1", { empId: "emp-other" })).rejects.toThrow(
        "View project forbidden",
      )
    })
  })

  describe("listApplications", () => {
    it("UTCID01 - should fetch list of applications successfully", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const expected = { data: [{ id: "app-1" }], total: 1 }
      mockRepo.findAll.mockResolvedValue(expected)

      // Act
      const result = await service.listApplications(
        query as unknown as Parameters<typeof service.listApplications>[0],
      )

      // Assert
      expect(result).toEqual(expected)
      expect(mockRepo.findAll).toHaveBeenCalledWith(query)
    })

    it("UTCID02 - should throw error if repository throws error", async () => {
      // Arrange
      mockRepo.findAll.mockRejectedValue(new Error("DB Error"))

      // Act & Assert
      await expect(service.listApplications({})).rejects.toThrow("DB Error")
    })

    it("UTCID03 - should call repository and throw error when parameter format is invalid", async () => {
      // Arrange
      mockRepo.findAll.mockRejectedValue(new Error("Invalid arguments"))

      // Act & Assert
      await expect(
        service.listApplications(null as unknown as Parameters<typeof service.listApplications>[0]),
      ).rejects.toThrow("Invalid arguments")
    })
  })

  describe("getEmployeeApplications", () => {
    it("UTCID01 - should get employee applications successfully when requester is owner", async () => {
      // Arrange
      const prismaEmployeeFindFirstMock = prisma.employee.findFirst as jest.Mock
      prismaEmployeeFindFirstMock.mockResolvedValue({ id: "emp-123" })
      mockRepo.findByEmployee.mockResolvedValue({ data: [], total: 0 })

      // Act
      const result = await service.getEmployeeApplications(
        "emp-123",
        {} as unknown as Parameters<typeof service.getEmployeeApplications>[1],
        { empId: "emp-123" },
      )

      // Assert
      expect(result).toEqual({ data: [], total: 0 })
      expect(mockRepo.findByEmployee).toHaveBeenCalledWith("emp-123", {})
    })

    it("UTCID02 - should throw NOT_FOUND if employee does not exist or is soft-deleted", async () => {
      // Arrange
      const prismaEmployeeFindFirstMock = prisma.employee.findFirst as jest.Mock
      prismaEmployeeFindFirstMock.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.getEmployeeApplications(
          "emp-deleted",
          {} as unknown as Parameters<typeof service.getEmployeeApplications>[1],
        ),
      ).rejects.toThrow("Employee not found: emp-deleted")
    })

    it("UTCID03 - should throw FORBIDDEN if requester has only approve permission but no active project with target employee", async () => {
      // Arrange
      const prismaEmployeeFindFirstMock = prisma.employee.findFirst as jest.Mock
      prismaEmployeeFindFirstMock.mockResolvedValue({ id: "emp-target" })
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: false,
        permissions: new Set(["application.approve"]),
      })
      const prismaProjectFindFirstMock = prisma.project.findFirst as jest.Mock
      prismaProjectFindFirstMock.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.getEmployeeApplications(
          "emp-target",
          {} as unknown as Parameters<typeof service.getEmployeeApplications>[1],
          { empId: "emp-tl" },
        ),
      ).rejects.toThrow("View project forbidden")
    })
  })

  describe("approveApplication", () => {
    it("UTCID01 - should approve pending application successfully", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "pending" })
      mockRepo.approve.mockResolvedValue({ id: "app-1", status: "approved" })

      // Act
      const result = await service.approveApplication("app-1", "processor-1")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "approved" })
      expect(mockRepo.approve).toHaveBeenCalledWith("app-1", "processor-1")
    })

    it("UTCID02 - should throw NOT_FOUND if application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.approveApplication("app-invalid", "processor-1")).rejects.toThrow(
        "Application not found",
      )
    })

    it("UTCID03 - should throw BAD_REQUEST if application is not pending status", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "rejected" })

      // Act & Assert
      await expect(service.approveApplication("app-1", "processor-1")).rejects.toThrow(
        "Cannot approve status rejected",
      )
    })

    it("UTCID04 - should throw INTERNAL_SERVER_ERROR if approve DB operation fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "pending" })
      mockRepo.approve.mockResolvedValue(null)

      // Act & Assert
      await expect(service.approveApplication("app-1", "processor-1")).rejects.toThrow(
        "Approve failed",
      )
    })
  })

  describe("rejectApplication", () => {
    it("UTCID01 - should reject pending application successfully with a reason", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "pending" })
      mockRepo.reject.mockResolvedValue({ id: "app-1", status: "rejected" })

      // Act
      const result = await service.rejectApplication("app-1", "processor-1", "No budget")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "rejected" })
      expect(mockRepo.reject).toHaveBeenCalledWith("app-1", "processor-1", "No budget")
    })

    it("UTCID02 - should throw NOT_FOUND if application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.rejectApplication("app-invalid", "processor-1", "Reason"),
      ).rejects.toThrow("Application not found")
    })

    it("UTCID03 - should throw BAD_REQUEST if application is not pending status", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "approved" })

      // Act & Assert
      await expect(service.rejectApplication("app-1", "processor-1", "Reason")).rejects.toThrow(
        "Cannot reject status approved",
      )
    })

    it("UTCID04 - should throw INTERNAL_SERVER_ERROR if reject DB operation fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "pending" })
      mockRepo.reject.mockResolvedValue(null)

      // Act & Assert
      await expect(service.rejectApplication("app-1", "processor-1", "Reason")).rejects.toThrow(
        "Reject failed",
      )
    })
  })

  describe("processApplication", () => {
    it("UTCID01 - should process approval successfully when status is approved", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "app-1", status: "pending" })
      mockRepo.approve.mockResolvedValue({ id: "app-1", status: "approved" })

      // Act
      const result = await service.processApplication("app-1", "approved", "processor-1")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "approved" })
    })

    it("UTCID02 - should throw BAD_REQUEST when status is rejected", async () => {
      // Act & Assert
      await expect(service.processApplication("app-1", "rejected", "processor-1")).rejects.toThrow(
        "Reject reason required",
      )
    })

    it("UTCID03 - should throw BAD_REQUEST for invalid status transitions", async () => {
      // Act & Assert
      await expect(
        service.processApplication("app-1", "partner_pending", "processor-1"),
      ).rejects.toThrow("Invalid status transition: partner_pending")
    })
  })

  describe("getApprovalsList", () => {
    it("UTCID01 - should fetch approvals successfully as a global admin", async () => {
      // Arrange
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: true,
        permissions: new Set(),
      })
      mockRepo.findApprovals.mockResolvedValue({ data: [], total: 0 })

      // Act
      const result = await service.getApprovalsList(
        "approver-1",
        {} as unknown as Parameters<typeof service.getApprovalsList>[1],
      )

      // Assert
      expect(result).toEqual({ data: [], total: 0 })
      expect(mockRepo.findApprovals).toHaveBeenCalledWith("approver-1", [], true, {})
    })

    it("UTCID02 - should fetch approvals restricted to team projects as non-global approver", async () => {
      // Arrange
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: false,
        permissions: new Set(["application.approve"]),
      })
      const prismaProjectFindManyMock = prisma.project.findMany as jest.Mock
      prismaProjectFindManyMock.mockResolvedValue([
        { members: [{ employeeId: "emp-1" }, { employeeId: "emp-2" }] },
      ])
      mockRepo.findApprovals.mockResolvedValue({ data: [], total: 0 })

      // Act
      const result = await service.getApprovalsList(
        "approver-1",
        {} as unknown as Parameters<typeof service.getApprovalsList>[1],
      )

      // Assert
      expect(result).toEqual({ data: [], total: 0 })
      expect(mockRepo.findApprovals).toHaveBeenCalledWith(
        "approver-1",
        ["emp-1", "emp-2"],
        false,
        {},
      )
    })

    it("UTCID03 - should propagate authentication context error", async () => {
      // Arrange
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockRejectedValue(new Error("Auth failed"))

      // Act & Assert
      await expect(
        service.getApprovalsList(
          "approver-1",
          {} as unknown as Parameters<typeof service.getApprovalsList>[1],
        ),
      ).rejects.toThrow("Auth failed")
    })

    it("UTCID04 - should propagate database query error", async () => {
      // Arrange
      const getAuthorizationContextMock = authorizationService.getAuthorizationContext as jest.Mock
      getAuthorizationContextMock.mockResolvedValue({
        isDynamicAdmin: false,
        permissions: new Set(["application.approve"]),
      })
      const prismaProjectFindManyMock = prisma.project.findMany as jest.Mock
      prismaProjectFindManyMock.mockRejectedValue(new Error("Database select error"))

      // Act & Assert
      await expect(
        service.getApprovalsList(
          "approver-1",
          {} as unknown as Parameters<typeof service.getApprovalsList>[1],
        ),
      ).rejects.toThrow("Database select error")
    })
  })

  describe("confirmSwapPartner", () => {
    it("UTCID01 - should confirm shift swap partner successfully", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })
      mockRepo.partnerConfirm.mockResolvedValue({ id: "app-1", status: "pending" })

      // Act
      const result = await service.confirmSwapPartner("app-1", "partner-123")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "pending" })
      expect(mockRepo.partnerConfirm).toHaveBeenCalledWith("app-1", "partner-123")
    })

    it("UTCID02 - should throw NOT_FOUND if shift swap application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.confirmSwapPartner("app-invalid", "partner-123")).rejects.toThrow(
        "Application not found",
      )
    })

    it("UTCID03 - should throw BAD_REQUEST if application status is not partner_pending", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })

      // Act & Assert
      await expect(service.confirmSwapPartner("app-1", "partner-123")).rejects.toThrow(
        "Cannot approve status pending",
      )
    })

    it("UTCID04 - should throw FORBIDDEN if partner ID does not match shift swap partner ID", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })

      // Act & Assert
      await expect(service.confirmSwapPartner("app-1", "partner-wrong")).rejects.toThrow(
        "Swap partner forbidden",
      )
    })

    it("UTCID05 - should throw INTERNAL_SERVER_ERROR if partner confirmation DB update fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })
      mockRepo.partnerConfirm.mockResolvedValue(null)

      // Act & Assert
      await expect(service.confirmSwapPartner("app-1", "partner-123")).rejects.toThrow(
        "Swap confirm failed",
      )
    })
  })

  describe("rejectSwapPartner", () => {
    it("UTCID01 - should reject shift swap partner successfully", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })
      mockRepo.partnerReject.mockResolvedValue({ id: "app-1", status: "rejected" })

      // Act
      const result = await service.rejectSwapPartner("app-1", "partner-123", "Busy shift")

      // Assert
      expect(result).toEqual({ id: "app-1", status: "rejected" })
      expect(mockRepo.partnerReject).toHaveBeenCalledWith("app-1", "partner-123", "Busy shift")
    })

    it("UTCID02 - should throw NOT_FOUND if shift swap application does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.rejectSwapPartner("app-invalid", "partner-123", "No")).rejects.toThrow(
        "Application not found",
      )
    })

    it("UTCID03 - should throw BAD_REQUEST if application status is not partner_pending", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "rejected",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })

      // Act & Assert
      await expect(service.rejectSwapPartner("app-1", "partner-123", "No")).rejects.toThrow(
        "Cannot reject status rejected",
      )
    })

    it("UTCID04 - should throw FORBIDDEN if partner ID does not match swap target ID", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })

      // Act & Assert
      await expect(service.rejectSwapPartner("app-1", "partner-wrong", "No")).rejects.toThrow(
        "Swap partner forbidden",
      )
    })

    it("UTCID05 - should throw INTERNAL_SERVER_ERROR if partner rejection DB update fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({
        id: "app-1",
        status: "partner_pending",
        shiftSwapDetail: { swapWithEmployeeId: "partner-123" },
      })
      mockRepo.partnerReject.mockResolvedValue(null)

      // Act & Assert
      await expect(service.rejectSwapPartner("app-1", "partner-123", "No")).rejects.toThrow(
        "Swap reject failed",
      )
    })
  })
})
