import {
  IApplicationStatus,
  IApplicationType,
  IAttendanceMatrixView,
  IAttendanceStatus,
  ICheckInVarianceStatus,
  IHolidayType,
  ILeaveType,
  IRegimeType,
} from "@/configs/entities/attendance.config.ts"

import type {
  Application,
  ApplicationForgotCardDetail,
  ApplicationShiftSwapDetail,
  HolidayCalendar,
} from "@prisma/client"

export interface IApplicationEntity extends Application {
  shiftSwapDetail?: ApplicationShiftSwapDetail | null
  forgotCardDetail?: ApplicationForgotCardDetail | null
}

// Re-export for consumers that import from this module
export type {
  IApplicationStatus,
  IApplicationType,
  IAttendanceStatus,
  IHolidayType,
  ILeaveType,
  IRegimeType,
}

export interface IGpsScanDTO {
  lat: number
  lng: number
}

// ─── ATTENDANCE RECORD ────────────────────────────────────────
export interface ICheckInDTO {
  employeeId: string
  location: IGpsScanDTO
}

export interface ICheckOutDTO {
  employeeId: string
  location: IGpsScanDTO
}

export interface IAttendanceRecordQueryDTO {
  startDate?: string
  endDate?: string
  employeeId?: string
  /** Bulk filter — preferred over looping single employeeId for scoring. */
  employeeIds?: string[]
  status?: IAttendanceStatus
}

/** Filters and anchors a workforce matrix request to one calendar period. */
export interface IAttendanceMatrixQueryDTO {
  view: IAttendanceMatrixView
  anchor: string
  search?: string
}

/** One scheduled attendance occurrence inside a matrix day. */
export interface IAttendanceMatrixShiftDTO {
  id: string
  shiftName?: string
  scheduledStart?: number
  checkInAt?: string
  checkOutAt?: string
  checkInVarianceMinutes?: number
  status: ICheckInVarianceStatus
}

/** Attendance occurrences grouped by ISO calendar date. */
export interface IAttendanceMatrixDayDTO {
  date: string
  shifts: IAttendanceMatrixShiftDTO[]
}

/** Employee identity and day cells returned to the matrix UI. */
export interface IAttendanceMatrixEmployeeDTO {
  employeeId: string
  employeeCode: string
  fullName: string
  email?: string
  position?: string
  days: IAttendanceMatrixDayDTO[]
}

/** Minimal employee projection required to build empty matrix rows. */
export interface IAttendanceMatrixEmployeeProfileDTO {
  id: string
  username: string
  fullName: string
  email: string
  position: string | null
}

/** Complete workforce matrix response for one week or month. */
export interface IAttendanceMatrixDTO {
  view: IAttendanceMatrixView
  rangeStart: string
  rangeEnd: string
  employees: IAttendanceMatrixEmployeeDTO[]
}

// ─── APPLICATION DETAIL DTOs ──────────────────────────────────

export interface ILeaveDetailDTO {
  leaveType: ILeaveType
  regimeType: IRegimeType
  documentUrl?: string
}

export interface IOvertimeDetailDTO {
  employeeShiftId: string
}

export interface IWorkFromHomeDetailDTO {
  employeeShiftId: string
}

export interface IShiftSwapDetailDTO {
  employeeShiftId: string // EmployeeShift to swap away
  workingShiftId?: string // Target WorkingShift type (optional)
  swapWithEmployeeId?: string // Specific employee to swap with (optional)
  swapWithShiftId?: string // Specific EmployeeShift of that employee (optional)
}

export interface IBusinessTripDetailDTO {
  location: string
  purpose?: string
  budget?: number
}

export interface ILateEarlyDetailDTO {
  employeeShiftId: string
  durationMinutes: number
  isLate: boolean // true = late arrival, false = early leave
}

export interface IRegimeDetailDTO {
  regimeCategoryId: string
  lateMinutes?: number
  earlyMinutes?: number
  documentUrl?: string | null
}

export interface IForgotCardDetailDTO {
  employeeShiftId: string
  checkInAt?: string | Date | null
  checkOutAt?: string | Date | null
  documentUrl?: string | null
}

// ─── BASE APPLICATION FIELDS ──────────────────────────────────

interface IBaseApplicationDTO {
  employeeId: string
  startDate: string | Date
  endDate?: string | Date
  reason?: string
  note?: string
  assignedToId?: string
}

// ─── DISCRIMINATED UNION SUBMIT DTO ──────────────────────────

export type ISubmitApplicationDTO =
  | (IBaseApplicationDTO & { type: "leave"; detail: ILeaveDetailDTO })
  | (IBaseApplicationDTO & { type: "overtime"; detail: IOvertimeDetailDTO })
  | (IBaseApplicationDTO & { type: "work_from_home"; detail: IWorkFromHomeDetailDTO })
  | (IBaseApplicationDTO & { type: "shift_swap"; detail: IShiftSwapDetailDTO })
  | (IBaseApplicationDTO & { type: "business_trip"; detail: IBusinessTripDetailDTO })
  | (IBaseApplicationDTO & { type: "late_early"; detail: ILateEarlyDetailDTO })
  | (IBaseApplicationDTO & { type: "regime"; detail: IRegimeDetailDTO })
  | (IBaseApplicationDTO & { type: "resignation"; detail: Record<string, unknown> })
  | (IBaseApplicationDTO & { type: "forgot_card"; detail: IForgotCardDetailDTO })
  | (IBaseApplicationDTO & {
      type: "recruitment"
      detail: { positionId?: string; positionName: string; quantity: number; requirements?: string }
    })

export interface IApproveApplicationDTO {
  status: IApplicationStatus
}

// ─── QUERY DTOs ───────────────────────────────────────────────

export interface IListApplicationsQueryDTO {
  page?: number
  pageSize?: number
  type?: IApplicationType
  status?: IApplicationStatus
  employeeId?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface IApplicationListItemDTO {
  id: string
  employeeId: string
  type: Application["type"]
  status: Application["status"]
  createdAt: Date
  employee: { id: string; fullName: string }
  assignedTo: { id: string; fullName: string } | null
  approvedBy: { id: string; fullName: string } | null
}

export interface IApplicationStatusStatsDTO {
  pending: number
  approved: number
  rejected: number
  cancelled: number
  total: number
}

export interface IApplicationListResultDTO {
  data: IApplicationListItemDTO[]
  total: number
  stats: IApplicationStatusStatsDTO
}

export interface IListHolidaysQueryDTO {
  startDate?: string | Date
  endDate?: string | Date
  year?: number
}

export interface ICreateHolidayDTO {
  name: string
  date?: string | Date
  startDate?: string | Date
  endDate?: string | Date
  type: IHolidayType
  scope?: "all" | "position" | "employees"
  positionId?: string
  employeeIds?: string[]
}

export interface IUpdateHolidayDTO {
  name?: string
  date?: string | Date
  type?: IHolidayType
}

export interface IHolidayCalendarDTO {
  id: string
  name: string
  date: Date
  type: IHolidayType
  scope: string
  positionId: string | null
  batchId: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  position: { id: string; name: string; code: string } | null
  assignees: Array<{
    employeeId: string
    employee: { id: string; fullName: string; email: string }
  }>
}

// ─── REPOSITORY INTERFACES ────────────────────────────────────
export interface IAttendanceMetricsDTO {
  status?: IAttendanceStatus
  lateMinutes?: number
  earlyLeaveMinutes?: number
  overtimeMinutes?: number
  totalWorkMinutes?: number
}

export interface IRealShiftDTO {
  id: string
  employeeId: string
  attendanceRecordId: string
  date: Date | string
  actualStartTime: number
  actualEndTime?: number | null
  isMatched: boolean
  isPaidLeave?: boolean
}

export interface IRealShiftUpsertDTO {
  actualEndTime?: number | null
  isMatched?: boolean
}

export interface IAttendanceShiftDTO {
  id?: string
  name?: string
  startTime: number
  endTime: number
  /** Optional unpaid break, represented as minutes from local midnight. */
  breakStartTime?: number | null
  breakEndTime?: number | null
  gracePeriodMinutes?: number | null
  gpsLat?: number | null
  gpsLng?: number | null
  gpsRadiusMeters?: number | null
  isActive?: boolean
}

export interface IAttendanceScheduleDayDTO {
  dayOfWeek: number
  weekIndex?: number
  shiftId?: string | null
  shift?: IAttendanceShiftDTO | null
}

export interface IAttendanceScheduleDTO {
  validFrom?: Date | string
  cycleWeeks?: number | null
  days?: IAttendanceScheduleDayDTO[]
  workingShiftId?: string | null
}

export interface IAttendanceEmployeeShiftDTO {
  id: string
  shiftId: string
  shift?: IAttendanceShiftDTO | null
}

export interface IAttendanceEmployeeDTO {
  fullName?: string | null
  email?: string | null
}

export interface IAttendanceRecordDTO {
  id: string
  employeeId: string
  employeeShiftId: string
  date: Date | string
  checkInAt?: Date | string | null
  checkInLat?: number | null
  checkInLng?: number | null
  checkOutAt?: Date | string | null
  checkOutLat?: number | null
  checkOutLng?: number | null
  status: IAttendanceStatus
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  totalWorkMinutes: number
  note?: string | null
  employee?: IAttendanceEmployeeDTO | null
  employeeShift?: IAttendanceEmployeeShiftDTO | null
  realShift?: IRealShiftDTO | null
}

/**
 * Repository for managing attendance records.
 */
export interface IAttendanceRepository {
  /** Records a check-in. */
  checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    employeeShiftId: string,
    metrics?: IAttendanceMetricsDTO,
  ): Promise<IAttendanceRecordDTO>
  /** Records a check-out. */
  checkOut(
    recordId: string,
    location: IGpsScanDTO,
    metrics?: IAttendanceMetricsDTO,
    realShift?: IRealShiftUpsertDTO,
  ): Promise<IAttendanceRecordDTO>
  /** Finds record by employee and date. */
  findByEmployeeAndDate(
    employeeId: string,
    date: string | Date,
  ): Promise<IAttendanceRecordDTO | null>
  /** Finds an open attendance record by employee and date. */
  findOpenByEmployeeAndDate?(
    employeeId: string,
    date: string | Date,
  ): Promise<IAttendanceRecordDTO | null>
  /** Queries records with filters. */
  queryRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]>
}

/**
 * Repository for managing applications (leave, OT, etc.).
 */
export interface IApplicationRepository {
  /** Submits a new application. */
  submit(data: ISubmitApplicationDTO): Promise<IApplicationEntity>
  /** Submits multiple applications in a transaction. */
  submitBulk(data: ISubmitApplicationDTO[]): Promise<IApplicationEntity[]>
  findById(id: string): Promise<IApplicationEntity | null>
  findByEmployee(
    employeeId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO>
  findAll(query: IListApplicationsQueryDTO): Promise<IApplicationListResultDTO>
  findApprovals(
    approverId: string,
    managedEmployeeIds: string[],
    isGlobalApprover: boolean,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO>
  cancel(id: string, employeeId: string): Promise<IApplicationEntity | null>
  /** Approves an application (sets status=approved). */
  approve(id: string, approvedBy: string): Promise<IApplicationEntity | null>
  /** Rejects an application with a mandatory reason. */
  reject(id: string, rejectedBy: string, rejectReason: string): Promise<IApplicationEntity | null>
  /** Partner confirms (agree) a shift_swap application (partner_pending → pending). */
  partnerConfirm(id: string, partnerId: string): Promise<IApplicationEntity | null>
  /** Partner rejects a shift_swap application (partner_pending → rejected). */
  partnerReject(
    id: string,
    partnerId: string,
    rejectReason: string,
  ): Promise<IApplicationEntity | null>
  checkLeaveOverlap(
    employeeId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeId?: string,
  ): Promise<boolean>
  findLeaveOverlappingEmployees?(
    employeeIds: string[],
    startDate: string | Date,
    endDate: string | Date,
  ): Promise<Set<string>>
  getUsedLeaveDays(employeeId: string, leaveType: ILeaveType, year: number): Promise<number>
}

/**
 * Repository for managing holiday information.
 */
export interface IHolidayRepository {
  /** Lists holiday records. */
  listHolidays(query?: IListHolidaysQueryDTO): Promise<IHolidayCalendarDTO[]>
  /** Creates holiday day rows for a date range + scope. */
  createHolidayRange(data: ICreateHolidayDTO, createdById: string): Promise<IHolidayCalendarDTO[]>
  /** Updates a holiday record. */
  updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<IHolidayCalendarDTO>
  /** Deletes a holiday record (and batch siblings when batchId set). */
  deleteHoliday(id: string, deleteBatch?: boolean): Promise<void>
  /** Checks if a specific date is a company-wide holiday. */
  checkIsHoliday(date: string | Date): Promise<boolean>
}

/**
 * Service for attendance operations.
 */
export interface IAttendanceService {
  /** Handles check-in process. */
  checkIn(
    employeeId: string,
    location: IGpsScanDTO,
    createdById: string,
  ): Promise<IAttendanceRecordDTO>
  /** Handles check-out process. */
  checkOut(employeeId: string, location: IGpsScanDTO): Promise<IAttendanceRecordDTO>
  /** Handles smart scan process. */
  scan(
    employeeId: string,
    location: IGpsScanDTO,
    createdById: string,
  ): Promise<IAttendanceRecordDTO>
  /** Queries attendance records. */
  getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<IAttendanceRecordDTO[]>
  getAttendanceMatrix(query: IAttendanceMatrixQueryDTO): Promise<IAttendanceMatrixDTO>
}

/**
 * Service for application processing.
 */
export interface IApplicationService {
  /** Submits an application. */
  submitApplication(data: ISubmitApplicationDTO): Promise<unknown>
  /** Submits multiple applications in bulk. */
  submitBulkApplications(data: ISubmitApplicationDTO[]): Promise<unknown[]>
  cancelApplication(id: string, requesterId: string): Promise<unknown>
  getApplicationById(id: string, requester?: { empId: string }): Promise<unknown>
  listApplications(query: IListApplicationsQueryDTO): Promise<IApplicationListResultDTO>
  getApprovalsList(
    approverId: string,
    query: IListApplicationsQueryDTO,
  ): Promise<IApplicationListResultDTO>
  getEmployeeApplications(
    employeeId: string,
    query: IListApplicationsQueryDTO,
    requester?: { empId: string },
  ): Promise<IApplicationListResultDTO>
  /** Approves a pending application. */
  approveApplication(id: string, processorId: string): Promise<unknown>
  /** Rejects a pending application with a mandatory reason. */
  rejectApplication(id: string, processorId: string, rejectReason: string): Promise<unknown>
  /** Partner confirms a shift swap (partner_pending → pending). */
  confirmSwapPartner(id: string, partnerId: string): Promise<unknown>
  /** Partner rejects a shift swap (partner_pending → rejected). */
  rejectSwapPartner(id: string, partnerId: string, rejectReason: string): Promise<unknown>
  /** @deprecated Use approveApplication / rejectApplication instead. */
  processApplication(
    id: string,
    status: IApplicationStatus,
    processorId: string,
  ): Promise<unknown | null>
}

/**
 * Service for holiday management.
 */
export interface IHolidayService {
  /** Lists holidays. */
  listHolidays(query?: IListHolidaysQueryDTO): Promise<IHolidayCalendarDTO[]>
  /** Creates holiday day rows for a date range + scope. */
  createHoliday(data: ICreateHolidayDTO, createdById: string): Promise<IHolidayCalendarDTO[]>
  /** Updates a holiday. */
  updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<IHolidayCalendarDTO>
  /** Deletes a holiday (optionally whole batch). */
  deleteHoliday(id: string, deleteBatch?: boolean): Promise<void>
  /** Checks if a date is a company-wide holiday. */
  isHoliday(date: string | Date): Promise<boolean>
}
