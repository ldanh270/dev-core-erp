import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type { CreateShiftChangeRequestInput } from "../schemas/shift.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class ShiftChangeRequestService {
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

  async getMine(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_MINE,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch my shift change requests")
    }
  }

  async create(session: SessionData, data: CreateShiftChangeRequestInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REQUESTS,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create shift change request")
    }
  }

  // Note: Approve and Reject are usually under Approval endpoints or specific Application endpoints,
  // but keeping them available if we need to call them directly
  async approve(session: SessionData, id: string) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_APPROVE(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to approve shift change request")
    }
  }

  async reject(session: SessionData, id: string) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.SHIFT_CHANGE_REJECT(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to reject shift change request")
    }
  }
}

export const shiftChangeRequestService = new ShiftChangeRequestService()
