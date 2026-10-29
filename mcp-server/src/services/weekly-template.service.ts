import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  CreateWeeklyTemplateInput,
  UpdateWeeklyTemplateInput,
} from "../schemas/shift.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class WeeklyTemplateService {
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
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BASE)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list weekly templates")
    }
  }

  async getOne(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch weekly template")
    }
  }

  async create(session: SessionData, data: CreateWeeklyTemplateInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BASE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create weekly template")
    }
  }

  async update(session: SessionData, id: string, data: UpdateWeeklyTemplateInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update weekly template")
    }
  }

  async delete(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete weekly template")
    }
  }

  async apply(session: SessionData, id: string, employeeIds: string[]) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.WEEKLY_TEMPLATE.APPLY(id),
        {
          employeeIds,
        },
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to apply weekly template")
    }
  }
}

export const weeklyTemplateService = new WeeklyTemplateService()
