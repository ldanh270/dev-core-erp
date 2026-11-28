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

/**
 * Formats a number to Vietnamese Dong currency string.
 */
export function formatCurrencyVND(val: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

/**
 * Formats a date string into Vietnamese locale format.
 */
export function formatDateVN(dateString?: string): string {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("vi-VN")
}

