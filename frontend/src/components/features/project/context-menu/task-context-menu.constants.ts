export const TRACKER_OPTIONS = [
  { label: "Lỗi (Bug)", value: "bug" },
  { label: "Tính năng", value: "feature" },
  { label: "Hỗ trợ", value: "support" },
  { label: "Nhiệm vụ", value: "task" },
]

export const PRIORITY_OPTIONS = [
  { label: "Thấp", value: "low" },
  { label: "Trung bình", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Khẩn cấp", value: "urgent" },
]

/** Progress percentage choices for quick status changes via context menu. */
export const PROGRESS_OPTIONS = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]

export const DEFAULT_STATUSES = [
  { id: "todo", name: "Đang mở" },
  { id: "in_progress", name: "Đang làm" },
  { id: "in_review", name: "Đánh giá" },
  { id: "done", name: "Hoàn thành" },
  { id: "cancelled", name: "Đã hủy" },
]
