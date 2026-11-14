import { Request } from "express"

export interface AuthenticatedRequest extends Request {
  user: {
    empId: string
    username: string
  }
}

export interface JwtPayload {
  empId: string
  username: string
  version?: number
  iat?: number
  exp?: number
}
/**
 * Data Transfer Object for Login request
 */
export interface LoginDto {
  username: string
  password: string
}

/**
 * Data Transfer Object for Forgot Password request
 */
export interface ForgotPasswordDto {
  email: string
}

/**
 * Data Transfer Object for Change Password request
 */
export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

/**
 * Data Transfer Object for Reset Password request
 */
export interface ResetPasswordDto {
  token: string
  newPassword: string
}

/**
 * Data Transfer Object for Token Validation request
 */
export interface ValidateResetTokenDto {
  token: string
}

/**
 * Data Transfer Object for successful authentication response
 */
export interface AuthResponseDto {
  employee: {
    id: string
    username: string
    email: string
    fullName: string
    roles: string[]
    permissions: string[]
    personalEmployeeId: string | null
    personalEmployee: {
      id: string
      fullName: string
      email: string
    } | null
  }
}

export interface RefreshTokenDocument {
  id: string
  employeeId: string
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  revokedAt: Date | null
}

export interface RefreshResultDto {
  employee: AuthResponseDto["employee"]
}

/**
 * Data Transfer Object for logout response
 */
export interface LogoutResponseDto {
  message: string
}

/**
 * Data Transfer Object for generic authentication message response
 */
export interface GenericAuthResponseDto {
  message: string
}

/**
 * Data Transfer Object for token validation response
 */
export interface TokenValidationResponseDto {
  isValid: boolean
  message?: string
}

/**
 * Interface for Activity Log item
 */
export interface ActivityLogItem {
  id: string
  employeeId?: string | null
  employeeName?: string | null
  category: string
  actionType: string
  ipAddress?: string | null
  details?: Record<string, unknown>
  createdAt: Date
}

/**
 * Filter for Activity Logs
 */
export interface ActivityLogQuery {
  employeeId?: string
  category?: string
  actionType?: string
  fromDate?: Date
  toDate?: Date
  page?: number
  limit?: number
}

/**
 * Paginated response for Activity Logs
 */
export interface PaginatedActivityLogsDto {
  data: ActivityLogItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Interface for Locked Account item
 */
export interface LockedAccountItem {
  employeeId: string
  employeeName: string
  email: string
  failedLoginCount: number
  lockedUntil: Date | null
}

/**
 * Interface for Security Dashboard Summary
 */
export type SecurityTimeRange = "today" | "7days" | "30days" | "all"

export interface SecuritySummaryDto {
  lockedAccountsCount: number
  failedLoginsToday: number
  successfulLoginsToday: number
  recentSecurityEvents: ActivityLogItem[]
  recentRoleEvents: ActivityLogItem[]
}

/**
 * Internal interface for Employee document used in auth logic
 */
export interface AuthEmployeeDocument {
  id: string
  username: string
  email: string
  fullName: string
  passwordHash: string
  status: string
  lockedUntil?: Date | null
  failedLoginCount: number
  lastLoginAt?: Date | null
}

/**
 * Interface for Authentication Repository (Data Access Layer)
 */
export interface IAuthRepository {
  /**
   * Finds an employee by ID, including the password hash
   */
  findById(id: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds an employee by identifier (username or email), including the password hash
   */
  findAuthByIdentifier(identifier: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds an employee by email
   */
  findAuthByEmail(email: string): Promise<AuthEmployeeDocument | null>

  /**
   * Finds a pending password reset request by employee ID
   */
  findPendingRequestByEmployeeId(employeeId: string): Promise<unknown | null>

  /**
   * Finds a pending password reset request by token
   */
  findResetRequestByToken(token: string): Promise<unknown | null>

  /**
   * Invalidates all pending password reset requests for a user
   */
  invalidateAllPendingRequests(employeeId: string): Promise<void>

  /**
   * Creates a new password reset request
   */
  createResetRequest(data: { employeeId: string; token: string; expiresAt: Date }): Promise<void>

  /**
   * Updates the status of a password reset request
   */
  updateResetRequestStatus(requestId: string, status: string): Promise<void>

  /**
   * Creates a new refresh token
   */
  createRefreshToken(data: {
    employeeId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<void>

  /**
   * Finds a refresh token by hash
   */
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenDocument | null>

  /**
   * Revokes a specific refresh token
   */
  revokeRefreshToken(id: string): Promise<void>

  /**
   * Revokes all refresh tokens for a user
   */
  revokeAllUserRefreshTokens(employeeId: string): Promise<void>

  /**
   * Updates employee authentication fields
   */
  updateAuthEmployee(empId: string, data: Partial<AuthEmployeeDocument>): Promise<void>

  /**
   * Logs an activity to the database
   */
  logActivity(data: {
    empId?: string
    category: "auth" | "role" | "security"
    actionType:
      | "login"
      | "logout"
      | "failed_login"
      | "role_assigned"
      | "role_revoked"
      | "account_locked"
      | "account_unlocked"
      | "token_reuse_detected"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void>

  /**
   * Lists activity logs with pagination and filters
   */
  listActivityLogs(query: ActivityLogQuery): Promise<PaginatedActivityLogsDto>

  /**
   * Gets a single activity log by ID
   */
  getActivityLogById(id: string): Promise<ActivityLogItem | null>

  /**
   * Gets a single activity log by ID scoped to one employee
   */
  getActivityLogByIdForEmployee(id: string, employeeId: string): Promise<ActivityLogItem | null>

  /**
   * Gets all currently locked employees
   */
  getLockedEmployees(): Promise<LockedAccountItem[]>

  /**
   * Unlocks an employee account
   */
  unlockEmployee(empId: string): Promise<void>

  /**
   * Counts logs by type within a time range
   */
  countActivityLogs(
    category: "auth" | "role" | "security",
    actionType: string,
    timeRange?: SecurityTimeRange,
  ): Promise<number>

  /**
   * Gets recent activity logs by category
   */
  getRecentLogsByCategory(
    category: "auth" | "role" | "security",
    limit: number,
  ): Promise<ActivityLogItem[]>
}

/**
 * Interface for Authentication Service (Business Logic Layer)
 */
export interface IAuthService {
  /**
   * Authenticates a user and returns a token
   */
  login(
    data: LoginDto,
    ipAddress?: string,
  ): Promise<
    AuthResponseDto & { accessToken: string; refreshToken: string; refreshExpiresAt: Date }
  >

  /**
   * Refreshes access token using refresh token
   */
  refresh(
    rawRefreshToken: string,
  ): Promise<
    RefreshResultDto & { accessToken: string; refreshToken: string; refreshExpiresAt: Date }
  >

  /**
   * Gets the currently authenticated user's information
   */
  getMe(empId: string): Promise<AuthResponseDto["employee"]>

  /**
   * Processes a logout for a user
   */
  logout(empId: string, rawRefreshToken?: string, ipAddress?: string): Promise<LogoutResponseDto>

  /**
   * Processes a forgot password request
   */
  forgotPassword(data: ForgotPasswordDto): Promise<GenericAuthResponseDto>

  /**
   * Validates a password reset token
   */
  validateResetToken(data: ValidateResetTokenDto): Promise<TokenValidationResponseDto>

  /**
   * Resets a user's password using a token
   */
  resetPassword(data: ResetPasswordDto): Promise<GenericAuthResponseDto>

  /**
   * Changes a user's password (requires current password)
   */
  changePassword(empId: string, data: ChangePasswordDto): Promise<GenericAuthResponseDto>

  /**
   * Gets activity logs
   */
  getActivityLogs(query: ActivityLogQuery): Promise<PaginatedActivityLogsDto>

  /**
   * Gets activity logs of current user
   */
  getMyActivityLogs(empId: string, query: ActivityLogQuery): Promise<PaginatedActivityLogsDto>

  /**
   * Gets activity log detail
   */
  getActivityLogDetail(id: string): Promise<ActivityLogItem | null>

  /**
   * Gets activity log detail for current user only
   */
  getMyActivityLogDetail(empId: string, id: string): Promise<ActivityLogItem | null>

  /**
   * Gets security dashboard summary
   */
  getSecuritySummary(timeRange?: SecurityTimeRange): Promise<SecuritySummaryDto>

  /**
   * Gets locked accounts
   */
  getLockedAccounts(): Promise<LockedAccountItem[]>

  /**
   * Unlocks an account
   */
  unlockAccount(empId: string, actorId: string, ipAddress?: string): Promise<void>
}
