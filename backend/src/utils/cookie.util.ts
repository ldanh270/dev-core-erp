import { ACCESS_TOKEN_TTL_MS } from "@/configs/auth/auth.config.ts"

import { Response } from "express"

const isProduction = process.env.NODE_ENV === "production"

/**
 * Utility for managing HTTP-only authentication cookies (access and refresh tokens).
 * Applies secure flags and lax/none sameSite policies based on environment.
 */
export class CookieUtil {
  /**
   * Sets the short-lived access token cookie on the HTTP response.
   *
   * @param res - Express response object
   * @param token - JWT access token string
   */
  static setAccessToken(res: Response, token: string): void {
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: ACCESS_TOKEN_TTL_MS,
      path: "/",
    })
  }

  /**
   * Sets the long-lived refresh token cookie with an absolute expiration date.
   *
   * @param res - Express response object
   * @param token - Opaque/JWT refresh token string
   * @param expiresAt - Expiration Date object
   */
  static setRefreshToken(res: Response, token: string, expiresAt: Date): void {
    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      expires: expiresAt,
      path: "/",
    })
  }

  /**
   * Clears both access and refresh token cookies on logout or session invalidation.
   *
   * @param res - Express response object
   */
  static clearTokens(res: Response): void {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    })
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    })
  }
}
