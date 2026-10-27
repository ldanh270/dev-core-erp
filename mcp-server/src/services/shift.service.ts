import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type { CreateShiftInput, UpdateShiftInput } from "../schemas/shift.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class ShiftService {
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

  async list(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list shifts")
    }
  }

  async getOne(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch shift")
    }
  }

  async create(session: SessionData, data: CreateShiftInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BASE, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create shift")
    }
  }

  async update(session: SessionData, id: string, data: UpdateShiftInput) {
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

  async delete(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(DEVCORE_API_CONSTANTS.ENDPOINTS.SHIFTS.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete shift")
    }
  }
}

export const shiftService = new ShiftService()
