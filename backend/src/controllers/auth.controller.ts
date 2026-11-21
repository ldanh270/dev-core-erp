import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES } from "@/constants/auth.constants.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  activityLogQuerySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
} from "@/schemas/auth.schema.ts"
import { IAuthService } from "@/types/auth.types.ts"
import { CookieUtil } from "@/utils/cookie.util.ts"

import { Request, Response } from "express"
import { z } from "zod"

/**
 * AuthController handles HTTP requests related to authentication
 * It acts as an adapter between the HTTP layer and the AuthService business logic
 */
export class AuthController {
  /**
   * Injecting IAuthService abstraction (Dependency Injection)
   */
  constructor(private service: IAuthService) {}

  /**
   * Handles the login request: validates input and delegates to the service
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validate request body using Zod schema
      const validatedData = loginSchema.parse(req.body)

      // Delegate to service
      const result = await this.service.login(validatedData, req.ip)
      const { accessToken, refreshToken, refreshExpiresAt, ...authData } = result

      CookieUtil.setAccessToken(res, accessToken)
      CookieUtil.setRefreshToken(res, refreshToken, refreshExpiresAt)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        data: {
          ...authData,
          accessToken,
        },
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles the logout request: extracts user info from AuthRequest and delegates to service
   */
  logout = async (req: AuthRequest, res: Response) => {
    // Security guard: req.user should be populated by authenticate middleware
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: {
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
        },
      })
    }

    // Delegate to service
    const rawRefreshToken = req.cookies?.["refresh_token"]
    const result = await this.service.logout(req.user.empId, rawRefreshToken, req.ip)

    CookieUtil.clearTokens(res)

    // Return successful response
    res.status(HttpStatusCode.OK).json({
      data: { message: result.message },
      error: null,
    })
  }

  /**
   * Rotates the session tokens using the refresh-token cookie and sets replacement cookies.
   * The raw refresh token is never included in the JSON response.
   */
  refresh = async (req: Request, res: Response) => {
    try {
      const rawRefreshToken = req.cookies["refresh_token"]

      // Temporary diagnostics for checking refresh-cookie delivery.
      console.log("[REFRESH DEBUG] cookies received:", Object.keys(req.cookies))
      console.log("[REFRESH DEBUG] refresh_token present:", !!rawRefreshToken)
      console.log(
        "[REFRESH DEBUG] refresh_token value (first 20 chars):",
        rawRefreshToken?.slice(0, 20),
      )
      if (!rawRefreshToken) {
        CookieUtil.clearTokens(res)
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.NO_REFRESH_TOKEN,
            code: AUTH_ERROR_CODES.NO_REFRESH_TOKEN,
          },
        })
      }

      const result = await this.service.refresh(rawRefreshToken)
      const { accessToken, refreshToken, refreshExpiresAt, ...authData } = result

      CookieUtil.setAccessToken(res, accessToken)
      CookieUtil.setRefreshToken(res, refreshToken, refreshExpiresAt)

      res.status(HttpStatusCode.OK).json({
        data: {
          ...authData,
          accessToken,
        },
        error: null,
      })
    } catch (error) {
      console.log("[REFRESH DEBUG] error:", (error as Error).message)
      CookieUtil.clearTokens(res)
      throw error
    }
  }

  /**
   * Gets the currently authenticated user's information
   */
  getMe = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: {
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
        },
      })
    }

    const result = await this.service.getMe(req.user.empId)

    res.status(HttpStatusCode.OK).json({
      data: {
        employee: result,
      },
      error: null,
    })
  }

  /**
   * Handles the forgot password request
   */
  forgotPassword = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = forgotPasswordSchema.parse(req.body)

      // Delegate to service
      const result = await this.service.forgotPassword(validatedData)

      // Return successful response
      res.status(HttpStatusCode.OK).json({
        data: { message: result.message },
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles password change for authenticated users
   */
  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      const validatedData = changePasswordSchema.parse(req.body)
      const result = await this.service.changePassword(req.user.empId, validatedData)

      res.status(HttpStatusCode.OK).json({
        data: { message: result.message },
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Validates a password reset token
   */
  validateResetToken = async (req: Request, res: Response) => {
    try {
      const validatedData = validateResetTokenSchema.parse(req.body)
      const result = await this.service.validateResetToken(validatedData)

      if (!result.isValid) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: result.message || AUTH_ERROR_MESSAGES.INVALID_TOKEN,
            code: AUTH_ERROR_CODES.INVALID_TOKEN,
          },
        })
      }

      res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Handles password reset using a token
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body)
      const result = await this.service.resetPassword(validatedData)

      res.status(HttpStatusCode.OK).json({
        data: { message: result.message },
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Lists activity logs for the authenticated user (Personal History)
   */
  listMyActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
          },
        })
      }

      // Validate request query using shared activity log schema
      const validatedQuery = activityLogQuerySchema.parse(req.query)

      // Delegate to service with empId from token
      const result = await this.service.getMyActivityLogs(req.user.empId, validatedQuery)

      res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Gets a single activity log detail for the authenticated user
   */
  getMyActivityLogDetail = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        data: null,
        error: {
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
        },
      })
    }

    const result = await this.service.getMyActivityLogDetail(req.user.empId, String(req.params.id))

    if (!result) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: {
          message: AUTH_ERROR_MESSAGES.ACTIVITY_LOG_NOT_FOUND,
          code: AUTH_ERROR_CODES.NOT_FOUND,
        },
      })
    }

    res.status(HttpStatusCode.OK).json({
      data: result,
      error: null,
    })
  }

  /**
   * Lists activity logs with filters
   */
  listActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
      const validatedQuery = activityLogQuerySchema.parse(req.query)
      const result = await this.service.getActivityLogs(validatedQuery)

      res.status(HttpStatusCode.OK).json({
        data: result,
        error: null,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          data: null,
          error: {
            message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
            code: AUTH_ERROR_CODES.VALIDATION_ERROR,
            meta: error.issues,
          },
        })
      }
      throw error
    }
  }

  /**
   * Gets a single activity log detail
   */
  getActivityLogDetail = async (req: AuthRequest, res: Response) => {
    const result = await this.service.getActivityLogDetail(String(req.params.id))

    if (!result) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        data: null,
        error: {
          message: AUTH_ERROR_MESSAGES.ACTIVITY_LOG_NOT_FOUND,
          code: AUTH_ERROR_CODES.NOT_FOUND,
        },
      })
    }

    res.status(HttpStatusCode.OK).json({
      data: result,
      error: null,
    })
  }
}
