const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Bình thường",
  high: "Cao",
  urgent: "Khẩn cấp",
}

/**
 * Returns the localized human-readable label for a task priority.
 */
export function formatPriority(priority: string): string {
  return PRIORITY_LABELS[priority] || priority.charAt(0).toUpperCase() + priority.slice(1)
}
