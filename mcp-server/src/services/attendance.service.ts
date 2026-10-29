import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  AssignScheduleInput,
  CreateShiftInput,
  GetAttendanceInput,
  LocationInput,
  OverrideScheduleInput,
  SubmitShiftChangeInput,
  UpdateShiftInput,
} from "../schemas/attendance.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class AttendanceService {
  private client(session: SessionData) {
    return createAuthedClient(session)
  }

  private handleError(error: any, fallback: string): never {
    if (error.response) {
      throw new Error(
        error.response.data?.message || error.response.data?.error?.message || fallback,
      )
    }
    throw new Error(`Connection error: ${error.message}`)
  }

  // ─── Attendance (Chấm công) ─────────────────────────────────────────────────

  /** POST /api/attendance/check-in */
  async checkIn(session: SessionData, location: LocationInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.ATTENDANCE.CHECK_IN, {
        location,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Check-in failed")
    }
  }

  /** POST /api/attendance/check-out */
  async checkOut(session: SessionData, location: LocationInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.ATTENDANCE.CHECK_OUT,
        {
          location,
        },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Check-out failed")
    }
  }

  /** POST /api/attendance/scan — smart scan (auto check-in or check-out) */
  async scan(session: SessionData, location: LocationInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.ATTENDANCE.SCAN, {
        location,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Attendance scan failed")
    }
  }

  /** GET /api/attendance — history with optional filters */
  async getHistory(session: SessionData, params?: GetAttendanceInput) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.ATTENDANCE.BASE, {
        params,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch attendance history")
    }
  }

  // ─── Shifts (Ca làm việc) ───────────────────────────────────────────────────

  /** GET /api/shifts */
  async listShifts(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch shifts")
    }
  }

  /** GET /api/shifts/:id */
  async getShift(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch shift")
    }
  }

  /** POST /api/shifts */
  async createShift(session: SessionData, data: CreateShiftInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create shift")
    }
  }

  /** PATCH /api/shifts/:id */
  async updateShift(session: SessionData, id: string, data: UpdateShiftInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update shift")
    }
  }

  // ─── Schedules (Lịch ca) ────────────────────────────────────────────────────

  /** GET /api/schedules/my */
  async getMySchedule(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch current schedule")
    }
  }

  /** GET /api/schedules/my/all */
  async getMyScheduleHistory(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY_ALL,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch schedule history")
    }
  }

  /** POST /api/schedules/assign */
  async assignSchedule(session: SessionData, data: AssignScheduleInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_ASSIGN,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to assign schedule")
    }
  }

  /** POST /api/schedules/override */
  async overrideSchedule(session: SessionData, data: OverrideScheduleInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_OVERRIDE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to override schedule")
    }
  }

  // ─── Shift Change Requests (Đổi ca) ─────────────────────────────────────────

  /** GET /api/shift-change-requests/mine */
  async getMyShiftChangeRequests(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_MINE,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch shift change requests")
    }
  }

  /** POST /api/shift-change-requests */
  async submitShiftChangeRequest(session: SessionData, data: SubmitShiftChangeInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REQUESTS,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to submit shift change request")
    }
  }

  /** PATCH /api/shift-change-requests/:id/approve */
  async approveShiftChangeRequest(session: SessionData, id: string) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_APPROVE(id),
        { status: "approved" },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to approve shift change request")
    }
  }

  /** PATCH /api/shift-change-requests/:id/reject */
  async rejectShiftChangeRequest(session: SessionData, id: string, rejectReason: string) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REJECT(id),
        { rejectReason },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to reject shift change request")
    }
  }
}

export const attendanceService = new AttendanceService()
