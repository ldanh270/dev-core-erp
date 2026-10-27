import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  AssignScheduleInput,
  GenerateScheduleInput,
  OverrideShiftInput,
  UpdateScheduleSettingsInput,
} from "../schemas/shift.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class ScheduleService {
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

  async getMySchedule(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch my schedule")
    }
  }

  async listMySchedules(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_MY_ALL,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list my schedules")
    }
  }

  async getEmployeeSchedule(session: SessionData, employeeId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_EMPLOYEE(employeeId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch employee schedule")
    }
  }

  async listEmployeeSchedules(session: SessionData, employeeId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_EMPLOYEE_ALL(employeeId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list employee schedules")
    }
  }

  async assign(session: SessionData, data: AssignScheduleInput) {
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

  async override(session: SessionData, data: OverrideShiftInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_OVERRIDE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to override shift")
    }
  }

  async previewGenerate(session: SessionData, data: GenerateScheduleInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_GENERATE_PREVIEW,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to preview generated schedule")
    }
  }

  async generate(session: SessionData, data: GenerateScheduleInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_GENERATE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to generate schedule")
    }
  }

  async getSettings(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_SETTINGS,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch schedule settings")
    }
  }

  async updateSettings(session: SessionData, data: UpdateScheduleSettingsInput) {
    try {
      const res = await this.client(session).put(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SCHEDULES_SETTINGS,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update schedule settings")
    }
  }
}

export const scheduleService = new ScheduleService()
