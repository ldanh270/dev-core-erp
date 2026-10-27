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
 */
export const TASK_CREATION_POLICY = {
  LEADER_ONLY: "leader_only",
  ALL_MEMBERS: "all_members",
} as const

/**
 * Array of all valid task creation policies
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

/** working_day = 1× rate; overtime = OT multiplier in PT payroll (see spent-time.config). */
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

export const SPENT_TIME_STATUS_LABELS: Record<(typeof SPENT_TIME_STATUSES)[number], string> = {
  [SPENT_TIME_STATUS.PENDING]: "Chờ duyệt",
  [SPENT_TIME_STATUS.APPROVED]: "Đã duyệt",
  [SPENT_TIME_STATUS.REJECTED]: "Từ chối",
}

/** remote: Spent Time only | onsite: one GPS check-in/day, then Spent Time */
export const PROJECT_MEMBER_WORK_MODE = {
  REMOTE: "remote",
  ONSITE: "onsite",
} as const

export const PROJECT_MEMBER_WORK_MODES = [
  PROJECT_MEMBER_WORK_MODE.REMOTE,
  PROJECT_MEMBER_WORK_MODE.ONSITE,
] as const

export const PROJECT_MEMBER_WORK_MODE_LABELS: Record<(typeof PROJECT_MEMBER_WORK_MODES)[number], string> = {
  [PROJECT_MEMBER_WORK_MODE.REMOTE]: "Remote",
  [PROJECT_MEMBER_WORK_MODE.ONSITE]: "Onsite",
}

export type SpentTimeStatusValue = (typeof SPENT_TIME_STATUSES)[number]
export type ProjectMemberWorkModeValue = (typeof PROJECT_MEMBER_WORK_MODES)[number]

export function getSpentTimeStatusLabel(status: string): string {
  switch (status) {
    case SPENT_TIME_STATUS.PENDING:
      return SPENT_TIME_STATUS_LABELS[SPENT_TIME_STATUS.PENDING]
    case SPENT_TIME_STATUS.APPROVED:
      return SPENT_TIME_STATUS_LABELS[SPENT_TIME_STATUS.APPROVED]
    case SPENT_TIME_STATUS.REJECTED:
      return SPENT_TIME_STATUS_LABELS[SPENT_TIME_STATUS.REJECTED]
    default:
      return status
  }
}

export function getProjectMemberWorkModeLabel(mode: string): string {
  switch (mode) {
    case PROJECT_MEMBER_WORK_MODE.REMOTE:
      return PROJECT_MEMBER_WORK_MODE_LABELS[PROJECT_MEMBER_WORK_MODE.REMOTE]
    case PROJECT_MEMBER_WORK_MODE.ONSITE:
      return PROJECT_MEMBER_WORK_MODE_LABELS[PROJECT_MEMBER_WORK_MODE.ONSITE]
    default:
      return mode
  }
}

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

/**
 * Centralized color palette for Kanban column customization
 */
export const KANBAN_PALETTE_COLORS = [
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
] as const

export const DEFAULT_KANBAN_COLOR: string = "#6366F1"
