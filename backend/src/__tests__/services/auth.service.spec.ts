import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config"
import { getPersonalEmployeeLink } from "@/utils/attendance/resolve-personal-employee-id.ts"
import { EmailUtil } from "@/utils/email.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

/// <reference types="jest" />
import { AuthService } from "../../services/auth.service"
import { authorizationService } from "../../services/authorization.service"
import { IAuthRepository } from "../../types/auth.types"

jest.mock("@/configs/auth/auth.config.ts", () => ({
  ACCOUNT_LOCK_TTL: 300000,
  ACTIVITY_ACTION: {
    ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
    FAILED_LOGIN: "FAILED_LOGIN",
    LOGIN: "LOGIN",
    TOKEN_REUSE_DETECTED: "TOKEN_REUSE_DETECTED",
    LOGOUT: "LOGOUT",
    ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  },
  ACTIVITY_CATEGORY: {
    SECURITY: "SECURITY",
    AUTH: "AUTH",
    ROLE: "ROLE",
  },
  PASSWORD_RESET_STATUS: {
    EXPIRED: "EXPIRED",
    USED: "USED",
  },
  PASSWORD_RESET_TTL: 900000,
  REFRESH_TOKEN_TTL_MS: 86400000,
}))

jest.mock("@/configs/entities/employee.config.ts", () => ({
  EMPLOYEE_STATUS: {
    ACTIVE: EMPLOYEE_STATUS.ACTIVE,
    TERMINATED: "TERMINATED",
    INACTIVE: EMPLOYEE_STATUS.INACTIVE,
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    OK: 200,
  },
}))

jest.mock("@/configs/system/server.config.ts", () => ({
  ENVIRONMENT: {
    PRODUCTION: "production",
    DEVELOPMENT: "development",
  },
  ENV_ENVIRONMENT: "development",
}))

jest.mock("@/constants/auth.constants.ts", () => ({
  AUTH_ERROR_MESSAGES: {
    INVALID_CREDENTIALS: "Invalid username or password",
  },
}))

jest.mock("@/utils/attendance/resolve-personal-employee-id.ts", () => ({
  getPersonalEmployeeLink: jest.fn(),
}))

jest.mock("@/utils/email.util.ts", () => ({
  EmailUtil: {
    sendAccountLockedEmail: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
  },
}))

jest.mock("@/utils/error.util.ts", () => {
  return {
    AppError: class AppError extends Error {
      public statusCode: number
      public errorLayer: string
      constructor(message: string, statusCode: number, errorLayer: string) {
        super(message)
        this.name = "AppError"
        this.statusCode = statusCode
        this.errorLayer = errorLayer
      }
    },
  }
})

jest.mock("@/utils/hash.util.ts", () => ({
  HashUtil: {
    compare: jest.fn(),
    hash: jest.fn(),
  },
}))

jest.mock("@/utils/jwt.util.ts", () => ({
  JwtUtil: {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}))

jest.mock("crypto", () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash"),
  }),
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue("mocked-random-bytes"),
  }),
}))

jest.mock("../../services/authorization.service", () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn(),
  },
}))

describe("AuthService", () => {
  let authService: AuthService
  let mockRepo: Record<string, jest.Mock>

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo = {
      findAuthByIdentifier: jest.fn(),
      createRefreshToken: jest.fn(),
      updateAuthEmployee: jest.fn(),
      logActivity: jest.fn(),
      findRefreshTokenByHash: jest.fn(),
      findById: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
      revokeRefreshToken: jest.fn(),
      findAuthByEmail: jest.fn(),
      findPendingRequestByEmployeeId: jest.fn(),
      updateResetRequestStatus: jest.fn(),
      createResetRequest: jest.fn(),
      findResetRequestByToken: jest.fn(),
      listActivityLogs: jest.fn(),
      getActivityLogById: jest.fn(),
      getActivityLogByIdForEmployee: jest.fn(),
      getLockedEmployees: jest.fn(),
      countActivityLogs: jest.fn(),
      getRecentLogsByCategory: jest.fn(),
      unlockEmployee: jest.fn(),
      invalidateAllPendingRequests: jest.fn(),
    }
    authService = new AuthService(mockRepo as unknown as IAuthRepository)
  })

  describe("login", () => {
    it("UTCID01 - Happy Path: logs in successfully with valid credentials", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        email: "test@example.com",
        fullName: "Test User",
        passwordHash: "hashed-password",
        status: EMPLOYEE_STATUS.ACTIVE,
        lockedUntil: null,
        failedLoginCount: 0,
      }
      const mockLink = { personalEmployeeId: "pe-123", personalEmployee: {} }
      const mockAuthContext = { roles: new Set(["USER"]), permissions: new Set(["READ"]) }

      mockRepo.findAuthByIdentifier.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(true)
      ;(getPersonalEmployeeLink as jest.Mock).mockResolvedValue(mockLink)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue(
        mockAuthContext,
      )
      ;(JwtUtil.generateAccessToken as jest.Mock).mockReturnValue("access-token")
      ;(JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue("refresh-token")

      // Act
      const result = await authService.login(
        { username: "testuser", password: "password123" },
        "127.0.0.1",
      )

      // Assert
      expect(result.employee.id).toBe("emp-123")
      expect(result.accessToken).toBe("access-token")
      expect(result.refreshToken).toBe("refresh-token")
      expect(mockRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: "LOGIN" }),
      )
    })

    it("UTCID02 - Error Case: throws error if employee does not exist", async () => {
      // Arrange
      mockRepo.findAuthByIdentifier.mockResolvedValue(null)

      // Act & Assert
      await expect(
        authService.login({ username: "unknown", password: "password" }),
      ).rejects.toThrow("Invalid username or password")
    })

    it("UTCID03 - Error Case: throws error if employee status is TERMINATED", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        status: "TERMINATED",
        lockedUntil: null,
      }
      mockRepo.findAuthByIdentifier.mockResolvedValue(mockEmployee)

      // Act & Assert
      await expect(
        authService.login({ username: "testuser", password: "password" }),
      ).rejects.toThrow("Tài khoản đã bị chấm dứt do nghỉ việc")
    })

    it("UTCID04 - Error Case: throws error if account is locked", async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 100000)
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        status: EMPLOYEE_STATUS.ACTIVE,
        lockedUntil: futureDate,
      }
      mockRepo.findAuthByIdentifier.mockResolvedValue(mockEmployee)

      // Act & Assert
      await expect(
        authService.login({ username: "testuser", password: "password" }),
      ).rejects.toThrow("Account is temporarily locked")
    })

    it("UTCID05 - Error Case: throws error on incorrect password and increments failure count", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        email: "test@example.com",
        fullName: "Test User",
        passwordHash: "hashed-password",
        status: EMPLOYEE_STATUS.ACTIVE,
        lockedUntil: null,
        failedLoginCount: 0,
      }
      mockRepo.findAuthByIdentifier.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(false)

      // Act & Assert
      await expect(authService.login({ username: "testuser", password: "wrong" })).rejects.toThrow(
        "Invalid username or password",
      )
      expect(mockRepo.updateAuthEmployee).toHaveBeenCalledWith(
        "emp-123",
        expect.objectContaining({ failedLoginCount: 1 }),
      )
    })
  })

  describe("refresh", () => {
    it("UTCID01 - Happy Path: refreshes session with a valid refresh token", async () => {
      // Arrange
      const mockDecoded = { empId: "emp-123", username: "testuser" }
      const mockOldToken = {
        id: "token-id",
        employeeId: "emp-123",
        tokenHash: "mocked-hash",
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
      }
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      const mockLink = { personalEmployeeId: "pe-123", personalEmployee: {} }
      const mockAuthContext = { roles: new Set(["USER"]), permissions: new Set(["READ"]) }

      ;(JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockDecoded)
      mockRepo.findRefreshTokenByHash.mockResolvedValue(mockOldToken)
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(getPersonalEmployeeLink as jest.Mock).mockResolvedValue(mockLink)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue(
        mockAuthContext,
      )
      ;(JwtUtil.generateAccessToken as jest.Mock).mockReturnValue("new-access-token")
      ;(JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue("new-refresh-token")

      // Act
      const result = await authService.refresh("old-refresh-token")

      // Assert
      expect(result.accessToken).toBe("new-access-token")
      expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith("token-id")
    })

    it("UTCID02 - Error Case: throws error for invalid refresh token signature", async () => {
      // Arrange
      ;(JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(null)

      // Act & Assert
      await expect(authService.refresh("invalid-token")).rejects.toThrow(
        "Invalid or expired refresh token",
      )
    })

    it("UTCID03 - Error Case: throws error if refresh token not found in database", async () => {
      // Arrange
      ;(JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue({ empId: "emp-123" })
      mockRepo.findRefreshTokenByHash.mockResolvedValue(null)

      // Act & Assert
      await expect(authService.refresh("unknown-token")).rejects.toThrow("Refresh token not found")
    })

    it("UTCID04 - Error Case: handles token reuse and revokes all tokens", async () => {
      // Arrange
      const mockDecoded = { empId: "emp-123" }
      const mockOldToken = {
        id: "token-id",
        employeeId: "emp-123",
        tokenHash: "mocked-hash",
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 40000),
      }

      ;(JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(mockDecoded)
      mockRepo.findRefreshTokenByHash.mockResolvedValue(mockOldToken)

      // Act & Assert
      await expect(authService.refresh("revoked-token")).rejects.toThrow(
        "Phiên đăng nhập bất thường",
      )
      expect(mockRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith("emp-123")
    })
  })

  describe("getMe", () => {
    it("UTCID01 - Happy Path: retrieves the authenticated user profile", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      const mockLink = { personalEmployeeId: "pe-123", personalEmployee: {} }
      const mockAuthContext = { roles: new Set(["USER"]), permissions: new Set(["READ"]) }

      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(getPersonalEmployeeLink as jest.Mock).mockResolvedValue(mockLink)
      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue(
        mockAuthContext,
      )

      // Act
      const result = await authService.getMe("emp-123")

      // Assert
      expect(result.id).toBe("emp-123")
    })

    it("UTCID02 - Error Case: throws error if user not found", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(authService.getMe("non-existent")).rejects.toThrow(
        "Account inactive or not found",
      )
    })

    it("UTCID03 - Error Case: throws error if employee status is not ACTIVE", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        username: "testuser",
        status: EMPLOYEE_STATUS.INACTIVE,
      }
      mockRepo.findById.mockResolvedValue(mockEmployee)

      // Act & Assert
      await expect(authService.getMe("emp-123")).rejects.toThrow("Account inactive or not found")
    })
  })

  describe("logout", () => {
    it("UTCID01 - Happy Path: logs out and revokes refresh token if provided", async () => {
      // Arrange
      const mockToken = { id: "token-123", revokedAt: null }
      mockRepo.findRefreshTokenByHash.mockResolvedValue(mockToken)

      // Act
      const result = await authService.logout("emp-123", "some-refresh-token", "127.0.0.1")

      // Assert
      expect(result).toEqual({ message: "Logged out successfully" })
      expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith("token-123")
      expect(mockRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: "LOGOUT" }),
      )
    })

    it("UTCID02 - Error Case: propagates error if repository token search throws", async () => {
      // Arrange
      mockRepo.findRefreshTokenByHash.mockRejectedValue(new Error("DB connection failed"))

      // Act & Assert
      await expect(authService.logout("emp-123", "some-refresh-token")).rejects.toThrow(
        "DB connection failed",
      )
    })

    it("UTCID03 - Error Case: propagates error if repository logActivity throws", async () => {
      // Arrange
      mockRepo.findRefreshTokenByHash.mockResolvedValue(null)
      mockRepo.logActivity.mockRejectedValue(new Error("Logger down"))

      // Act & Assert
      await expect(authService.logout("emp-123")).rejects.toThrow("Logger down")
    })
  })

  describe("forgotPassword", () => {
    it("UTCID01 - Happy Path: initiates forgot password flow successfully", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        email: "test@example.com",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      mockRepo.findAuthByEmail.mockResolvedValue(mockEmployee)
      mockRepo.findPendingRequestByEmployeeId.mockResolvedValue(null)
      ;(EmailUtil.sendResetPasswordEmail as jest.Mock).mockResolvedValue({ id: "email-id" })

      // Act
      const result = await authService.forgotPassword({ email: "test@example.com" })

      // Assert
      expect(result.message).toBe("If an account exists, a reset email has been sent.")
      expect(mockRepo.createResetRequest).toHaveBeenCalled()
    })

    it("UTCID02 - Error Case: returns generic response without doing anything if user is not ACTIVE", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        email: "test@example.com",
        status: EMPLOYEE_STATUS.INACTIVE,
      }
      mockRepo.findAuthByEmail.mockResolvedValue(mockEmployee)

      // Act
      const result = await authService.forgotPassword({ email: "test@example.com" })

      // Assert
      expect(result.message).toBe("If an account exists, a reset email has been sent.")
      expect(mockRepo.createResetRequest).not.toHaveBeenCalled()
    })

    it("UTCID03 - Error Case: propagates error if EmailUtil throws exception in development mode", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        email: "test@example.com",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      mockRepo.findAuthByEmail.mockResolvedValue(mockEmployee)
      mockRepo.findPendingRequestByEmployeeId.mockResolvedValue(null)
      ;(EmailUtil.sendResetPasswordEmail as jest.Mock).mockRejectedValue(new Error("SMTP Error"))

      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "development"

      // Act & Assert
      await expect(authService.forgotPassword({ email: "test@example.com" })).rejects.toThrow(
        "SMTP Error",
      )

      process.env.NODE_ENV = originalEnv
    })

    it("UTCID04 - Error Case: propagates database error if updating expired token status fails", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        email: "test@example.com",
        status: EMPLOYEE_STATUS.ACTIVE,
      }
      const expiredRequest = {
        id: "req-123",
        expiresAt: new Date(Date.now() - 10000),
      }
      mockRepo.findAuthByEmail.mockResolvedValue(mockEmployee)
      mockRepo.findPendingRequestByEmployeeId.mockResolvedValue(expiredRequest)
      mockRepo.updateResetRequestStatus.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(authService.forgotPassword({ email: "test@example.com" })).rejects.toThrow(
        "Update failed",
      )
    })
  })

  describe("validateResetToken", () => {
    it("UTCID01 - Happy Path: returns isValid true for pending and unexpired token", async () => {
      // Arrange
      const mockRequest = {
        id: "req-123",
        expiresAt: new Date(Date.now() + 100000),
      }
      mockRepo.findResetRequestByToken.mockResolvedValue(mockRequest)

      // Act
      const result = await authService.validateResetToken({ token: "valid-token" })

      // Assert
      expect(result).toEqual({ isValid: true })
    })

    it("UTCID02 - Error Case: returns isValid false if token is not found in database", async () => {
      // Arrange
      mockRepo.findResetRequestByToken.mockResolvedValue(null)

      // Act
      const result = await authService.validateResetToken({ token: "unknown-token" })

      // Assert
      expect(result).toEqual({ isValid: false, message: "Invalid or already used token" })
    })

    it("UTCID03 - Error Case: returns isValid false and marks expired if token has expired", async () => {
      // Arrange
      const mockRequest = {
        id: "req-123",
        expiresAt: new Date(Date.now() - 10000),
      }
      mockRepo.findResetRequestByToken.mockResolvedValue(mockRequest)

      // Act
      const result = await authService.validateResetToken({ token: "expired-token" })

      // Assert
      expect(result).toEqual({ isValid: false, message: "Reset link has expired" })
      expect(mockRepo.updateResetRequestStatus).toHaveBeenCalledWith("req-123", "EXPIRED")
    })
  })

  describe("resetPassword", () => {
    it("UTCID01 - Happy Path: resets the password successfully", async () => {
      // Arrange
      const mockRequest = {
        id: "req-123",
        employeeId: "emp-123",
        expiresAt: new Date(Date.now() + 100000),
      }
      const mockEmployee = {
        id: "emp-123",
        passwordHash: "old-hash",
      }
      mockRepo.findResetRequestByToken.mockResolvedValue(mockRequest)
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(false)
      ;(HashUtil.hash as jest.Mock).mockResolvedValue("new-hash")

      // Act
      const result = await authService.resetPassword({
        token: "valid-token",
        newPassword: "NewPassword1!",
      })

      // Assert
      expect(result.message).toContain("Password reset successfully")
      expect(mockRepo.updateAuthEmployee).toHaveBeenCalledWith("emp-123", {
        passwordHash: "new-hash",
      })
      expect(mockRepo.updateResetRequestStatus).toHaveBeenCalledWith("req-123", "USED")
    })

    it("UTCID02 - Error Case: throws error if token validation fails", async () => {
      // Arrange
      mockRepo.findResetRequestByToken.mockResolvedValue(null)

      // Act & Assert
      await expect(
        authService.resetPassword({ token: "invalid-token", newPassword: "NewPassword1!" }),
      ).rejects.toThrow("Invalid or already used token")
    })

    it("UTCID03 - Error Case: throws error if reset request not found after validation", async () => {
      // Arrange
      const mockRequest = {
        id: "req-123",
        employeeId: "emp-123",
        expiresAt: new Date(Date.now() + 100000),
      }
      mockRepo.findResetRequestByToken
        .mockResolvedValueOnce(mockRequest)
        .mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.resetPassword({ token: "valid-token", newPassword: "NewPassword1!" }),
      ).rejects.toThrow("Reset request not found")
    })

    it("UTCID04 - Error Case: throws error if trying to reset to the same password", async () => {
      // Arrange
      const mockRequest = {
        id: "req-123",
        employeeId: "emp-123",
        expiresAt: new Date(Date.now() + 100000),
      }
      const mockEmployee = {
        id: "emp-123",
        passwordHash: "old-hash",
      }
      mockRepo.findResetRequestByToken.mockResolvedValue(mockRequest)
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(true)

      // Act & Assert
      await expect(
        authService.resetPassword({ token: "valid-token", newPassword: "old-password" }),
      ).rejects.toThrow("New password must be different from current password")
    })
  })

  describe("changePassword", () => {
    it("UTCID01 - Happy Path: changes password successfully", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        passwordHash: "old-hash",
      }
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
      ;(HashUtil.hash as jest.Mock).mockResolvedValue("new-hash")

      // Act
      const result = await authService.changePassword("emp-123", {
        oldPassword: "OldPassword1!",
        newPassword: "NewPassword1!",
      })

      // Assert
      expect(result.message).toContain("Password changed successfully")
      expect(mockRepo.updateAuthEmployee).toHaveBeenCalledWith("emp-123", {
        passwordHash: "new-hash",
      })
    })

    it("UTCID02 - Error Case: throws error if employee is not found", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        authService.changePassword("unknown-emp", {
          oldPassword: "OldPassword1!",
          newPassword: "NewPassword1!",
        }),
      ).rejects.toThrow("Employee not found")
    })

    it("UTCID03 - Error Case: throws error if old password is incorrect", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        passwordHash: "old-hash",
      }
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValue(false)

      // Act & Assert
      await expect(
        authService.changePassword("emp-123", {
          oldPassword: "WrongOldPassword1!",
          newPassword: "NewPassword1!",
        }),
      ).rejects.toThrow("Incorrect current password")
    })

    it("UTCID04 - Error Case: throws error if new password is same as old password", async () => {
      // Arrange
      const mockEmployee = {
        id: "emp-123",
        passwordHash: "old-hash",
      }
      mockRepo.findById.mockResolvedValue(mockEmployee)
      ;(HashUtil.compare as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(true)

      // Act & Assert
      await expect(
        authService.changePassword("emp-123", {
          oldPassword: "OldPassword1!",
          newPassword: "OldPassword1!",
        }),
      ).rejects.toThrow("New password must be different from current password")
    })
  })

  describe("getActivityLogs", () => {
    it("UTCID01 - Happy Path: lists activity logs based on query", async () => {
      // Arrange
      const mockQuery = { page: 1, limit: 10 }
      const mockLogs = { items: [], total: 0 }
      mockRepo.listActivityLogs.mockResolvedValue(mockLogs)

      // Act
      const result = await authService.getActivityLogs(mockQuery)

      // Assert
      expect(result).toBe(mockLogs)
      expect(mockRepo.listActivityLogs).toHaveBeenCalledWith(mockQuery)
    })

    it("UTCID02 - Error Case: propagates repository list error", async () => {
      // Arrange
      mockRepo.listActivityLogs.mockRejectedValue(new Error("Database disconnect"))

      // Act & Assert
      await expect(authService.getActivityLogs({ page: 1 })).rejects.toThrow("Database disconnect")
    })

    it("UTCID03 - Error Case: propagates repository query validation error", async () => {
      // Arrange
      mockRepo.listActivityLogs.mockRejectedValue(new Error("Invalid query format"))

      // Act & Assert
      await expect(authService.getActivityLogs({ page: -1 })).rejects.toThrow(
        "Invalid query format",
      )
    })
  })

  describe("getMyActivityLogs", () => {
    it("UTCID01 - Happy Path: lists logs for the current logged-in employee (IDOR protection)", async () => {
      // Arrange
      const mockQuery = { page: 1, employeeId: "attacker-id" }
      const mockLogs = { items: [], total: 0 }
      mockRepo.listActivityLogs.mockResolvedValue(mockLogs)

      // Act
      const result = await authService.getMyActivityLogs("emp-123", mockQuery)

      // Assert
      expect(result).toBe(mockLogs)
      expect(mockRepo.listActivityLogs).toHaveBeenCalledWith({
        page: 1,
        employeeId: "emp-123",
      })
    })

    it("UTCID02 - Error Case: propagates repository exceptions", async () => {
      // Arrange
      mockRepo.listActivityLogs.mockRejectedValue(new Error("DB error"))

      // Act & Assert
      await expect(authService.getMyActivityLogs("emp-123", {})).rejects.toThrow("DB error")
    })

    it("UTCID03 - Error Case: propagates schema validation or query syntax error", async () => {
      // Arrange
      mockRepo.listActivityLogs.mockRejectedValue(new Error("Syntax Error"))

      // Act & Assert
      await expect(authService.getMyActivityLogs("emp-123", { limit: -1 })).rejects.toThrow(
        "Syntax Error",
      )
    })
  })

  describe("getActivityLogDetail", () => {
    it("UTCID01 - Happy Path: gets log details by ID", async () => {
      // Arrange
      const mockLog = { id: "log-123", actionType: "LOGIN" }
      mockRepo.getActivityLogById.mockResolvedValue(mockLog)

      // Act
      const result = await authService.getActivityLogDetail("log-123")

      // Assert
      expect(result).toBe(mockLog)
    })

    it("UTCID02 - Error Case: returns null if log not found", async () => {
      // Arrange
      mockRepo.getActivityLogById.mockResolvedValue(null)

      // Act
      const result = await authService.getActivityLogDetail("unknown-log")

      // Assert
      expect(result).toBeNull()
    })

    it("UTCID03 - Error Case: propagates database exception", async () => {
      // Arrange
      mockRepo.getActivityLogById.mockRejectedValue(new Error("Connection failure"))

      // Act & Assert
      await expect(authService.getActivityLogDetail("log-123")).rejects.toThrow(
        "Connection failure",
      )
    })
  })

  describe("getMyActivityLogDetail", () => {
    it("UTCID01 - Happy Path: gets personal log details", async () => {
      // Arrange
      const mockLog = { id: "log-123", empId: "emp-123" }
      mockRepo.getActivityLogByIdForEmployee.mockResolvedValue(mockLog)

      // Act
      const result = await authService.getMyActivityLogDetail("emp-123", "log-123")

      // Assert
      expect(result).toBe(mockLog)
    })

    it("UTCID02 - Error Case: returns null if log not owned by user or not found", async () => {
      // Arrange
      mockRepo.getActivityLogByIdForEmployee.mockResolvedValue(null)

      // Act
      const result = await authService.getMyActivityLogDetail("attacker-id", "log-123")

      // Assert
      expect(result).toBeNull()
    })

    it("UTCID03 - Error Case: propagates repository lookup error", async () => {
      // Arrange
      mockRepo.getActivityLogByIdForEmployee.mockRejectedValue(new Error("DB query error"))

      // Act & Assert
      await expect(authService.getMyActivityLogDetail("emp-123", "log-123")).rejects.toThrow(
        "DB query error",
      )
    })
  })

  describe("getSecuritySummary", () => {
    it("UTCID01 - Happy Path: gets dashboard security summary", async () => {
      // Arrange
      mockRepo.getLockedEmployees.mockResolvedValue([{ id: "emp-1" }])
      mockRepo.countActivityLogs.mockResolvedValue(10)
      mockRepo.getRecentLogsByCategory.mockResolvedValue([])

      // Act
      const result = await authService.getSecuritySummary()

      // Assert
      expect(result.lockedAccountsCount).toBe(1)
      expect(result.failedLoginsToday).toBe(10)
      expect(result.successfulLoginsToday).toBe(10)
    })

    it("UTCID02 - Error Case: propagates error if database counting fails", async () => {
      // Arrange
      mockRepo.getLockedEmployees.mockResolvedValue([])
      mockRepo.countActivityLogs.mockRejectedValue(new Error("Count query failed"))

      // Act & Assert
      await expect(authService.getSecuritySummary()).rejects.toThrow("Count query failed")
    })

    it("UTCID03 - Error Case: propagates error if fetching locked employees fails", async () => {
      // Arrange
      mockRepo.getLockedEmployees.mockRejectedValue(new Error("Fetch failed"))

      // Act & Assert
      await expect(authService.getSecuritySummary()).rejects.toThrow("Fetch failed")
    })
  })

  describe("getLockedAccounts", () => {
    it("UTCID01 - Happy Path: retrieves all locked employee accounts", async () => {
      // Arrange
      const mockLocked = [{ employeeId: "emp-123", lockedUntil: new Date() }]
      mockRepo.getLockedEmployees.mockResolvedValue(mockLocked)

      // Act
      const result = await authService.getLockedAccounts()

      // Assert
      expect(result).toBe(mockLocked)
    })

    it("UTCID02 - Error Case: propagates repository listing errors", async () => {
      // Arrange
      mockRepo.getLockedEmployees.mockRejectedValue(new Error("DB disconnect"))

      // Act & Assert
      await expect(authService.getLockedAccounts()).rejects.toThrow("DB disconnect")
    })

    it("UTCID03 - Error Case: returns empty array when no accounts are locked", async () => {
      // Arrange
      mockRepo.getLockedEmployees.mockResolvedValue([])

      // Act
      const result = await authService.getLockedAccounts()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("unlockAccount", () => {
    it("UTCID01 - Happy Path: unlocks the employee account successfully", async () => {
      // Arrange
      const mockEmployee = { id: "emp-123" }
      mockRepo.findById.mockResolvedValue(mockEmployee)

      // Act
      await authService.unlockAccount("emp-123", "admin-id", "127.0.0.1")

      // Assert
      expect(mockRepo.unlockEmployee).toHaveBeenCalledWith("emp-123")
      expect(mockRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: "ACCOUNT_UNLOCKED",
        }),
      )
    })

    it("UTCID02 - Error Case: throws error if employee to unlock does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(authService.unlockAccount("non-existent", "admin-id")).rejects.toThrow(
        "Employee not found",
      )
    })

    it("UTCID03 - Error Case: propagates repository unlock operation error", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue({ id: "emp-123" })
      mockRepo.unlockEmployee.mockRejectedValue(new Error("Update write lock conflict"))

      // Act & Assert
      await expect(authService.unlockAccount("emp-123", "admin-id")).rejects.toThrow(
        "Update write lock conflict",
      )
    })
  })
})
