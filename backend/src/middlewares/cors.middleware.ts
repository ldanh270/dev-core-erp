import { NextFunction, Request, Response } from "express"

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
