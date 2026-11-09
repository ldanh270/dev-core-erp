/**
 * Middleware to authenticate requests using JWT
 * Validates the 'Authorization: Bearer <token>' header
 * Populates req.user if the token is valid, otherwise returns 401 Unauthorized
 */
import { AUTH_ERRORS } from "@/configs/auth/auth.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorCode, ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { AppError } from "@/utils/error.util.ts"
import { JwtUtil } from "@/utils/jwt.util.ts"

import { NextFunction, Request, Response } from "express"

const employeeRepository = new PrismaEmployeeRepository(prisma)

/**
 * Interface extending the Express Request to include the authenticated user's information.
 * role is intentionally absent — all authorization decisions go through dynamic RBAC.
 */
export interface AuthRequest extends Request {
  user?: {
    empId: string
    username: string
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.["access_token"]

  // Fallback: check Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7)
  }

  // Fallback: check query parameter (used by browser EventSource SSE streams)
  if (!token && typeof req.query.token === "string") {
    token = req.query.token
  }

  // Verify token presence
  if (!token) {
    return next(
      new AppError(
        AUTH_ERRORS.MISSING_TOKEN.message,
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.MIDDLEWARE,
        AUTH_ERRORS.MISSING_TOKEN.code,
      ),
    )
  }

  // Verify token
  const decoded = JwtUtil.verifyAccessToken(token)

  // Reject if verification fails
  if (!decoded) {
    console.error("Auth Middleware: Token verification failed or token expired")
    return next(
      new AppError(
        AUTH_ERRORS.TOKEN_EXPIRED.message,
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.MIDDLEWARE,
        AUTH_ERRORS.TOKEN_EXPIRED.code,
      ),
    )
  }

  // Token version verification
  if (!decoded.version || decoded.version < 3) {
    console.error("Auth Middleware: Token version outdated")
    return next(
      new AppError(
        "Session expired. Please login again.",
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.MIDDLEWARE,
        ErrorCode.UNAUTHORIZED,
      ),
    )
  }

  // Verify that the user still exists in the database and is active
  try {
    const employee = await employeeRepository.findById(decoded.empId)

    if (!employee || employee.status !== EMPLOYEE_STATUS.ACTIVE) {
      console.error("Auth Middleware: Employee not found or inactive", {
        empId: decoded.empId,
        employeeStatus: employee?.status,
      })

      return next(
        new AppError(
          AUTH_ERRORS.ACCOUNT_INACTIVE.message,
          HttpStatusCode.UNAUTHORIZED,
          ErrorLayer.MIDDLEWARE,
          AUTH_ERRORS.ACCOUNT_INACTIVE.code,
        ),
      )
    }
  } catch (error) {
    console.error("Auth Middleware: Error finding employee", error)

    return next(
      new AppError(
        AUTH_ERRORS.AUTH_ERROR.message,
        HttpStatusCode.UNAUTHORIZED,
        ErrorLayer.MIDDLEWARE,
        AUTH_ERRORS.AUTH_ERROR.code,
      ),
    )
  }

  // Attach decoded user info to the request object for use in controllers
  req.user = {
    empId: decoded.empId,
    username: decoded.username,
  }

  next()
}
