/**
 * Lightweight console logger wrapper providing tagged log outputs for standard levels.
 */
export const logger = {
  /**
   * Logs an informational message.
   *
   * @param msg - Informational message
   * @param args - Additional metadata or objects to log
   */
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),

  /**
   * Logs a warning message.
   *
   * @param msg - Warning message
   * @param args - Additional metadata or objects to log
   */
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),

  /**
   * Logs an error message.
   *
   * @param msg - Error message or description
   * @param args - Additional metadata or error objects to log
   */
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
}
