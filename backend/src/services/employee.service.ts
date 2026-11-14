import {
  EMPLOYEE_STATUS,
  EMPLOYEE_TYPE,
  WORK_SCHEDULE_TYPE,
} from "@/configs/entities/employee.config.ts"
import { DB_ERROR_CODES } from "@/configs/system/db.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  AppRole,
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  EmployeeStatus,
  IEmployeeRepository,
  IEmployeeService,
  PaginatedEmployeesDto,
  UpdateEmployeeDto,
} from "@/types"
import { IAuthRepository } from "@/types/auth.types.ts"
import type { EmployeeType, WorkScheduleType } from "@/types/employee.types.ts"
import { EmailUtil } from "@/utils/email.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { auditService } from "./audit.service.ts"
import { authorizationService } from "./authorization.service.ts"

type ScheduleFields = {
  employeeType?: EmployeeType
  workScheduleType?: WorkScheduleType
}

/** Legacy employeeType=part_time maps to workScheduleType; explicit FT clears legacy PT category. */
function normalizeScheduleFields<T extends ScheduleFields>(data: T): T {
  let next = { ...data }

  if (next.employeeType === EMPLOYEE_TYPE.PART_TIME) {
    next = {
      ...next,
      employeeType: EMPLOYEE_TYPE.FULL_TIME,
      workScheduleType: WORK_SCHEDULE_TYPE.PART_TIME,
    }
  }

  // workScheduleType=full_time alone must not leave employeeType stuck on legacy part_time.
  if (next.workScheduleType === WORK_SCHEDULE_TYPE.FULL_TIME) {
    next = {
      ...next,
      employeeType:
        next.employeeType === EMPLOYEE_TYPE.PART_TIME
          ? EMPLOYEE_TYPE.FULL_TIME
          : (next.employeeType ?? EMPLOYEE_TYPE.FULL_TIME),
    }
  }

  return next
}

/**
 * Service for managing employee-related operations.
 */
export class EmployeeService implements IEmployeeService {
  /**
   * Creates a new EmployeeService instance.
   * @param repository - The employee repository implementation.
   * @param authRepository - The authentication repository for audit logging.
   */
  constructor(
    private repository: IEmployeeRepository,
    private authRepository?: IAuthRepository,
  ) {}

  /**
   * Lists employees with pagination and filtering based on the provided query.
   * @param query - The list query parameters.
   * @returns A paginated result of employees.
   */
  async listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto> {
    return this.repository.listEmployeesPaginated(query)
  }

  /**
   * Fetches a single employee by their ID.
   * @param id - The employee ID.
   * @returns The employee record or null if not found.
   * @throws {AppError} If the employee is not found.
   */
  async getEmployee(id: string): Promise<Employee | null> {
    const employee = await this.repository.findById(id)
    if (!employee) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return employee
  }

  /**
   * Creates a new employee record and hashes their password.
   * @param data - The employee data including a plaintext password.
   * @returns The created employee record.
   * @throws {AppError} If password is missing or if a unique constraint is violated.
   */
  async createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee> {
    if (!data.password) {
      throw new AppError(
        "Password is required to create employee",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    const passwordHash = await HashUtil.hash(data.password)

    let initialRole
    if (data.role) {
      const initialRoleName = data.role.trim().toLowerCase()
      initialRole = await prisma.appRole.findFirst({
        where: { name: initialRoleName, deletedAt: null, isActive: true },
        select: { id: true },
      })
    } else {
      initialRole = await prisma.appRole.findFirst({
        where: { isDefault: true, deletedAt: null, isActive: true },
        select: { id: true },
      })
      if (!initialRole) {
        // Fallback safety to the "employee" role name if no default role is flagged
        initialRole = await prisma.appRole.findFirst({
          where: { name: "employee", deletedAt: null, isActive: true },
          select: { id: true },
        })
      }
    }

    if (!initialRole) {
      throw new AppError("Role not found or inactive", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // Remove password from data before passing to repo
    const { password, role, ...repoData } = data

    // Keep denormalized position string in sync when client sends positionId (dynamic positions).
    let positionName = data.position
    if (repoData.positionId) {
      const posRecord = await prisma.position.findUnique({
        where: { id: repoData.positionId },
      })
      if (posRecord) {
        positionName = posRecord.name
      }
    }

    try {
      // Coerce legacy employeeType=part_time into workScheduleType before persisting.
      const created = await this.repository.createEmployee({
        ...normalizeScheduleFields(repoData),
        position: positionName,
        passwordHash,
        roleId: initialRole.id,
      })

      // Send email containing credentials
      try {
        await EmailUtil.sendNewEmployeeCredentialsEmail(
          created.email,
          created.username,
          data.password,
        )
      } catch (emailError) {
        console.error("Failed to send credentials email to new employee:", emailError)
        if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
          throw emailError
        }
      }

      return created
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (DB_ERROR_CODES.UNIQUE_CONSTRAINT as readonly string[]).includes(
          (error as { code: string }).code,
        )
      ) {
        throw new AppError(
          "Username, email, phone, or national ID already exists",
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
        )
      }
      throw error
    }
  }

  /**
   * Updates an existing employee's information.
   * @param id - The employee ID.
   * @param data - The updated employee data.
   * @param actorId - The ID of the employee performing the update.
   * @param ipAddress - The IP address from which the update is performed.
   * @returns The updated employee record or null.
   */
  async updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null> {
    // Check if exists and get current data for comparison
    const currentEmployee = await this.getEmployee(id)
    if (!currentEmployee) return null

    let passwordHash: string | undefined
    if (data.password) {
      passwordHash = await HashUtil.hash(data.password)
    }

    // Remove password from data
    const { password, ...updateData } = data

    // Same normalization on update so old API clients sending employeeType=part_time still work.
    // Resolve position name from positionId when dynamic position FK is provided.
    let positionName = updateData.position
    if (updateData.positionId !== undefined) {
      if (updateData.positionId === null) {
        positionName = null
      } else {
        const posRecord = await prisma.position.findUnique({
          where: { id: updateData.positionId },
        })
        if (posRecord) {
          positionName = posRecord.name
        }
      }
    }

    const updated = await this.repository.updateEmployee(id, {
      ...normalizeScheduleFields(updateData),
      position: positionName,
      passwordHash,
    })

    if (updated) {
      await authorizationService.invalidateUserCache(id)
    }

    return updated
  }

  /**
   * Updates an employee's status (e.g., active, inactive).
   * @param id - The employee ID.
   * @param status - The new status.
   * @param actorId - The ID of the employee performing the update.
   * @param ipAddress - The IP address from which the update is performed.
   * @returns The updated employee record or null.
   */
  async updateStatus(
    id: string,
    status: EmployeeStatus,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null> {
    const currentEmployee = await this.getEmployee(id)
    if (!currentEmployee) return null

    const result = await prisma.$transaction(async (tx) => {
      // Acquire lock
      await tx.$executeRaw`
        INSERT INTO admin_state_lock (id) VALUES (1) ON CONFLICT (id) DO NOTHING
      `
      await tx.$executeRaw`
        SELECT id FROM admin_state_lock WHERE id = 1 FOR UPDATE
      `

      // Update status
      const updated = await tx.employee.update({
        where: { id },
        data: { status },
      })

      // Check active admins remaining
      const adminCount = await this.repository.countActiveAdmins(tx)
      if (adminCount === 0) {
        throw new AppError("CANNOT_REMOVE_LAST_ADMIN", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
      }

      return updated
    })

    if (result) {
      await authorizationService.invalidateUserCache(id)
      if (
        status === EMPLOYEE_STATUS.INACTIVE &&
        currentEmployee.status !== EMPLOYEE_STATUS.INACTIVE
      ) {
        await auditService.log({
          actorId,
          targetEmployeeId: id,
          action: "EMPLOYEE_DEACTIVATED",
          oldValue: { status: currentEmployee.status },
          newValue: { status },
        })
      }
    }
    return this.repository.findById(id)
  }

  /**
   * Deletes an employee from the system.
   * @param id - The employee ID.
   * @returns True if deletion was successful.
   */
  async deleteEmployee(id: string, actorId?: string): Promise<boolean> {
    // Check if exists
    const record = await this.getEmployee(id)
    if (!record) return false

    const success = await prisma.$transaction(async (tx) => {
      // Acquire lock
      await tx.$executeRaw`
        INSERT INTO admin_state_lock (id) VALUES (1) ON CONFLICT (id) DO NOTHING
      `
      await tx.$executeRaw`
        SELECT id FROM admin_state_lock WHERE id = 1 FOR UPDATE
      `

      const record = await tx.employee.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      })
      if (!record) return false

      await tx.employee.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: EMPLOYEE_STATUS.TERMINATED,
        },
      })

      // Check active admins remaining
      const adminCount = await this.repository.countActiveAdmins(tx)
      if (adminCount === 0) {
        throw new AppError("CANNOT_REMOVE_LAST_ADMIN", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
      }

      return true
    })

    if (success) {
      await authorizationService.invalidateUserCache(id)
      await auditService.log({
        actorId,
        targetEmployeeId: id,
        action: "EMPLOYEE_DELETED",
      })
    }
    return success
  }

  /**
   * Returns all currently assigned application roles for a specific employee.
   * Throws when the target employee does not exist.
   */
  async getEmployeeRoles(employeeId: string): Promise<AppRole[]> {
    const emp = await this.repository.findById(employeeId)
    if (!emp) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    return this.repository.findRolesByEmployeeId(employeeId)
  }

  /**
   * Assigns an active role to an employee and invalidates the authorization cache.
   * Audit data is recorded only when the assignment succeeds.
   */
  async assignRole(
    employeeId: string,
    roleId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }> {
    const emp = await this.repository.findById(employeeId)
    if (!emp) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    const role = await prisma.appRole.findFirst({
      where: { id: roleId, deletedAt: null, isActive: true },
    })
    if (!role) {
      throw new AppError("Role not found or inactive", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const res = await this.repository.assignRole(employeeId, roleId, actorId)
    if (res.success) {
      await authorizationService.invalidateUserCache(employeeId)
      await auditService.log({
        actorId,
        targetEmployeeId: employeeId,
        targetRoleId: roleId,
        action: "ROLE_ASSIGNED",
        newValue: { roleId },
      })
    }
    return res
  }

  /**
   * Revokes one role from an employee while protecting the last active admin.
   * The change is executed inside a transaction to keep role state consistent.
   */
  async revokeRole(employeeId: string, roleId: string, actorId?: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      // Acquire lock
      await tx.$executeRaw`
        INSERT INTO admin_state_lock (id) VALUES (1) ON CONFLICT (id) DO NOTHING
      `
      await tx.$executeRaw`
        SELECT id FROM admin_state_lock WHERE id = 1 FOR UPDATE
      `

      // Check if the role is currently assigned
      const employeeRoles = await tx.employeeRole.findMany({
        where: { employeeId },
      })
      const hasRole = employeeRoles.some((er) => er.roleId === roleId)
      if (!hasRole) {
        return false
      }

      // Delete the mapping
      await tx.employeeRole.delete({
        where: {
          employeeId_roleId: {
            employeeId,
            roleId,
          },
        },
      })

      // Check active admins remaining
      const adminCount = await this.repository.countActiveAdmins(tx)
      if (adminCount === 0) {
        throw new AppError("CANNOT_REMOVE_LAST_ADMIN", HttpStatusCode.CONFLICT, ErrorLayer.SERVICE)
      }

      await authorizationService.invalidateUserCache(employeeId)
      await auditService.log({
        actorId,
        targetEmployeeId: employeeId,
        targetRoleId: roleId,
        action: "ROLE_REVOKED",
        oldValue: { roleId },
      })
      return true
    })
  }

  /**
   * Replaces the full role set for an employee using optimistic version checks.
   * Cache invalidation and audit logging run after the repository update succeeds.
   */
  async updateRoles(
    employeeId: string,
    roleIds: string[],
    version: number,
    actorId?: string,
  ): Promise<void> {
    const emp = await this.repository.findById(employeeId)
    if (!emp) {
      throw new AppError("Employee not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    if (roleIds.length > 0) {
      const roles = await prisma.appRole.findMany({
        where: {
          id: { in: roleIds },
          deletedAt: null,
          isActive: true,
        },
      })
      if (roles.length !== roleIds.length) {
        throw new AppError(
          "One or more roles not found or inactive",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        )
      }
    }

    const oldRoles = await this.repository.findRolesByEmployeeId(employeeId)
    const oldRoleIds = oldRoles.map((r) => r.id)

    await this.repository.updateRoles(employeeId, roleIds, version, actorId)
    await authorizationService.invalidateUserCache(employeeId)

    await auditService.log({
      actorId,
      targetEmployeeId: employeeId,
      action: "ROLE_REPLACED",
      oldValue: { roleIds: oldRoleIds },
      newValue: { roleIds },
    })
  }

  /**
   * Returns a flat list of employees who hold approver-eligible roles.
   * Used to populate the "Người duyệt đơn" dropdown in the application form.
   * @returns List of approver employees with minimal fields.
   */
  async listApprovers(): Promise<
    { id: string; fullName: string; position: string | null; role: string }[]
  > {
    const approvers = await prisma.employee.findMany({
      where: {
        status: EMPLOYEE_STATUS.ACTIVE,
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: "application.approve",
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        employeeRoles: {
          where: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: "application.approve",
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ fullName: "asc" }],
    })

    return approvers.flatMap((approver) => {
      const primaryRole = approver.employeeRoles[0]?.role.name
      if (!primaryRole) {
        return []
      }

      return [
        {
          id: approver.id,
          fullName: approver.fullName,
          position: approver.position,
          role: primaryRole,
        },
      ]
    })
  }
}
