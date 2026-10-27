import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  ChangePasswordInput,
  LinkEmployeeInput,
  UpdateProfileInput,
} from "../schemas/profile.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class ProfileService {
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

  async getMe(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PROFILE.ME)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch profile")
    }
  }

  async updateMe(session: SessionData, data: UpdateProfileInput) {
    try {
      const res = await this.client(session).patch(DEVCORE_API_CONSTANTS.ENDPOINTS.PROFILE.ME, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update profile")
    }
  }

  async uploadAvatar(session: SessionData, avatarPath: string) {
    try {
      // This will likely require reading the file and sending it as multipart/form-data
      // In MCP context, maybe we don't implement file upload directly, but we can provide the base implementation
      throw new Error("File upload not fully supported in MCP via direct paths currently")
    } catch (e: any) {
      this.handleError(e, "Failed to upload avatar")
    }
  }

  async changePassword(session: SessionData, data: ChangePasswordInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROFILE.CHANGE_PASSWORD,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to change password")
    }
  }

  async linkEmployee(session: SessionData, data: LinkEmployeeInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PROFILE.LINK_EMPLOYEE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to link employee profile")
    }
  }
}

export const profileService = new ProfileService()
