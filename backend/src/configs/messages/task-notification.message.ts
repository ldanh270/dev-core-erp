/** Notification titles for the task assignment and review workflow. */
export const TASK_NOTIFICATION_TITLE = {
  ASSIGNED: "Bạn được giao công việc",
  REVIEW_REQUESTED: "Công việc cần đánh giá",
  CHANGES_REQUESTED: "Công việc cần chỉnh sửa",
} as const

/** Builds the web route shared by task assignment and review notifications. */
export function buildTaskNotificationLink(taskId: string): string {
  return `/project/task/${encodeURIComponent(taskId)}`
}
