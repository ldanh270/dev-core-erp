import {
  IEmployeeStatus,
  IEmployeeType,
  IWorkScheduleType,
} from "@/configs/entities/employee.config.ts"
import { SORT_ORDER } from "@/configs/system/db.config.ts"

import { Prisma } from "@prisma/client"

import { AppRole } from "./role.types.ts"

/**
 * Type representing valid Employee Status values.
 */
export type EmployeeStatus = IEmployeeStatus

/**
 * Type representing valid Employee Type values.
 */
export type EmployeeType = IEmployeeType

/**
 * Type representing full-time vs part-time work schedule.
 */
export type WorkScheduleType = IWorkScheduleType

/**
 * Domain interface representing an Employee object.
 */
export interface Employee {
  /** Unique ID of the employee */
  id: string
  /** Full name of the employee */
  fullName: string
  /** Login username of the employee */
  username: string
  /** Email address of the employee */
  email: string
  /** Contact phone number (nullable) */
  phone: string | null
  /** Job position / title (nullable, denormalized from Position) */
  position: string | null
  /** FK to dynamic Position catalog */
  positionId?: string | null
  positionRel?: unknown
  /** Employment category (e.g. official, intern, contractor) */
  employeeType: EmployeeType
  /** Hours-based schedule — drives PT availability, Spent Time payroll, and GPS rules (not employeeType). */
  workScheduleType: WorkScheduleType
  /** Active status of the employee */
  status: EmployeeStatus
  /** Date of birth (nullable) */
  dateOfBirth: Date | null
  /** National Identification Number (nullable) */
  nationalId: string | null
  /** Resident address (nullable) */
  address: string | null
  /** Employment start date (nullable) */
  startDate: Date | null
  /** Employment termination date (nullable) */
  endDate: Date | null
  /** Legacy compatibility primary role name derived from dynamic assignments */
  role?: string | null
  /** Active dynamic role names assigned to the employee */
  roles?: string[]
  /** Avatar object containing URL and ID (nullable) */
  avatar: { url: string | null; id: string | null } | null
  /** Record creation timestamp */
  createdAt: Date
  /** Record last modification timestamp */
  updatedAt: Date
  /** Version number for optimistic locking */
  version: number
  /** Version number for authorization caching */
  authorizationVersion: number
  /** Temporary account lock expiration timestamp */
  lockedUntil?: Date | null
}

/**
 * DTO for creating a new Employee.
 */
export interface CreateEmployeeDto {
  fullName: string
  email: string
  username: string
  role?: string
  roleId?: string
  passwordHash?: string
  phone?: string | null
  position?: string | null
  positionId?: string | null
  employeeType?: EmployeeType
  workScheduleType?: WorkScheduleType
  status?: EmployeeStatus
  dateOfBirth?: Date | string | null
  nationalId?: string | null
  address?: string | null
  startDate?: Date | string | null
}

/**
 * DTO for updating an existing Employee.
 */
export interface UpdateEmployeeDto {
  fullName?: string
  email?: string
  username?: string
  password?: string
  phone?: string | null
  position?: string | null
  positionId?: string | null
  employeeType?: EmployeeType
  workScheduleType?: WorkScheduleType
  status?: EmployeeStatus
  dateOfBirth?: Date | string | null
  nationalId?: string | null
  address?: string | null
  startDate?: Date | string | null
  endDate?: Date | string | null
}

/**
 * Query criteria interface for retrieving filtered, paginated employees list.
 */
export interface EmployeeListQuery {
  /** Page number for pagination (starts at 1) */
  page?: number
  /** Limit of items per page */
  limit?: number
  /** Partial search string for names/emails */
  search?: string
  /** Status filter (includes locked accounts) */
  status?: EmployeeStatus | "locked"
  /** Employee type filter (employment category) */
  type?: EmployeeType
  /** Work schedule filter (full-time / part-time hours) */
  workSchedule?: WorkScheduleType
  /** Role ID filter */
  roleId?: string
  /** Column/property to sort by */
  sortBy?: string
  /** Sort order direction */
  sortOrder?: (typeof SORT_ORDER)[keyof typeof SORT_ORDER]
}

/**
 * DTO for a paginated list of employees.
 */
export interface PaginatedEmployeesDto {
  data: Employee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  stats: {
    total: number
    full_time: number
    part_time: number
    intern: number
    contractor: number
    locked: number
    terminated: number
  }
}

/**
 * Contract boundary for Employee database access operations.
 */
export interface IEmployeeRepository {
  /** Get paginated list of employees */
  listEmployeesPaginated(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  /** Lightweight list of active employees for payroll generation */
  listActiveForPayroll?(): Promise<
    Array<Pick<Employee, "id" | "employeeType" | "workScheduleType">>
  >
  /** Find single employee by ID */
  findById(id: string): Promise<Employee | null>
  /** Lightweight auth status check without role joins or PII */
  findAuthStatusById?(id: string): Promise<{ id: string; status: EmployeeStatus } | null>
  /** Create employee */
  createEmployee(data: CreateEmployeeDto & { passwordHash: string }): Promise<Employee>
  /** Update employee details */
  updateEmployee(
    id: string,
    data: Omit<UpdateEmployeeDto, "password"> & { passwordHash?: string },
  ): Promise<Employee | null>
  /** Update status of employee */
  updateStatus(id: string, status: EmployeeStatus): Promise<Employee | null>
  /** Soft delete employee */
  deleteEmployee(id: string): Promise<boolean>
  /** Find roles assigned to an employee */
  findRolesByEmployeeId(employeeId: string): Promise<AppRole[]>
  /** Assign a role to an employee (Idempotent) */
  assignRole(
    employeeId: string,
    roleId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }>
  /** Revoke a role from an employee (Idempotent) */
  revokeRole(employeeId: string, roleId: string): Promise<boolean>
  /** Bulk replace employee roles under optimistic concurrency control */
  updateRoles(
    employeeId: string,
    roleIds: string[],
    version: number,
    actorId?: string,
  ): Promise<void>
  /** Count active admin users in the system */
  countActiveAdmins(tx?: Prisma.TransactionClient): Promise<number>
}

/**
 * Contract boundary for Employee business logic operations.
 */
export interface IEmployeeService {
  /** Retrieve list of employees */
  listEmployees(query: EmployeeListQuery): Promise<PaginatedEmployeesDto>
  /** Retrieve single employee details */
  getEmployee(id: string): Promise<Employee | null>
  /** Register a new employee */
  createEmployee(data: CreateEmployeeDto & { password?: string }): Promise<Employee>
  /** Update existing employee info */
  updateEmployee(
    id: string,
    data: UpdateEmployeeDto,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null>
  /** Update employee status */
  updateStatus(
    id: string,
    status: EmployeeStatus,
    actorId?: string,
    ipAddress?: string,
  ): Promise<Employee | null>
  /** Remove employee record (soft delete) */
  deleteEmployee(id: string, actorId?: string): Promise<boolean>
  /** Retrieve list of approver-eligible employees for dropdown */
  listApprovers(): Promise<
    { id: string; fullName: string; position: string | null; role: string }[]
  >
  /** Find roles assigned to an employee */
  getEmployeeRoles(employeeId: string): Promise<AppRole[]>
  /** Assign a role to an employee */
  assignRole(
    employeeId: string,
    roleId: string,
    actorId?: string,
  ): Promise<{ success: boolean; created: boolean }>
  /** Revoke a role from an employee */
  revokeRole(employeeId: string, roleId: string, actorId?: string): Promise<boolean>
  /** Bulk replace employee roles with optimistic lock and self-demotion verification */
  updateRoles(
    employeeId: string,
    roleIds: string[],
    version: number,
    actorId?: string,
  ): Promise<void>
}

export interface AuthorizationContext {
  isDynamicAdmin: boolean
  roles: Set<string>
  permissions: Set<string>
}

export interface IAuthorizationService {
  getAuthorizationContext(
    employeeId: string,
    options?: { skipCache?: boolean },
  ): Promise<AuthorizationContext>
  invalidateUserCache(employeeId: string): Promise<void>
  invalidateGlobalVersion(): Promise<void>
  invalidateRoleCache(roleId: string): Promise<void>
  invalidatePermissionCache(permissionId: string): Promise<void>
  incrementMetric(metric: string): void
  getMetrics(): Record<string, number>
  logDecision(employeeId: string, permission: string, allowed: boolean, source: string): void
  getGlobalVersion(): Promise<number>
}
