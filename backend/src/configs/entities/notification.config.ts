/**
 * Notification domain configuration and constants.
 * Adheres strictly to the project's enum naming law and zero-hardcode policy.
 */

export const NOTIFICATION_TYPE = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  APPLICATION: "application",
  TASK: "task",
  PAYROLL: "payroll",
  SYSTEM: "system",
} as const

export const NOTIFICATION_TYPES = [
  NOTIFICATION_TYPE.INFO,
  NOTIFICATION_TYPE.SUCCESS,
  NOTIFICATION_TYPE.WARNING,
  NOTIFICATION_TYPE.ERROR,
  NOTIFICATION_TYPE.APPLICATION,
  NOTIFICATION_TYPE.TASK,
  NOTIFICATION_TYPE.PAYROLL,
  NOTIFICATION_TYPE.SYSTEM,
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const NOTIFICATION_PRIORITIES = [
  NOTIFICATION_PRIORITY.LOW,
  NOTIFICATION_PRIORITY.MEDIUM,
  NOTIFICATION_PRIORITY.HIGH,
  NOTIFICATION_PRIORITY.URGENT,
] as const

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number]

export const NOTIFICATION_STREAM_CONFIG = {
  KEEP_ALIVE_INTERVAL_MS: 25000,
  RETRY_TIMEOUT_MS: 5000,
} as const

export const NOTIFICATION_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const NOTIFICATION_EVENT = {
  CREATED: "notification:created",
  UPDATED: "notification:updated",
  READ: "notification:read",
  READ_ALL: "notification:read_all",
} as const

export const NOTIFICATION_ERRORS = {
  NOT_FOUND: {
    message: "Notification not found",
    code: "NOTIFICATION_NOT_FOUND",
  },
  UNAUTHORIZED: {
    message: "You are not authorized to access this notification",
    code: "NOTIFICATION_UNAUTHORIZED",
  },
  STREAM_ERROR: {
    message: "Failed to establish notification real-time stream",
    code: "NOTIFICATION_STREAM_ERROR",
  },
} as const
