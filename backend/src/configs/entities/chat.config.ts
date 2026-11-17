/**
 * Configuration and domain constants for the independent Chat subsystem.
 * Strictly adheres to Enum Naming Law: UPPER_SNAKE keys, lower_snake_case values matching Prisma.
 */

export const CONVERSATION_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const

export const CONVERSATION_TYPES = [CONVERSATION_TYPE.DIRECT, CONVERSATION_TYPE.GROUP] as const

export type IConversationType = (typeof CONVERSATION_TYPES)[number]

export const CHAT_MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
} as const

export const CHAT_MESSAGE_TYPES = [
  CHAT_MESSAGE_TYPE.TEXT,
  CHAT_MESSAGE_TYPE.IMAGE,
  CHAT_MESSAGE_TYPE.FILE,
] as const

export type IChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]

/**
 * Multi-entity Mention types and prefixes according to Leader specification:
 * - @ for Employee mention
 * - # for Project mention
 * - ! for Task mention
 */
export const MENTION_TYPE = {
  EMPLOYEE: "employee",
  PROJECT: "project",
  TASK: "task",
} as const

export const MENTION_TYPES = [
  MENTION_TYPE.EMPLOYEE,
  MENTION_TYPE.PROJECT,
  MENTION_TYPE.TASK,
] as const

export type IMentionType = (typeof MENTION_TYPES)[number]

export const MENTION_PREFIX = {
  EMPLOYEE: "@",
  PROJECT: "#",
  TASK: "!",
} as const

export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  DEFAULT_PAGE_SIZE: 30,
  MAX_PAGE_SIZE: 100,
  MAX_GROUP_MEMBERS: 100,
  KEEP_ALIVE_INTERVAL_MS: 15000,
  SEARCH_PAGE_SIZE: 50,
} as const

export const CHAT_ERRORS = {
  CONVERSATION_NOT_FOUND: {
    message: "Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập.",
    code: "CHAT_CONVERSATION_NOT_FOUND",
  },
  CANNOT_CHAT_WITH_SELF: {
    message: "Không thể tạo cuộc trò chuyện 1-1 với chính mình.",
    code: "CHAT_CANNOT_CHAT_WITH_SELF",
  },
  INVALID_GROUP_PARTICIPANTS: {
    message: "Nhóm chat phải có ít nhất 2 thành viên khác ngoài bạn.",
    code: "CHAT_INVALID_GROUP_PARTICIPANTS",
  },
  MESSAGE_CONTENT_REQUIRED: {
    message: "Nội dung tin nhắn không được để trống.",
    code: "CHAT_MESSAGE_CONTENT_REQUIRED",
  },
  UNAUTHORIZED_PARTICIPANT: {
    message: "Bạn không phải là thành viên của cuộc trò chuyện này.",
    code: "CHAT_UNAUTHORIZED_PARTICIPANT",
  },
  EMPLOYEE_NOT_FOUND: {
    message: "Nhân viên được chọn không tồn tại hoặc không hoạt động.",
    code: "CHAT_EMPLOYEE_NOT_FOUND",
  },
  GROUP_MEMBER_LIMIT_REACHED: {
    message: "Nhóm chat đã đạt giới hạn thành viên.",
    code: "CHAT_GROUP_MEMBER_LIMIT_REACHED",
  },
  GROUP_CONVERSATION_REQUIRED: {
    message: "Chỉ có thể thêm thành viên vào cuộc trò chuyện nhóm.",
    code: "CHAT_GROUP_CONVERSATION_REQUIRED",
  },
} as const
