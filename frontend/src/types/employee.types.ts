import type {
  IEmployeeStatus,
  IEmployeeType,
  IWorkScheduleType,
} from "@/config/entities/employee.config"

export type EmployeeStatus = IEmployeeStatus
export type EmployeeType = IEmployeeType
export type WorkScheduleType = IWorkScheduleType // full_time | part_time — drives scheduling & payroll
export type EmployeeRole = string

export interface Employee {
  id: string
  fullName: string
  username: string
  email: string
  role?: EmployeeRole | string | null
  roles?: string[]
  phone: string | null
  position: string | null
  positionId?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  positionRel?: any
  employeeType: EmployeeType
  workScheduleType: WorkScheduleType // separates contract category from PT schedule model
  status: EmployeeStatus
  dateOfBirth: string | null // ISO string
  nationalId: string | null
  address: string | null
  startDate: string | null
  endDate: string | null
  avatar: { url: string | null; id: string | null } | null
  version?: number
  createdAt: string
  updatedAt: string
  lockedUntil?: string | null
}

export interface PaginatedEmployees {
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

export interface EmployeeListQuery {
  page?: number
  limit?: number
  search?: string
  status?: EmployeeStatus | "locked"
  role?: EmployeeRole
  roleId?: string
  type?: EmployeeType
  workSchedule?: WorkScheduleType // list filter for part-time tab
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateEmployeeDto {
  fullName: string
  email: string
  username: string
  password?: string
  role?: EmployeeRole
  phone?: string
  position?: string
  positionId?: string
  employeeType?: EmployeeType
  workScheduleType?: WorkScheduleType
  status?: EmployeeStatus
  dateOfBirth?: string
  nationalId?: string
  address?: string
  startDate?: string
}

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
  dateOfBirth?: string | null
  nationalId?: string | null
  address?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateStatusDto {
  status: EmployeeStatus
}
