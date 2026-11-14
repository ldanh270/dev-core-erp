export const AUTH_ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  INVALID_CREDENTIALS: "Wrong username or password",
  ACCOUNT_DISABLED: "Account is disabled or inactive",
  INVALID_TOKEN: "Invalid token",
  TOKEN_EXPIRED: "Reset link has expired",
  NO_REFRESH_TOKEN: "No refresh token provided",
  VALIDATION_ERROR: "Validation error",
  ACTIVITY_LOG_NOT_FOUND: "Activity log not found",
} as const

export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  NO_REFRESH_TOKEN: "NO_REFRESH_TOKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
} as const
