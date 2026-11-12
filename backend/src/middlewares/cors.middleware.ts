import { NextFunction, Request, Response } from "express"

/**
 * Resolves allowed CORS origins from environment variables.
 * Fallbacks to CLIENT_URL and FRONTEND_URL if CORS_ALLOWED_ORIGINS is not defined.
 *
 * @returns Array of allowed origin strings or wildcards
 */
export const getAllowedOrigins = (): string[] => {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configured?.length) return configured

  return [process.env.CLIENT_URL, process.env.FRONTEND_URL]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.trim())
}

/**
 * Checks whether an incoming origin matches the list of allowed origins or wildcards.
 * Supports exact matches, wildcard "*", and wildcard domain patterns (e.g. *.example.com).
 *
 * @param origin - The incoming Origin header from client request
 * @param allowedOrigins - Array of allowed origins or wildcard patterns
 * @returns True if origin is allowed, false otherwise
 */
export const isOriginAllowed = (origin: string, allowedOrigins: string[]): boolean => {
  return allowedOrigins.some((pattern) => {
    if (pattern === origin || pattern === "*") return true

    if (pattern.includes("*")) {
      const fullPattern =
        pattern.startsWith("http://") || pattern.startsWith("https://")
          ? pattern
          : `https?://${pattern}`

      const regexPattern = fullPattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")

      return new RegExp(`^${regexPattern}$`, "i").test(origin)
    }

    return false
  })
}

/**
 * Express middleware for Cross-Origin Resource Sharing (CORS).
 * Validates request origin against allowed list and sets CORS headers.
 * Intercepts preflight OPTIONS requests with 204 No Content.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin
  const allowedOrigins = getAllowedOrigins()

  if (origin) {
    if (typeof origin !== "string" || !isOriginAllowed(origin, allowedOrigins)) {
      res.status(403).json({
        data: null,
        error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin không được phép" },
        meta: null,
      })
      return
    }
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  // Intercept preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.sendStatus(204)
    return
  }

  next()
}
