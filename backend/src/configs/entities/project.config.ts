/**
 * Project status enumeration
 * Represents the lifecycle states of a project
 */
export const PROJECT_STATUS = {
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

/**
 * Array of all valid project statuses
 * Used for validation and filtering
 */
export const PROJECT_STATUSES = [
  PROJECT_STATUS.PLANNING,
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.ON_HOLD,
  PROJECT_STATUS.COMPLETED,
  PROJECT_STATUS.CANCELLED,
] as const
/**
 * Task creation policy enumeration
 * Defines who can create tasks within a project
 */
export const TASK_CREATION_POLICY = {
  LEADER_ONLY: "leader_only",
  ALL_MEMBERS: "all_members",
} as const
/**
 * Array of all valid task creation policies
 * Used for validation and filtering
 */
export const TASK_CREATION_POLICIES = [
  TASK_CREATION_POLICY.LEADER_ONLY,
  TASK_CREATION_POLICY.ALL_MEMBERS,
] as const
/**
 * Task priority levels enumeration
 */
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const TASK_PRIORITIES = [
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.URGENT,
] as const

/**
 * Task status enumeration
 * Represents the workflow states of a task
 */
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
  CANCELLED: "cancelled",
  REOPENED: "reopened",
} as const

export const TASK_STATUSES = [
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.IN_REVIEW,
  TASK_STATUS.DONE,
  TASK_STATUS.CANCELLED,
  TASK_STATUS.REOPENED,
] as const

export const CUSTOM_QUERY_TYPE = {
  GANTT: "gantt",
} as const

/**
 * Default Kanban statuses created for every new project.
 * Centralized here so ProjectService and ProjectTaskStatusService
 * both reference the same source of truth — no inline duplication.
 */
export const DEFAULT_PROJECT_TASK_STATUSES = [
  { name: "To Do", color: "#6366F1", order: 0, isDefault: true, isCompleted: false },
  { name: "In Progress", color: "#3B82F6", order: 1, isDefault: false, isCompleted: false },
  { name: "In Review", color: "#F59E0B", order: 2, isDefault: false, isCompleted: false },
  { name: "Done", color: "#10B981", order: 3, isDefault: false, isCompleted: true },
  { name: "Cancelled", color: "#EF4444", order: 4, isDefault: false, isCompleted: true },
  { name: "Reopened", color: "#8B5CF6", order: 5, isDefault: false, isCompleted: false },
] as const

/**
 * Keyword map for mapping custom status names → legacy TaskStatus enum.
 * Extend this map when new status keywords are needed (e.g., new locales).
 * Used by mapStatusNameToEnum in status-mapping.util.ts.
 */
export const STATUS_KEYWORD_MAP = {
  TODO: ["todo", "to do", "cần làm", "chuẩn bị"],
  IN_PROGRESS: ["in progress", "in_progress", "đang làm", "đang thực hiện"],
  IN_REVIEW: ["review", "đánh giá", "kiểm tra"],
  DONE: ["done", "hoàn thành", "đã xong", "đóng", "closed"],
  CANCELLED: ["cancel", "hủy"],
  REOPENED: ["reopen", "mở lại"],
} as const

/**
 * Spent time activity types
 */
export const SPENT_TIME_ACTIVITY = {
  DEVELOP: "develop",
  DESIGN: "design",
  TEST: "test",
  MANAGE: "manage",
  OTHER: "other",
} as const

export const SPENT_TIME_ACTIVITIES = [
  SPENT_TIME_ACTIVITY.DEVELOP,
  SPENT_TIME_ACTIVITY.DESIGN,
  SPENT_TIME_ACTIVITY.TEST,
  SPENT_TIME_ACTIVITY.MANAGE,
  SPENT_TIME_ACTIVITY.OTHER,
] as const

/**
 * Spent time work time types — overtime uses SPENT_TIME_RULES.OVERTIME_MULTIPLIER in PT payroll.
 */
export const SPENT_TIME_WORK_TIME_TYPE = {
  WORKING_DAY: "working_day",
  OVERTIME: "overtime",
} as const

export const SPENT_TIME_WORK_TIME_TYPES = [
  SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
  SPENT_TIME_WORK_TIME_TYPE.OVERTIME,
] as const

/** pending → lead review | approved → payroll | rejected → excluded from totals */
export const SPENT_TIME_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export const SPENT_TIME_STATUSES = [
  SPENT_TIME_STATUS.PENDING,
  SPENT_TIME_STATUS.APPROVED,
  SPENT_TIME_STATUS.REJECTED,
] as const

/**
 * Project member work mode (remote vs onsite GPS check-in)
 * remote: Spent Time only | onsite: one GPS check-in per day, then Spent Time
 */
export const PROJECT_MEMBER_WORK_MODE = {
  REMOTE: "remote",
  ONSITE: "onsite",
} as const

export const PROJECT_MEMBER_WORK_MODES = [
  PROJECT_MEMBER_WORK_MODE.REMOTE,
  PROJECT_MEMBER_WORK_MODE.ONSITE,
] as const

/**
 * Task tracker enumeration
 */
export const TASK_TRACKER = {
  FEATURE: "feature",
  BUG: "bug",
  SUPPORT: "support",
  TASK: "task",
  MEETING: "meeting",
  TEST: "test",
  SUBTASK: "subtask",
  MANAGEMENT: "management",
} as const

/**
 * Array of all valid task trackers
 */
export const TASK_TRACKERS = [
  TASK_TRACKER.FEATURE,
  TASK_TRACKER.BUG,
  TASK_TRACKER.SUPPORT,
  TASK_TRACKER.TASK,
  TASK_TRACKER.MEETING,
  TASK_TRACKER.TEST,
  TASK_TRACKER.SUBTASK,
  TASK_TRACKER.MANAGEMENT,
] as const

/**
 * Project roles enumeration
 */
export const PROJECT_ROLE = {
  LEADER: "leader",
  DEVELOPER: "developer",
  TESTER: "tester",
  VIEWER: "viewer",
} as const

export const PROJECT_ROLES = [
  PROJECT_ROLE.LEADER,
  PROJECT_ROLE.DEVELOPER,
  PROJECT_ROLE.TESTER,
  PROJECT_ROLE.VIEWER,
] as const
