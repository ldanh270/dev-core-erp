/// <reference types="jest" />
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { assertCloudinaryConfigured, cloudinary } from "@/configs/system/cloudinary.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { Writable } from "stream"

import { ProfileService } from "../../services/profile.service"

jest.mock("@/configs/system/cloudinary.config.ts", () => ({
  assertCloudinaryConfigured: jest.fn(),
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}))

jest.mock("@/services/authorization.service.ts", () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn(),
  },
}))

jest.mock("@/utils/hash.util.ts", () => ({
  HashUtil: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layerName: string
    code?: string
    constructor(message: string, statusCode: number, layerName: string, code?: string) {
      super(message)
      this.statusCode = statusCode
      this.layerName = layerName
      this.code = code
    }
  },
}))

describe("ProfileService", () => {
  let service: ProfileService
  let mockRepo: any
  let mockEmployee: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      updateAvatar: jest.fn(),
      findAuthById: jest.fn(),
      updatePassword: jest.fn(),
      updatePersonalEmployeeLink: jest.fn(),
    }
    service = new ProfileService(mockRepo)

    mockEmployee = {
      id: "emp-123",
      fullName: "Test User",
      username: "testuser",
      email: "test@example.com",
      phone: null,
      dateOfBirth: new Date("1995-05-15"),
      nationalId: null,
      address: null,
      position: null,
      employeeType: "FULL_TIME",
      status: "ACTIVE",
      startDate: new Date("2021-01-10"),
      avatarUrl: null,
      avatarId: null,
      personalEmployeeId: null,
      personalEmployee: null,
      createdAt: new Date("2021-01-10T08:00:00.000Z"),
      updatedAt: new Date("2021-01-10T08:00:00.000Z"),
    }
  })

  describe("getMyProfile", () => {
    it("UTCID01 - successfully returns mapped profile with active linked personal employee", async () => {
      // Arrange
      const linkedEmployee = {
        id: "emp-456",
        fullName: "Linked User",
        email: "linked@example.com",
        deletedAt: null,
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      mockEmployee.personalEmployeeId = "emp-456"
      mockEmployee.personalEmployee = linkedEmployee

      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["employee", "staff"]),
      })

      // Act
      const result = await service.getMyProfile("emp-123")

      // Assert
      expect(mockRepo.findById).toHaveBeenCalledWith("emp-123")
      expect(authorizationService.getAuthorizationContext).toHaveBeenCalledWith("emp-123")
      expect(result).toEqual({
        id: "emp-123",
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        phone: null,
        dateOfBirth: "1995-05-15",
        nationalId: null,
        address: null,
        position: null,
        positionId: null,
        roles: ["employee", "staff"],
        employeeType: "FULL_TIME",
        workScheduleType: undefined,
        status: "ACTIVE",
        startDate: "2021-01-10",
        avatar: { url: null, id: null },
        personalEmployeeId: "emp-456",
        personalEmployee: {
          id: "emp-456",
          fullName: "Linked User",
          email: "linked@example.com",
        },
        createdAt: "2021-01-10T08:00:00.000Z",
        updatedAt: "2021-01-10T08:00:00.000Z",
      })
    })

    it("UTCID02 - throws 404 AppError when profile not found in repo", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getMyProfile("emp-invalid")).rejects.toThrow(
        expect.objectContaining({
          message: "Profile not found",
          statusCode: 404,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID03 - returns null personalEmployee fields when linked employee is deleted or inactive", async () => {
      // Arrange
      const inactiveLinkedEmployee = {
        id: "emp-456",
        fullName: "Linked User",
        email: "linked@example.com",
        deletedAt: new Date(),
        status: "INACTIVE",
      }
      mockEmployee.personalEmployeeId = "emp-456"
      mockEmployee.personalEmployee = inactiveLinkedEmployee

      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set([]),
      })

      // Act
      const result = await service.getMyProfile("emp-123")

      // Assert
      expect(result.personalEmployeeId).toBeNull()
      expect(result.personalEmployee).toBeNull()
    })
  })

  describe("updateMyProfile", () => {
    const updateDto = {
      fullName: "Updated Name",
      phone: "0909090909",
    }

    it("UTCID01 - successfully updates and returns new profile details", async () => {
      // Arrange
      const updatedEmployee = {
        ...mockEmployee,
        fullName: "Updated Name",
        phone: "0909090909",
      }
      mockRepo.updateProfile.mockResolvedValue(updatedEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["employee"]),
      })

      // Act
      const result = await service.updateMyProfile("emp-123", updateDto)

      // Assert
      expect(mockRepo.updateProfile).toHaveBeenCalledWith("emp-123", updateDto)
      expect(result.fullName).toBe("Updated Name")
      expect(result.phone).toBe("0909090909")
    })

    it("UTCID02 - throws 404 AppError if profile to update does not exist", async () => {
      // Arrange
      mockRepo.updateProfile.mockResolvedValue(null)

      // Act & Assert
      await expect(service.updateMyProfile("emp-invalid", updateDto)).rejects.toThrow(
        expect.objectContaining({
          message: "Profile not found",
          statusCode: 404,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID03 - propagates repository errors normally", async () => {
      // Arrange
      mockRepo.updateProfile.mockRejectedValue(new Error("Database write error"))

      // Act & Assert
      await expect(service.updateMyProfile("emp-123", updateDto)).rejects.toThrow(
        "Database write error",
      )
    })
  })

  describe("uploadAvatar", () => {
    const mockBuffer = Buffer.from("mock-image-data")
    const mimeType = "image/png"

    it("UTCID01 - successfully uploads new avatar, deletes old, and returns updated profile", async () => {
      // Arrange
      mockEmployee.avatarId = "old_avatar_id"
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: "ok" })

      const mockWritable = new Writable({
        write(chunk, encoding, callback) {
          callback()
        },
      })
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
        process.nextTick(() =>
          callback(null, {
            secure_url: "https://cloudinary.com/new.webp",
            public_id: "old_avatar_id",
          }),
        )
        return mockWritable
      })

      const updatedEmployee = {
        ...mockEmployee,
        avatarUrl: "https://cloudinary.com/new.webp",
        avatarid: "old_avatar_id",
      }
      mockRepo.updateAvatar.mockResolvedValue(updatedEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(),
      })

      // Act
      const result = await service.uploadAvatar("emp-123", mockBuffer, mimeType)

      // Assert
      expect(assertCloudinaryConfigured).toHaveBeenCalled()
      expect(mockRepo.findById).toHaveBeenCalledWith("emp-123")
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("old_avatar_id")
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: "devcore/avatars",
          public_id: expect.stringMatching(/^avatar_\d+_emp-123$/),
          overwrite: true,
          format: "webp",
        }),
        expect.any(Function),
      )
      expect(mockRepo.updateAvatar).toHaveBeenCalledWith("emp-123", { url: "https://cloudinary.com/new.webp", id: "old_avatar_id", })
      expect(result.avatar).toEqual({
        url: "https://cloudinary.com/new.webp",
        id: "old_avatar_id",
      })
    })

    it("UTCID02 - throws 400 AppError if Cloudinary is not configured", async () => {
      // Arrange
      ;(assertCloudinaryConfigured as jest.Mock).mockImplementation(() => {
        throw new Error("Cloudinary missing config variables")
      })

      // Act & Assert
      await expect(service.uploadAvatar("emp-123", mockBuffer, mimeType)).rejects.toThrow(
        expect.objectContaining({
          message: "Cloudinary missing config variables",
          statusCode: 400,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID03 - throws 404 AppError if employee profile not found", async () => {
      // Arrange
      ;(assertCloudinaryConfigured as jest.Mock).mockImplementation(() => {})
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.uploadAvatar("emp-invalid", mockBuffer, mimeType)).rejects.toThrow(
        expect.objectContaining({
          message: "Profile not found",
          statusCode: 404,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID04 - throws 500 AppError if repo updateAvatar returns null", async () => {
      // Arrange
      ;(assertCloudinaryConfigured as jest.Mock).mockImplementation(() => {})
      mockEmployee.avatarId = null
      mockRepo.findById.mockResolvedValue(mockEmployee)

      const mockWritable = new Writable({
        write(chunk, encoding, callback) {
          callback()
        },
      })
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
        process.nextTick(() =>
          callback(null, {
            secure_url: "https://cloudinary.com/new.webp",
            public_id: "old_avatar_id",
          }),
        )
        return mockWritable
      })

      mockRepo.updateAvatar.mockResolvedValue(null)

      // Act & Assert
      await expect(service.uploadAvatar("emp-123", mockBuffer, mimeType)).rejects.toThrow(
        expect.objectContaining({
          message: "Failed to save avatar",
          statusCode: 500,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID05 - throws error if Cloudinary upload stream fails", async () => {
      // Arrange
      ;(assertCloudinaryConfigured as jest.Mock).mockImplementation(() => {})
      mockEmployee.avatarId = null
      mockRepo.findById.mockResolvedValue(mockEmployee)

      const mockWritable = new Writable({
        write(chunk, encoding, callback) {
          callback()
        },
      })
      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
        process.nextTick(() => callback(new Error("Connection reset"), null))
        return mockWritable
      })

      // Act & Assert
      await expect(service.uploadAvatar("emp-123", mockBuffer, mimeType)).rejects.toThrow(
        "Connection reset",
      )
    })
  })

  describe("changePassword", () => {
    it("UTCID01 - successfully changes password when current password matches", async () => {
      // Arrange
      const authEmployee = {
        ...mockEmployee,
        passwordHash: "mocked-old-hash",
      }
      mockRepo.findAuthById.mockResolvedValue(authEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(true)
      ;(HashUtil.hash as jest.Mock).mockResolvedValue("mocked-new-hash")
      mockRepo.updatePassword.mockResolvedValue(true)

      // Act
      await service.changePassword("emp-123", "OldPass123!", "NewPass123!")

      // Assert
      expect(mockRepo.findAuthById).toHaveBeenCalledWith("emp-123")
      expect(HashUtil.compare).toHaveBeenCalledWith("OldPass123!", "mocked-old-hash")
      expect(HashUtil.hash).toHaveBeenCalledWith("NewPass123!")
      expect(mockRepo.updatePassword).toHaveBeenCalledWith("emp-123", "mocked-new-hash")
    })

    it("UTCID02 - throws 404 AppError if auth record not found", async () => {
      // Arrange
      mockRepo.findAuthById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.changePassword("emp-invalid", "old", "new")).rejects.toThrow(
        expect.objectContaining({
          message: "Profile not found",
          statusCode: 404,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID03 - throws 400 AppError when old password comparison fails", async () => {
      // Arrange
      const authEmployee = {
        ...mockEmployee,
        passwordHash: "mocked-old-hash",
      }
      mockRepo.findAuthById.mockResolvedValue(authEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(false)

      // Act & Assert
      await expect(service.changePassword("emp-123", "WrongOldPass", "NewPass")).rejects.toThrow(
        expect.objectContaining({
          message: "Mật khẩu hiện tại không chính xác",
          statusCode: 400,
          layerName: "ProfileService",
          code: "INVALID_CURRENT_PASSWORD",
        }),
      )
    })
  })

  describe("updatePersonalEmployeeLink", () => {
    it("UTCID01 - successfully updates link for authorized admin manager role", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValueOnce(mockEmployee) // First for account verification
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["admin"]),
        isDynamicAdmin: false,
        permissions: new Set(["employee.update"]),
      })

      const linkedEmployee = {
        ...mockEmployee,
        id: "emp-789",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      mockRepo.findById.mockResolvedValueOnce(linkedEmployee) // Second for linked profile status check

      const updatedEmployee = {
        ...mockEmployee,
        personalEmployeeId: "emp-789",
        personalEmployee: linkedEmployee,
      }
      mockRepo.updatePersonalEmployeeLink.mockResolvedValue(updatedEmployee)

      // Act
      const result = await service.updatePersonalEmployeeLink("emp-123", {
        personalEmployeeId: "emp-789",
      })

      // Assert
      expect(mockRepo.updatePersonalEmployeeLink).toHaveBeenCalledWith("emp-123", "emp-789")
      expect(result.personalEmployeeId).toBe("emp-789")
    })

    it("UTCID02 - throws 404 AppError if main profile account does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.updatePersonalEmployeeLink("emp-invalid", { personalEmployeeId: "emp-789" }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Profile not found",
          statusCode: 404,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID03 - throws 403 AppError if user does not have manager privileges", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValueOnce(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["employee"]),
        isDynamicAdmin: false,
        permissions: new Set(),
      })

      // Act & Assert
      await expect(
        service.updatePersonalEmployeeLink("emp-123", { personalEmployeeId: "emp-789" }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Chỉ tài khoản quản trị mới được liên kết hồ sơ chấm công",
          statusCode: 403,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID04 - throws 400 AppError if linked profile is inactive or missing", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValueOnce(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["admin"]),
        isDynamicAdmin: false,
        permissions: new Set(["employee.update"]),
      })
      mockRepo.findById.mockResolvedValueOnce(null) // Linked employee not found

      // Act & Assert
      await expect(
        service.updatePersonalEmployeeLink("emp-123", { personalEmployeeId: "emp-missing" }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Hồ sơ nhân viên liên kết không hợp lệ",
          statusCode: 400,
          layerName: "ProfileService",
        }),
      )
    })

    it("UTCID05 - sets personalEmployeeId to null if payload links employee to itself", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValueOnce(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(["general_manager"]),
        isDynamicAdmin: false,
        permissions: new Set(["employee.update"]),
      })
      const updatedEmployee = {
        ...mockEmployee,
        personalEmployeeId: null,
        personalEmployee: null,
      }
      mockRepo.updatePersonalEmployeeLink.mockResolvedValue(updatedEmployee)

      // Act
      const result = await service.updatePersonalEmployeeLink("emp-123", {
        personalEmployeeId: "emp-123",
      })

      // Assert
      expect(mockRepo.updatePersonalEmployeeLink).toHaveBeenCalledWith("emp-123", null)
      expect(result.personalEmployeeId).toBeNull()
    })

    it("UTCID06 - throws 500 AppError if repo update operation fails", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValueOnce(mockEmployee)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        roles: new Set(),
        isDynamicAdmin: true,
        permissions: new Set(),
      })
      mockRepo.updatePersonalEmployeeLink.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.updatePersonalEmployeeLink("emp-123", { personalEmployeeId: null }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Không thể cập nhật liên kết hồ sơ chấm công",
          statusCode: 500,
          layerName: "ProfileService",
        }),
      )
    })
  })
})

