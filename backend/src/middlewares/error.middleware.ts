import { ErrorCode } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AppError } from "@/utils/error.util.ts"

import { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

/**
 * Global error handling middleware for Express.
 * Handles AppError, ZodError, and generic internal server errors.
 *
 * @param err - The error object.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Format the error into a standardized structure
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: "ERROR",
    layer: err instanceof AppError ? err.layer : "Unhandled",
    code:
      err instanceof AppError
        ? err.errorCode
        : err instanceof ZodError
          ? ErrorCode.VALIDATION_ERROR
          : ErrorCode.INTERNAL_CRASH,
    status:
      err instanceof AppError
        ? err.statusCode
        : err instanceof ZodError
          ? HttpStatusCode.BAD_REQUEST
          : HttpStatusCode.INTERNAL_SERVER_ERROR,
    message: err.message || "Unknown Error",
    path: `${req.method} ${req.originalUrl}`,
    stack: err.stack,
  }

  // Professional structured logging (Only log 500 errors to the server console)
  if (errorLog.status >= 500) {
    console.error("Unhandled server error:", err)
  }

  // Send response to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: {
        message: err.message,
        code: err.errorCode || ErrorCode.APP_ERROR,
        meta: { layer: err.layer },
      },
    })
  }

  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }))

    return res.status(HttpStatusCode.BAD_REQUEST).json({
      data: null,
      error: {
        message: "Validation Error",
        code: ErrorCode.VALIDATION_ERROR,
        meta: formattedIssues,
      },
    })
  }

  // Hide internal crash details from the client
  return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    data: null,
    error: {
      message: "Internal Server Error",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    },
  })
}
