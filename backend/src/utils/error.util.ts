/**
 * Application-specific domain exception.
 * Captures HTTP status code, architectural layer, and machine-readable error codes
 * to facilitate standardized API error responses and audit logging.
 *
 * @example
 * ```ts
 * throw new AppError("User not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE, "USER_NOT_FOUND");
 * ```
 */
export class AppError extends Error {
  public statusCode: number
  public layer: string // Layer where the error occurred (e.g., "Database", "Authentication", "Validation")
  public errorCode?: string // Custom machine-readable error code

  /**
   * Initializes a new AppError instance.
   *
   * @param message - User-facing or internal error description
   * @param statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param layer - Architectural layer identifier (Service, Repository, Controller, etc.)
   * @param errorCode - Optional unique machine-readable error code
   */
  constructor(message: string, statusCode: number, layer: string = "Unknown", errorCode?: string) {
    super(message)
    this.statusCode = statusCode
    this.layer = layer
    this.errorCode = errorCode

    // Capture the stack trace (excluding the constructor)
    Error.captureStackTrace(this, this.constructor)
  }
}
