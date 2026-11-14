import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config"
import { ATTENDANCE_QUERY_PARAMS } from "@/constants/attendance.constants"
import apiClient from "@/lib/api-client"
import type {
  IApplyWeeklyScheduleTemplatePayload,
  IApproval,
  IAssignSchedulePayload,
  IAttendanceMatrixQuery,
  IAttendanceMatrixResult,
  IAttendanceQuery,
  IAttendanceRecord,
  ICheckInOutRequest,
  ICreateShiftPayload,
  ICreateWeeklyScheduleTemplatePayload,
  IHoliday,
  IHolidayPayload,
  IHolidayQuery,
  IOverrideShiftPayload,
  IPlannedWeek,
  IProcessApprovalPayload,
  ISchedule,
  IShiftChangeRequest,
  ISubmitShiftChangeRequestPayload,
  IUpdateShiftPayload,
  IUpdateWeeklyScheduleTemplatePayload,
  IWeeklyScheduleTemplate,
  IWorkingShift,
} from "@/types/attendance.types"

/**
 * ApiResponse envelope — standard format for all Backend responses.
 */
interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
}

/**
 * shiftsApi — Data access layer for Working Shifts.
 */
export const shiftsApi = {
  /** Fetches all active and inactive shifts. */
  getAll: async (): Promise<IWorkingShift[]> => {
    const res = await apiClient.get<ApiResponse<IWorkingShift[]>>(API_ENDPOINTS.SHIFTS.BASE)
    return res.data.data
  },

  /** Fetches a single shift by its unique ID. */
  getById: async (id: string): Promise<IWorkingShift> => {
    const res = await apiClient.get<ApiResponse<IWorkingShift>>(
      `${API_ENDPOINTS.SHIFTS.BASE}/${id}`,
    )
    return res.data.data
  },

  /** Creates a new working shift definition. */
  create: async (data: ICreateShiftPayload): Promise<IWorkingShift> => {
    const res = await apiClient.post<ApiResponse<IWorkingShift>>(API_ENDPOINTS.SHIFTS.BASE, data)
    return res.data.data
  },

  /** Updates an existing shift definition using PATCH. */
  update: async (id: string, data: IUpdateShiftPayload): Promise<IWorkingShift> => {
    const res = await apiClient.patch<ApiResponse<IWorkingShift>>(
      `${API_ENDPOINTS.SHIFTS.BASE}/${id}`,
      data,
    )
    return res.data.data
  },

  /** Removes a shift definition from the system. */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.SHIFTS.BASE}/${id}`)
  },
}

/**
 * schedulesApi — Data access layer for Shift Assignment Schedules.
 */
export const schedulesApi = {
  /** Fetches the planned schedule for the authenticated user on a specific date or current week. */
  getMy: async (date?: string): Promise<ISchedule | null> => {
    const res = await apiClient.get<ApiResponse<ISchedule | null>>(API_ENDPOINTS.SCHEDULES.MY, {
      params: date ? { [ATTENDANCE_QUERY_PARAMS.DATE]: date } : undefined,
    })
    return res.data.data
  },

  /** Fetches merged planned shifts (overrides + template) for the current user week. */
  getMyPlannedWeek: async (weekStart: string): Promise<IPlannedWeek> => {
    const res = await apiClient.get<ApiResponse<IPlannedWeek>>(API_ENDPOINTS.SCHEDULES.MY_WEEK, {
      params: { [ATTENDANCE_QUERY_PARAMS.WEEK_START]: weekStart },
    })
    return res.data.data
  },

  /** Fetches the entire history of shift assignments for the current user. */
  getMyAll: async (): Promise<ISchedule[]> => {
    const res = await apiClient.get<ApiResponse<ISchedule[]>>(API_ENDPOINTS.SCHEDULES.MY_ALL)
    return res.data.data
  },

  /** Fetches specific employee shifts for the authenticated user within a date range. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMyShifts: async (startDate: string, endDate: string): Promise<any[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SCHEDULES.MY_SHIFTS, {
      params: { startDate, endDate },
    })
    return res.data.data
  },

  /** Fetches EmployeeShifts for a specific employee (used for shift-swap partner ca selection). */
  getShiftsByEmployee: async (
    employeeId: string,
    startDate: string,
    endDate: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.SCHEDULES.EMPLOYEE_SHIFTS(employeeId),
      { params: { startDate, endDate } },
    )
    return res.data.data
  },

  /** Fetches the planned schedule for a specific employee. */
  getByEmployee: async (employeeId: string, date?: string): Promise<ISchedule | null> => {
    const res = await apiClient.get<ApiResponse<ISchedule | null>>(
      API_ENDPOINTS.SCHEDULES.EMPLOYEE(employeeId),
      { params: date ? { [ATTENDANCE_QUERY_PARAMS.DATE]: date } : undefined },
    )
    return res.data.data
  },

  /** Fetches merged planned shifts for a specific employee week (admin PT assign). */
  getEmployeePlannedWeek: async (employeeId: string, weekStart: string): Promise<IPlannedWeek> => {
    const res = await apiClient.get<ApiResponse<IPlannedWeek>>(
      API_ENDPOINTS.SCHEDULES.EMPLOYEE_WEEK(employeeId),
      { params: { [ATTENDANCE_QUERY_PARAMS.WEEK_START]: weekStart } },
    )
    return res.data.data
  },

  /** Fetches all schedule assignments for a specific employee. */
  getAllByEmployee: async (employeeId: string): Promise<ISchedule[]> => {
    const res = await apiClient.get<ApiResponse<ISchedule[]>>(
      API_ENDPOINTS.SCHEDULES.EMPLOYEE_ALL(employeeId),
    )
    return res.data.data
  },

  /** Assigns a shift schedule to an employee for a specific date range. */
  assign: async (data: IAssignSchedulePayload): Promise<ISchedule> => {
    const res = await apiClient.post<ApiResponse<ISchedule>>(API_ENDPOINTS.SCHEDULES.ASSIGN, data)
    return res.data.data
  },

  /** Overrides a single day's shift for an employee. */
  override: async (data: IOverrideShiftPayload): Promise<ISchedule> => {
    const res = await apiClient.post<ApiResponse<ISchedule>>(API_ENDPOINTS.SCHEDULES.OVERRIDE, data)
    return res.data.data
  },
}

/**
 * attendanceApi — Data access layer for actual Check-In/Check-Out records.
 */
export const attendanceApi = {
  /** Workforce attendance grouped into week/month matrix cells. */
  getMatrix: async (query: IAttendanceMatrixQuery): Promise<IAttendanceMatrixResult> => {
    const res = await apiClient.get<ApiResponse<IAttendanceMatrixResult>>(
      API_ENDPOINTS.ATTENDANCE.MATRIX,
      { params: query },
    )
    return res.data.data
  },

  /** Fetches attendance logs filtered by date range, employee, or status. */
  getRecords: async (query?: IAttendanceQuery): Promise<IAttendanceRecord[]> => {
    const res = await apiClient.get<ApiResponse<IAttendanceRecord[]>>(
      API_ENDPOINTS.ATTENDANCE.BASE,
      {
        params: {
          ...query,
          personalOnly: query?.personalOnly ? "true" : undefined,
        },
      },
    )
    return res.data.data
  },

  /** Manually records a check-in event. */
  checkIn: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const res = await apiClient.post<ApiResponse<IAttendanceRecord>>(
      API_ENDPOINTS.ATTENDANCE.CHECK_IN,
      {
        location: {
          lat: Number(data.location.lat),
          lng: Number(data.location.lng),
        },
      },
    )
    return res.data.data
  },

  /** Manually records a check-out event. */
  checkOut: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const res = await apiClient.post<ApiResponse<IAttendanceRecord>>(
      API_ENDPOINTS.ATTENDANCE.CHECK_OUT,
      {
        location: {
          lat: Number(data.location.lat),
          lng: Number(data.location.lng),
        },
      },
    )
    return res.data.data
  },

  /** Universal scan method (Check-In or Check-Out based on context) used by VirtualScanner. */
  scan: async (data: ICheckInOutRequest): Promise<IAttendanceRecord> => {
    const res = await apiClient.post<ApiResponse<IAttendanceRecord>>(
      API_ENDPOINTS.ATTENDANCE.SCAN,
      {
        location: {
          lat: Number(data.location.lat),
          lng: Number(data.location.lng),
        },
      },
    )
    return res.data.data
  },

  /** Generates a full URL for the CSV export endpoint, including query parameters. */
  exportCsv: (query?: IAttendanceQuery): string => {
    const params = new URLSearchParams()
    if (query?.startDate) params.set(ATTENDANCE_QUERY_PARAMS.START_DATE, query.startDate)
    if (query?.endDate) params.set(ATTENDANCE_QUERY_PARAMS.END_DATE, query.endDate)
    if (query?.employeeId) params.set(ATTENDANCE_QUERY_PARAMS.EMPLOYEE_ID, query.employeeId)
    if (query?.status) params.set(ATTENDANCE_QUERY_PARAMS.STATUS, query.status)
    const qs = params.toString()
    return `${API_BASE_URL}${API_ENDPOINTS.ATTENDANCE.EXPORT}${qs ? `?${qs}` : ""}`
  },
}

/**
 * shiftChangeRequestsApi — Data access layer for swapping shifts between colleagues.
 */
export const shiftChangeRequestsApi = {
  /** Submits a new swap request. */
  submit: async (data: ISubmitShiftChangeRequestPayload): Promise<IShiftChangeRequest> => {
    const res = await apiClient.post<ApiResponse<IShiftChangeRequest>>(
      API_ENDPOINTS.SHIFT_CHANGE_REQUESTS.BASE,
      data,
    )
    return res.data.data
  },

  /** Fetches all swap requests sent by the current user. */
  getMine: async (): Promise<IShiftChangeRequest[]> => {
    const res = await apiClient.get<ApiResponse<IShiftChangeRequest[]>>(
      API_ENDPOINTS.SHIFT_CHANGE_REQUESTS.MINE,
    )
    return res.data.data
  },
}

/**
 * approvalsApi — Data access layer for administrative approval workflows.
 */
export const approvalsApi = {
  /** Fetches all pending requests that require the current user's approval action. */
  getPending: async (): Promise<IApproval[]> => {
    const res = await apiClient.get<ApiResponse<IApproval[]>>(API_ENDPOINTS.APPROVALS.BASE)
    return res.data.data
  },

  /** Processes a request (Approve or Reject) with an optional reason. */
  process: async (id: string, data: IProcessApprovalPayload): Promise<IApproval> => {
    const res = await apiClient.patch<ApiResponse<IApproval>>(
      API_ENDPOINTS.APPROVALS.APPLICATION(id),
      data,
    )
    return res.data.data
  },
}

/**
 * holidaysApi — Data access layer for holiday calendar management.
 */
export const holidaysApi = {
  getAll: async (query?: IHolidayQuery): Promise<IHoliday[]> => {
    const res = await apiClient.get<ApiResponse<IHoliday[]>>(API_ENDPOINTS.HOLIDAYS.BASE, {
      params: query,
    })
    return res.data.data
  },

  create: async (data: IHolidayPayload): Promise<IHoliday[]> => {
    const res = await apiClient.post<ApiResponse<IHoliday[]>>(API_ENDPOINTS.HOLIDAYS.BASE, data)
    return res.data.data
  },

  update: async (id: string, data: Partial<IHolidayPayload>): Promise<IHoliday> => {
    const res = await apiClient.patch<ApiResponse<IHoliday>>(
      `${API_ENDPOINTS.HOLIDAYS.BASE}/${id}`,
      data,
    )
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.HOLIDAYS.BASE}/${id}`)
  },
}

/**
 * weeklyScheduleTemplatesApi — Reusable rotating weekly shift pattern templates.
 */
export const weeklyScheduleTemplatesApi = {
  getAll: async (): Promise<IWeeklyScheduleTemplate[]> => {
    const res = await apiClient.get<ApiResponse<IWeeklyScheduleTemplate[]>>(
      API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.BASE,
    )
    return res.data.data
  },

  getById: async (id: string): Promise<IWeeklyScheduleTemplate> => {
    const res = await apiClient.get<ApiResponse<IWeeklyScheduleTemplate>>(
      `${API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.BASE}/${id}`,
    )
    return res.data.data
  },

  create: async (data: ICreateWeeklyScheduleTemplatePayload): Promise<IWeeklyScheduleTemplate> => {
    const res = await apiClient.post<ApiResponse<IWeeklyScheduleTemplate>>(
      API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.BASE,
      data,
    )
    return res.data.data
  },

  update: async (
    id: string,
    data: IUpdateWeeklyScheduleTemplatePayload,
  ): Promise<IWeeklyScheduleTemplate> => {
    const res = await apiClient.patch<ApiResponse<IWeeklyScheduleTemplate>>(
      `${API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.BASE}/${id}`,
      data,
    )
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.BASE}/${id}`)
  },

  apply: async (
    templateId: string,
    data: IApplyWeeklyScheduleTemplatePayload,
  ): Promise<unknown[]> => {
    const res = await apiClient.post<ApiResponse<unknown[]>>(
      API_ENDPOINTS.WEEKLY_SCHEDULE_TEMPLATES.APPLY(templateId),
      data,
    )
    return res.data.data
  },
}
