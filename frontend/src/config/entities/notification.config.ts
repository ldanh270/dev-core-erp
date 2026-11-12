/**
 * Notification entity configuration for frontend.
 * Mirrors backend enums exactly per Enum Naming Law (lower_snake_case value, UPPER_SNAKE key).
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

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  [NOTIFICATION_TYPE.INFO]: "Thông tin",
  [NOTIFICATION_TYPE.SUCCESS]: "Thành công",
  [NOTIFICATION_TYPE.WARNING]: "Cảnh báo",
  [NOTIFICATION_TYPE.ERROR]: "Lỗi",
  [NOTIFICATION_TYPE.APPLICATION]: "Đơn từ",
  [NOTIFICATION_TYPE.TASK]: "Công việc",
  [NOTIFICATION_TYPE.PAYROLL]: "Bảng lương",
  [NOTIFICATION_TYPE.SYSTEM]: "Hệ thống",
}
