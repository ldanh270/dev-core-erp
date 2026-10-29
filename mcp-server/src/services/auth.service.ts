import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import { LoginInput } from "../schemas/auth.schema.js"
import { GenericResponse, LoginResponse } from "../types/devcore-api.types.js"
import { createAuthedClient, devcoreClient } from "../utils/devcore-client.js"

export class AuthService {
  /**
   * Call DevCore API to login and obtain a JWT Token
   */
  public async login(input: LoginInput): Promise<{ data: LoginResponse; cookies?: string[] }> {
    try {
      const response = await devcoreClient.post<LoginResponse>(
        DEVCORE_API_CONSTANTS.ENDPOINTS.AUTH.LOGIN,
        input,
      )
      return {
        data: response.data,
        cookies: response.headers["set-cookie"],
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || "Login failed from DevCore API")
      }
      throw new Error(`Connection error: ${error.message}`)
    }
  }

  /**
   * Call DevCore API to logout and invalidate the token on the server
   */
  public async logout(session: { jwt: string; cookies?: string[] }): Promise<GenericResponse> {
    try {
      const authedClient = createAuthedClient(session)
      const response = await authedClient.post<GenericResponse>(
        DEVCORE_API_CONSTANTS.ENDPOINTS.AUTH.LOGOUT,
      )
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || "Logout failed from DevCore API")
      }
      throw new Error(`Connection error: ${error.message}`)
    }
  }
}

export const authService = new AuthService()
