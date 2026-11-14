/* eslint-disable @typescript-eslint/no-explicit-any */
import { ACTIVITY_LOG_TTL, PASSWORD_RESET_STATUS } from "@/configs/auth/auth.config.ts"
import {
  ActivityLogItem,
  ActivityLogQuery,
  AuthEmployeeDocument,
  IAuthRepository,
  LockedAccountItem,
  PaginatedActivityLogsDto,
  RefreshTokenDocument,
} from "@/types/auth.types.ts"

import {
  ActivityAction,
  ActivityCategory,
  PasswordResetStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Prisma implementation of the Authentication Repository
 * Follows the Repository Pattern to decouple business logic from the database
 */
export class PrismaAuthRepository extends BaseRepository implements IAuthRepository {
  /**
   * Initializes auth repository with Prisma client.
   */
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Finds an employee by ID
   */
  async findById(id: string): Promise<AuthEmployeeDocument | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
      lastLoginAt: (employee as { lastLoginAt?: Date | null }).lastLoginAt,
    }
  }

  /**
   * Finds an employee by identifier (username or email)
   * Normalizes input by trimming and converting to lowercase
   */
  async findAuthByIdentifier(identifier: string): Promise<AuthEmployeeDocument | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
        deletedAt: null,
      },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
      lastLoginAt: (employee as { lastLoginAt?: Date | null }).lastLoginAt,
    }
  }

  /**
   * Finds an employee by email
   */
  async findAuthByEmail(email: string): Promise<AuthEmployeeDocument | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const employee = await this.prisma.employee.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    })

    if (!employee) return null

    return {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      fullName: employee.fullName,
      passwordHash: employee.passwordHash,
      status: employee.status,
      lockedUntil: employee.lockedUntil,
      failedLoginCount: employee.failedLoginCount,
      lastLoginAt: (employee as { lastLoginAt?: Date | null }).lastLoginAt,
    }
  }

  /**
   * Finds a pending password reset request by token
   */
  async findResetRequestByToken(token: string): Promise<unknown | null> {
    return this.prisma.passwordResetRequest.findFirst({
      where: {
        token,
        status: PasswordResetStatus.pending,
      },
    })
  }

  /**
   * Finds a pending password reset request by employee ID
   */
  async findPendingRequestByEmployeeId(employeeId: string): Promise<unknown | null> {
    return this.prisma.passwordResetRequest.findFirst({
      where: {
        employeeId,
        status: PasswordResetStatus.pending,
      },
    })
  }

  /**
   * Invalidates all pending password reset requests for a user
   */
  async invalidateAllPendingRequests(employeeId: string): Promise<void> {
    await this.prisma.passwordResetRequest.updateMany({
      where: {
        employeeId,
        status: PasswordResetStatus.pending,
      },
      data: {
        status: PasswordResetStatus.expired,
      },
    })
  }

  /**
   * Creates a new password reset request
   */
  async createResetRequest(data: {
    employeeId: string
    token: string
    expiresAt: Date
  }): Promise<void> {
    await this.prisma.passwordResetRequest.create({
      data: {
        employeeId: data.employeeId,
        token: data.token,
        status: PasswordResetStatus.pending,
        expiresAt: data.expiresAt,
      },
    })
  }

  /**
   * Updates the status of a password reset request
   */
  async updateResetRequestStatus(requestId: string, status: string): Promise<void> {
    let dbStatus: PasswordResetStatus
    if (status === PASSWORD_RESET_STATUS.USED) dbStatus = PasswordResetStatus.used
    else if (status === PASSWORD_RESET_STATUS.EXPIRED) dbStatus = PasswordResetStatus.expired
    else if (status === PASSWORD_RESET_STATUS.APPROVED) dbStatus = PasswordResetStatus.approved
    else if (status === PASSWORD_RESET_STATUS.REJECTED) dbStatus = PasswordResetStatus.rejected
    else dbStatus = PasswordResetStatus.pending

    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: dbStatus },
    })
  }

  /**
   * Creates a new refresh token
   */
  async createRefreshToken(data: {
    employeeId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        employeeId: data.employeeId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    })
  }

  /**
   * Finds a refresh token by hash
   */
  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenDocument | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    })
  }

  /**
   * Revokes a specific refresh token
   */
  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  /**
   * Revokes all refresh tokens for a user
   */
  async revokeAllUserRefreshTokens(employeeId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        employeeId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  /**
   * Updates employee authentication fields
   */
  async updateAuthEmployee(empId: string, data: Partial<AuthEmployeeDocument>): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: {
        failedLoginCount: data.failedLoginCount,
        lockedUntil: data.lockedUntil,
        passwordHash: data.passwordHash,
        lastLoginAt: data.lastLoginAt,
      } as any,
    })
  }

  /**
   * Records an authentication-related activity in the ActivityLog collection
   */
  async logActivity(data: {
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
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void> {
    const { empId, timestamp, actionType, ipAddress, details, category } = data

    await this.prisma.activityLog.create({
      data: {
        employeeId: empId,
        category: category as ActivityCategory,
        actionType: actionType as ActivityAction,
        ipAddress,
        createdAt: timestamp,
        expiresAt: new Date(timestamp.getTime() + ACTIVITY_LOG_TTL), // retention by config
        details: details ? JSON.parse(details) : undefined,
      },
    })
  }

  /**
   * Lists activity logs with pagination and filters
   */
  async listActivityLogs(query: ActivityLogQuery): Promise<PaginatedActivityLogsDto> {
    const { page = 1, limit = 20, employeeId, category, actionType, fromDate, toDate } = query

    const skip = (page - 1) * limit
    const where: Prisma.ActivityLogWhereInput = {}

    if (employeeId) where.employeeId = employeeId
    if (category && Object.values(ActivityCategory).includes(category as ActivityCategory)) {
      where.category = category as ActivityCategory
    }
    if (actionType && Object.values(ActivityAction).includes(actionType as ActivityAction)) {
      where.actionType = actionType as ActivityAction
    }
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = fromDate
      if (toDate) where.createdAt.lte = toDate
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ])

    const data: ActivityLogItem[] = logs.map((log) => ({
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employee?.fullName,
      category: log.category,
      actionType: log.actionType,
      ipAddress: log.ipAddress,
      details: log.details as any,
      createdAt: log.createdAt,
    }))

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Gets a single activity log by ID
   */
  async getActivityLogById(id: string): Promise<ActivityLogItem | null> {
    const log = await this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            fullName: true,
          },
        },
      },
    })

    if (!log) return null

    return {
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employee?.fullName,
      category: log.category,
      actionType: log.actionType,
      ipAddress: log.ipAddress,
      details: log.details as any,
      createdAt: log.createdAt,
    }
  }

  /**
   * Retrieves a single activity log by ID for a specific employee.
   */
  async getActivityLogByIdForEmployee(
    id: string,
    employeeId: string,
  ): Promise<ActivityLogItem | null> {
    const log = await this.prisma.activityLog.findFirst({
      where: {
        id,
        employeeId,
      },
      include: {
        employee: {
          select: {
            fullName: true,
          },
        },
      },
    })

    if (!log) return null

    return {
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employee?.fullName,
      category: log.category,
      actionType: log.actionType,
      ipAddress: log.ipAddress,
      details: log.details as any,
      createdAt: log.createdAt,
    }
  }

  /**
   * Gets all currently locked employees
   */
  async getLockedEmployees(): Promise<LockedAccountItem[]> {
    const now = new Date()
    const employees = await this.prisma.employee.findMany({
      where: {
        OR: [{ lockedUntil: { gt: now } }, { failedLoginCount: { gte: 5 } }],
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        failedLoginCount: true,
        lockedUntil: true,
      },
    })

    return employees.map((emp) => ({
      employeeId: emp.id,
      employeeName: emp.fullName,
      email: emp.email,
      failedLoginCount: emp.failedLoginCount,
      lockedUntil: emp.lockedUntil,
    }))
  }

  /**
   * Unlocks an employee account
   */
  async unlockEmployee(empId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })
  }

  /**
   * Counts logs by type within a time range
   */
  async countActivityLogs(
    category: "auth" | "role" | "security",
    actionType: string,
    timeRange: any = "today",
  ): Promise<number> {
    let gteDate: Date | undefined

    if (timeRange === "today") {
      gteDate = new Date()
      gteDate.setHours(0, 0, 0, 0)
    } else if (timeRange === "7days") {
      gteDate = new Date()
      gteDate.setDate(gteDate.getDate() - 7)
    } else if (timeRange === "30days") {
      gteDate = new Date()
      gteDate.setDate(gteDate.getDate() - 30)
    }

    return this.prisma.activityLog.count({
      where: {
        category: category as ActivityCategory,
        actionType: actionType as ActivityAction,
        ...(gteDate ? { createdAt: { gte: gteDate } } : {}),
      },
    })
  }

  /**
   * Gets recent activity logs by category
   */
  async getRecentLogsByCategory(
    category: "auth" | "role" | "security",
    limit: number,
  ): Promise<ActivityLogItem[]> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        category: category as ActivityCategory,
      },
      include: {
        employee: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return logs.map((log) => ({
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employee?.fullName,
      category: log.category,
      actionType: log.actionType,
      ipAddress: log.ipAddress,
      details: log.details as any,
      createdAt: log.createdAt,
    }))
  }
}
