import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from "@/configs/auth/auth.config.ts"
import { JwtPayload } from "@/types/auth.types.ts"

import crypto from "crypto"
import jwt from "jsonwebtoken"

/**
 * JwtUtil provides helper methods for signing and verifying JSON Web Tokens
 */
/**
 * Provides static helper methods for signing and cryptographically verifying JSON Web Tokens (JWT).
 */
export class JwtUtil {
  /**
   * Generates a signed Access Token containing a unique JTI claim.
   *
   * @param payload - Key-value claims to encode inside the JWT payload
   * @returns Signed JWT string valid for ACCESS_TOKEN_TTL duration
   */
  static generateAccessToken(payload: object): string {
    const uniquePayload = { ...payload, jti: crypto.randomUUID() }
    return jwt.sign(uniquePayload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    })
  }

  /**
   * Generates a signed Refresh Token containing a unique JTI claim.
   *
   * @param payload - Key-value claims to encode inside the JWT payload
   * @returns Signed JWT string valid for REFRESH_TOKEN_TTL duration
   */
  static generateRefreshToken(payload: object): string {
    const uniquePayload = { ...payload, jti: crypto.randomUUID() }
    return jwt.sign(uniquePayload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    })
  }

  /**
   * Verifies an Access Token against the configured access secret.
   *
   * @param token - Raw JWT string to verify
   * @returns Decoded JwtPayload if valid and unexpired; null if signature mismatch or expired
   */
  static verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
    } catch (error) {
      return null
    }
  }

  /**
   * Verifies a Refresh Token against the configured refresh secret.
   *
   * @param token - Raw JWT string to verify
   * @returns Decoded JwtPayload if valid and unexpired; null if signature mismatch or expired
   */
  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload
    } catch (error) {
      return null
    }
  }
}
