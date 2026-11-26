/** Notification titles for the task assignment and review workflow. */
export const TASK_NOTIFICATION_TITLE = {
  ASSIGNED: "Bạn được giao công việc",
  REVIEW_REQUESTED: "Công việc cần đánh giá",
  CHANGES_REQUESTED: "Công việc cần chỉnh sửa",
} as const

/**
 * Builds a link to the task associated with an assignment or review alert.
 *
 * @param {string} taskId - Identifier of the task to open.
 * @returns {string} The web path to the task detail page.
 */
export function buildTaskNotificationLink(taskId: string): string {
  return `/project/task/${encodeURIComponent(taskId)}`
}
