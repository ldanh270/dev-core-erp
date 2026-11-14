/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ACCOUNT_LOCK_TTL,
  ACTIVITY_ACTION,
  ACTIVITY_CATEGORY,
  PASSWORD_RESET_STATUS,
  PASSWORD_RESET_TTL,
  REFRESH_TOKEN_TTL_MS,
} from "@/configs/auth/auth.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"
import { AUTH_ERROR_MESSAGES } from "@/constants/auth.constants.ts"
import {
  ActivityLogItem,
  ActivityLogQuery,
  AuthEmployeeDocument,
  AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  GenericAuthResponseDto,
  IAuthRepository,
  IAuthService,
  LockedAccountItem,
  LoginDto,
  LogoutResponseDto,
  PaginatedActivityLogsDto,
  RefreshResultDto,
  ResetPasswordDto,
  SecuritySummaryDto,
  TokenValidationResponseDto,
  ValidateResetTokenDto,
} from "@/types/auth.types.ts"
import { getPersonalEmployeeLink } from "@/utils/attendance/resolve-personal-employee-id.ts"
import { EmailUtil } from "@/utils/email.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import crypto from "crypto"

import { authorizationService } from "./authorization.service.ts"

/**
 * Maps an authenticated employee into the auth response shape with resolved access context.
 */
async function toAuthEmployee(
  employee: AuthEmployeeDocument,
): Promise<AuthResponseDto["employee"]> {
  const link = await getPersonalEmployeeLink(employee.id)
  const authContext = await authorizationService.getAuthorizationContext(employee.id, {
    skipCache: false,
  })

  return {
    id: employee.id,
    username: employee.username,
    email: employee.email,
    fullName: employee.fullName,
    roles: Array.from(authContext.roles),
    permissions: Array.from(authContext.permissions),
    personalEmployeeId: link.personalEmployeeId,
    personalEmployee: link.personalEmployee,
  }
}

/**
 * Authentication Service implementing the business logic for login, logout, and password management
 * Adheres to SOLID principles by depending on IAuthRepository abstraction
 */
export class AuthService implements IAuthService {
  /**
   * Injecting the repository via constructor (Dependency Injection)
   */
  constructor(private repo: IAuthRepository) {}

  /**
   * Helper to generate tokens and save refresh token to DB
   */
  private async generateTokens(
    employee: AuthEmployeeDocument,
    existingExpiresAt?: Date,
  ): Promise<{ accessToken: string; refreshToken: string; refreshExpiresAt: Date }> {
    const payload = {
      empId: employee.id,
      username: employee.username,
      version: 3,
    }

    const accessToken = JwtUtil.generateAccessToken(payload)
    const refreshToken = JwtUtil.generateRefreshToken(payload)

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const refreshExpiresAt = existingExpiresAt || new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

    await this.repo.createRefreshToken({
      employeeId: employee.id,
      tokenHash,
      expiresAt: refreshExpiresAt,
    })

    return { accessToken, refreshToken, refreshExpiresAt }
  }

  /**
   * Handles user login logic: credential verification, account locking, and token generation
   * Normalizes input by trimming and converting to lowercase before repository lookup
   */
  async login(
    data: LoginDto,
    ipAddress?: string,
  ): Promise<
    AuthResponseDto & { accessToken: string; refreshToken: string; refreshExpiresAt: Date }
  > {
    const { username, password } = data

    // Fetch user through repository using normalized identifier
    const employee = await this.repo.findAuthByIdentifier(username)

    // Security: Generic error for non-existent username to prevent user enumeration
    if (!employee) {
      throw new AppError(
        AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.SERVICE,
      )
    }

    // Status Check
    if (employee.status === EMPLOYEE_STATUS.TERMINATED) {
      throw new AppError(
        "Tài khoản đã bị chấm dứt do nghỉ việc (Account terminated)",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        "Account is disabled or inactive",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    // Lock Check (Brute-force protection)
    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      throw new AppError(
        `Account is temporarily locked. Try again after ${employee.lockedUntil.toLocaleString()}`,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    // Password Verification
    const isPasswordMatch = await HashUtil.compare(password, employee.passwordHash)

    if (!isPasswordMatch) {
      // Increment failed attempts and lock if threshold reached
      employee.failedLoginCount = (employee.failedLoginCount || 0) + 1

      if (employee.failedLoginCount >= 5) {
        const isNewlyLocked = employee.failedLoginCount === 5
        employee.lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_TTL) // 5 mins lockout

        // Log account lock
        await this.repo.logActivity({
          empId: employee.id,
          category: ACTIVITY_CATEGORY.SECURITY,
          actionType: ACTIVITY_ACTION.ACCOUNT_LOCKED,
          ipAddress,
          timestamp: new Date(),
          details: JSON.stringify({
            failedLoginCount: employee.failedLoginCount,
            lockedUntil: employee.lockedUntil,
          }),
        })

        // Send lock notification email only on transition to locked state
        if (isNewlyLocked) {
          try {
            await EmailUtil.sendAccountLockedEmail(employee.email, {
              fullName: employee.fullName,
              lockedUntil: employee.lockedUntil,
              failedAttempts: employee.failedLoginCount,
            })
          } catch (emailError) {
            console.error("Failed to send account lock email:", emailError)
          }
        }
      }

      await this.repo.updateAuthEmployee(employee.id, {
        failedLoginCount: employee.failedLoginCount,
        lockedUntil: employee.lockedUntil,
      })

      // Log failed attempt through repository
      await this.repo.logActivity({
        empId: employee.id,
        category: ACTIVITY_CATEGORY.AUTH,
        actionType: ACTIVITY_ACTION.FAILED_LOGIN,
        ipAddress,
        timestamp: new Date(),
      })

      throw new AppError(
        AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.SERVICE,
      )
    }

    // Successful Login
    employee.failedLoginCount = 0
    employee.lockedUntil = null
    await this.repo.updateAuthEmployee(employee.id, {
      failedLoginCount: employee.failedLoginCount,
      lockedUntil: employee.lockedUntil,
      lastLoginAt: new Date(),
    })

    // Log success through repository
    await this.repo.logActivity({
      empId: employee.id,
      category: ACTIVITY_CATEGORY.AUTH,
      actionType: ACTIVITY_ACTION.LOGIN,
      ipAddress,
      timestamp: new Date(),
    })

    // Generate Tokens
    const tokens = await this.generateTokens(employee)

    return {
      employee: await toAuthEmployee(employee),
      ...tokens,
    }
  }

  /**
   * Refreshes an authenticated session using a valid refresh token.
   */
  async refresh(
    rawRefreshToken: string,
  ): Promise<
    RefreshResultDto & { accessToken: string; refreshToken: string; refreshExpiresAt: Date }
  > {
    const decoded = JwtUtil.verifyRefreshToken(rawRefreshToken)
    if (!decoded) {
      throw new AppError(
        "Invalid or expired refresh token",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.SERVICE,
      )
    }

    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
    const oldToken = await this.repo.findRefreshTokenByHash(tokenHash)

    if (!oldToken) {
      throw new AppError("Refresh token not found", HttpStatusCode.UNAUTHORIZED, ErrorLayer.SERVICE)
    }

    if (oldToken.revokedAt !== null) {
      // GRACE PERIOD: 30 seconds
      // Prevent Token Reuse False Positives when multiple tabs refresh concurrently
      const GRACE_PERIOD_MS = 30 * 1000
      if (Date.now() - oldToken.revokedAt.getTime() <= GRACE_PERIOD_MS) {
        const employee = await this.repo.findById(oldToken.employeeId)
        if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
          throw new AppError("Account inactive", HttpStatusCode.FORBIDDEN, "Authentication")
        }

        const tokens = await this.generateTokens(employee, oldToken.expiresAt)
        return {
          employee: await toAuthEmployee(employee),
          ...tokens,
        }
      }

      await this.repo.revokeAllUserRefreshTokens(oldToken.employeeId)
      await this.repo.logActivity({
        empId: oldToken.employeeId,
        category: ACTIVITY_CATEGORY.SECURITY,
        actionType: ACTIVITY_ACTION.TOKEN_REUSE_DETECTED,
        timestamp: new Date(),
        details: "A revoked refresh token was used. All sessions terminated.",
      })
      throw new AppError(
        "Phiên đăng nhập bất thường",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.SERVICE,
      )
    }

    if (oldToken.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", HttpStatusCode.UNAUTHORIZED, ErrorLayer.SERVICE)
    }

    const employee = await this.repo.findById(oldToken.employeeId)
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError("Account inactive", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE)
    }

    await this.repo.revokeRefreshToken(oldToken.id)

    const tokens = await this.generateTokens(employee, oldToken.expiresAt)

    return {
      employee: await toAuthEmployee(employee),
      ...tokens,
    }
  }

  /**
   * Retrieves current authenticated employee profile details.
   */
  async getMe(empId: string): Promise<AuthResponseDto["employee"]> {
    const employee = await this.repo.findById(empId)
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        "Account inactive or not found",
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
      )
    }

    return toAuthEmployee(employee)
  }

  /**
   * Handles user logout logic: revokes token and records activity
   */
  async logout(
    empId: string,
    rawRefreshToken?: string,
    ipAddress?: string,
  ): Promise<LogoutResponseDto> {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
      const tokenDoc = await this.repo.findRefreshTokenByHash(tokenHash)
      if (tokenDoc && !tokenDoc.revokedAt) {
        await this.repo.revokeRefreshToken(tokenDoc.id)
      }
    }

    // Log logout activity through repository
    await this.repo.logActivity({
      empId,
      category: ACTIVITY_CATEGORY.AUTH,
      actionType: ACTIVITY_ACTION.LOGOUT,
      ipAddress,
      timestamp: new Date(),
    })

    return { message: "Logged out successfully" }
  }

  /**
   * Handles forgot password logic: generates token and sends reset email
   * Always returns a generic response to prevent user enumeration
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<GenericAuthResponseDto> {
    const { email } = data
    const genericResponse = {
      message: "If an account exists, a reset email has been sent.",
    }

    // Fetch user by normalized email
    const employee = await this.repo.findAuthByEmail(email)

    // Security: Do not reveal if email exists
    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      return genericResponse
    }

    // Handle existing pending requests
    const existingRequest = await this.repo.findPendingRequestByEmployeeId(employee.id)
    if (existingRequest) {
      const now = new Date()
      // If still valid: do nothing, return generic response
      if ((existingRequest as any).expiresAt > now) {
        if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
          return {
            ...genericResponse,
            debugToken: (existingRequest as any).token,
            note: "Existing unexpired request found.",
          } as any
        }
        return genericResponse
      }

      // If expired: Mark as EXPIRED to allow creating a new one
      await this.repo.updateResetRequestStatus(
        (existingRequest as any).id,
        PASSWORD_RESET_STATUS.EXPIRED,
      )
    }

    // Generate a secure plain-text token
    const token = crypto.randomBytes(32).toString("hex")

    // Create the request with expiration
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL)
    await this.repo.createResetRequest({
      employeeId: employee.id,
      token,
      expiresAt,
    })

    // Send email synchronously via Resend for testing/validation
    try {
      const resendResult = await EmailUtil.sendResetPasswordEmail(employee.email, token)

      // Debugging: Always return token and resend info if not in production
      if (process.env.NODE_ENV !== "production") {
        return {
          message: genericResponse.message,
          debugToken: token,
          expiresAt,
          resend: resendResult,
        } as any
      }
    } catch (error) {
      console.error("Critical error sending reset email:", error)
      // Throw error in dev to see root cause
      if (process.env.NODE_ENV !== "production") {
        throw error
      }
    }

    return genericResponse
  }

  /**
   * Validates a password reset token for status and expiration
   */
  async validateResetToken(data: ValidateResetTokenDto): Promise<TokenValidationResponseDto> {
    const { token } = data

    // Find request by token (only checks status: PENDING in repo)
    const request = await this.repo.findResetRequestByToken(token)

    if (!request) {
      return { isValid: false, message: "Invalid or already used token" }
    }

    // Check expiration in Service layer (15-minute window)
    if ((request as any).expiresAt < new Date()) {
      await this.repo.updateResetRequestStatus((request as any).id, PASSWORD_RESET_STATUS.EXPIRED)
      return { isValid: false, message: "Reset link has expired" }
    }

    return { isValid: true }
  }

  /**
   * Resets a user's password using a valid token
   */
  async resetPassword(data: ResetPasswordDto): Promise<GenericAuthResponseDto> {
    const { token, newPassword } = data

    // Validate token status and expiration
    const validation = await this.validateResetToken({ token })
    if (!validation.isValid) {
      throw new AppError(
        validation.message || "Invalid token",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Find the request again to get employee info
    const request = await this.repo.findResetRequestByToken(token)
    if (!request) {
      throw new AppError("Reset request not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Update employee password
    const employee = await this.repo.findById((request as any).employeeId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Security: Prevent resetting to the same password
    const isSamePassword = await HashUtil.compare(newPassword, employee.passwordHash)
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    const passwordHash = await HashUtil.hash(newPassword)
    await this.repo.updateAuthEmployee(employee.id, { passwordHash })

    // Mark request as used
    await this.repo.updateResetRequestStatus((request as any).id, PASSWORD_RESET_STATUS.USED)

    return { message: "Password reset successfully. You can now login with your new password." }
  }

  /**
   * Changes an authenticated user's password
   */
  async changePassword(empId: string, data: ChangePasswordDto): Promise<GenericAuthResponseDto> {
    const { oldPassword, newPassword } = data

    // Fetch employee with password hash
    const employee = await this.repo.findById(empId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Verify current password
    const isMatch = await HashUtil.compare(oldPassword, employee.passwordHash)
    if (!isMatch) {
      throw new AppError(
        "Incorrect current password",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.SERVICE,
      )
    }

    // Security: Prevent changing to the same password
    const isSamePassword = await HashUtil.compare(newPassword, employee.passwordHash)
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Update to new password
    const passwordHash = await HashUtil.hash(newPassword)
    await this.repo.updateAuthEmployee(employee.id, { passwordHash })

    return { message: "Password changed successfully." }
  }

  /**
   * Returns activity logs based on the provided query filters.
   */
  async getActivityLogs(query: ActivityLogQuery): Promise<PaginatedActivityLogsDto> {
    return this.repo.listActivityLogs(query)
  }

  /**
   * Gets activity logs for a specific user (Personal History)
   * This implementation ensures IDOR protection by overriding employeeId from token
   */
  async getMyActivityLogs(
    empId: string,
    query: ActivityLogQuery,
  ): Promise<PaginatedActivityLogsDto> {
    // IDOR Protection: Always use empId from token, ignoring anything in query
    return this.repo.listActivityLogs({ ...query, employeeId: empId })
  }

  /**
   * Gets a single activity log detail
   */
  async getActivityLogDetail(id: string): Promise<ActivityLogItem | null> {
    return this.repo.getActivityLogById(id)
  }

  /**
   * Retrieves a single personal activity log when it belongs to the authenticated employee.
   */
  async getMyActivityLogDetail(empId: string, id: string): Promise<ActivityLogItem | null> {
    return this.repo.getActivityLogByIdForEmployee(id, empId)
  }

  /**
   * Gets security dashboard summary
   */
  async getSecuritySummary(timeRange: any = "today"): Promise<SecuritySummaryDto> {
    const [
      lockedAccounts,
      failedLoginsToday,
      successfulLoginsToday,
      recentSecurityEvents,
      recentRoleEvents,
    ] = await Promise.all([
      this.repo.getLockedEmployees(),
      this.repo.countActivityLogs(ACTIVITY_CATEGORY.AUTH, ACTIVITY_ACTION.FAILED_LOGIN, timeRange),
      this.repo.countActivityLogs(ACTIVITY_CATEGORY.AUTH, ACTIVITY_ACTION.LOGIN, timeRange),
      this.repo.getRecentLogsByCategory(ACTIVITY_CATEGORY.SECURITY, 5),
      this.repo.getRecentLogsByCategory(ACTIVITY_CATEGORY.ROLE, 5),
    ])

    return {
      lockedAccountsCount: lockedAccounts.length,
      failedLoginsToday,
      successfulLoginsToday,
      recentSecurityEvents,
      recentRoleEvents,
    }
  }

  /**
   * Gets all currently locked accounts
   */
  async getLockedAccounts(): Promise<LockedAccountItem[]> {
    return this.repo.getLockedEmployees()
  }

  /**
   * Unlocks an employee account and logs the action
   */
  async unlockAccount(empId: string, actorId: string, ipAddress?: string): Promise<void> {
    const employee = await this.repo.findById(empId)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    await this.repo.unlockEmployee(empId)

    // Log the unlock action
    await this.repo.logActivity({
      empId,
      category: ACTIVITY_CATEGORY.SECURITY,
      actionType: ACTIVITY_ACTION.ACCOUNT_UNLOCKED,
      ipAddress,
      timestamp: new Date(),
      details: JSON.stringify({
        actorId,
        message: "Account manually unlocked by administrator",
      }),
    })
  }
}
