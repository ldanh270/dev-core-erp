import {
  SPENT_TIME_ACTIVITIES,
  SPENT_TIME_STATUSES,
  SPENT_TIME_WORK_TIME_TYPES,
} from "@/configs/entities/project.config.ts"

/**
 * Type representing the activity of a spent time log (e.g. develop, design, test, manage)
 */
export type SpentTimeActivity = (typeof SPENT_TIME_ACTIVITIES)[number]

/**
 * Type representing the work time type of a spent time log (e.g. working_day, overtime)
 */
export type SpentTimeWorkTimeType = (typeof SPENT_TIME_WORK_TIME_TYPES)[number]

/** pending → lead review | approved → payroll | rejected → excluded from totals */
export type SpentTimeStatus = (typeof SPENT_TIME_STATUSES)[number]

/**
 * Domain model representing a SpentTime log associated with a Task and Employee
 */
export interface SpentTime {
  id: string
  taskId: string
  employeeId: string
  date: Date
  hours: number
  comment: string | null
  activity: SpentTimeActivity
  workTimeType: SpentTimeWorkTimeType
  status: SpentTimeStatus
  approvedById: string | null
  approvedAt: Date | null
  rejectionReason: string | null
  createdAt: Date
  updatedAt: Date
  task?: {
    id: string
    title: string
    projectId: string
    estimatedTime?: number | null
    project?: {
      id: string
      name: string
    }
  }
  employee?: {
    id: string
    fullName: string
    email: string
  }
  approvedBy?: {
    id: string
    fullName: string
  } | null
}

/**
 * Data Transfer Object for creating a SpentTime log
 */
export interface CreateSpentTimeDto {
  taskId: string
  employeeId?: string
  date: Date | string
  hours: number
  comment?: string | null
  activity: SpentTimeActivity
  workTimeType?: SpentTimeWorkTimeType
}

/**
 * Data Transfer Object for updating a SpentTime log
 */
export interface UpdateSpentTimeDto {
  date?: Date | string
  hours?: number
  comment?: string | null
  activity?: SpentTimeActivity
  workTimeType?: SpentTimeWorkTimeType
}

/**
 * Query filters for fetching SpentTime logs
 */
export interface SpentTimeQuery {
  taskId?: string
  employeeId?: string
  projectId?: string
  status?: SpentTimeStatus
  startDate?: string
  endDate?: string
}

/** Flat row for PayrollService: approved hours × member hourlyRate × OT multiplier per project. */
export interface ApprovedSpentTimePayrollRow {
  id: string
  employeeId: string
  projectId: string
  hours: number
  workTimeType: SpentTimeWorkTimeType
  hourlyRate: number
}

/**
 * Repository interface for managing SpentTime database transactions
 */
export interface ISpentTimeRepository {
  findById(id: string): Promise<SpentTime | null>
  list(query: SpentTimeQuery): Promise<SpentTime[]>
  create(data: CreateSpentTimeDto): Promise<SpentTime>
  update(id: string, data: UpdateSpentTimeDto): Promise<SpentTime | null>
  delete(id: string): Promise<boolean>
  sumTaskHours(taskId: string, excludeId?: string): Promise<number>
  sumHoursByTaskIds?(taskIds: string[]): Promise<Map<string, number>>
  approve(id: string, approverId: string): Promise<SpentTime | null>
  reject(id: string, approverId: string, reason: string): Promise<SpentTime | null>
  listApprovedForPayroll(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ApprovedSpentTimePayrollRow[]>
  listApprovedForPayrollByEmployees?(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, ApprovedSpentTimePayrollRow[]>>
}

/**
 * Service interface implementing SpentTime business logic and access checks
 */
export interface ISpentTimeService {
  getSpentTime(id: string, userId: string): Promise<SpentTime | null>
  listSpentTimes(query: SpentTimeQuery, userId: string): Promise<SpentTime[]>
  createSpentTime(data: CreateSpentTimeDto, userId: string): Promise<SpentTime>
  updateSpentTime(id: string, data: UpdateSpentTimeDto, userId: string): Promise<SpentTime | null>
  deleteSpentTime(id: string, userId: string): Promise<boolean>
  approveSpentTime(id: string, userId: string): Promise<SpentTime>
  rejectSpentTime(id: string, reason: string, userId: string): Promise<SpentTime>
}
