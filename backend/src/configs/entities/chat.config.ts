/**
 * Configuration and domain constants for the independent Chat subsystem.
 * Strictly adheres to Enum Naming Law: UPPER_SNAKE keys, lower_snake_case values matching Prisma.
 */

export const CONVERSATION_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const

/** Runtime values accepted for a conversation type; kept in sync with Prisma's ConversationType. */
export const CONVERSATION_TYPES = [CONVERSATION_TYPE.DIRECT, CONVERSATION_TYPE.GROUP] as const

export type IConversationType = (typeof CONVERSATION_TYPES)[number]

/** Message payload kinds. Attachments use file metadata while text remains in `content`. */
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
 * Entity categories that can be referenced from a message.
 * The matching trigger characters are defined separately in `MENTION_PREFIX`.
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

/**
 * Shared backend limits and timing values for chat requests.
 * Pagination and message limits are enforced by the service; the SSE interval is in milliseconds.
 */
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000, // Maximum text length accepted for one message.
  DEFAULT_PAGE_SIZE: 30, // Number of messages returned when the client omits a page size.
  MAX_PAGE_SIZE: 100, // Service-side ceiling applied even when a caller requests more.
  MAX_GROUP_MEMBERS: 100, // Maximum current group size allowed when adding members.
  MAX_FORWARD_CONVERSATIONS: 20, // Bound one forward operation to a manageable number of destinations.
  KEEP_ALIVE_INTERVAL_MS: 15000, // SSE heartbeat interval; measured in milliseconds.
  SEARCH_PAGE_SIZE: 50, // Maximum number of messages returned by a history search.
} as const

/** Stable application error codes paired with user-facing messages for chat failures. */
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
  MESSAGE_NOT_FOUND: {
    message: "Tin nhắn không tồn tại hoặc bạn không có quyền truy cập.",
    code: "CHAT_MESSAGE_NOT_FOUND",
  },
  MESSAGE_OWNER_REQUIRED: {
    message: "Chỉ người gửi mới có thể chỉnh sửa hoặc thu hồi tin nhắn.",
    code: "CHAT_MESSAGE_OWNER_REQUIRED",
  },
  MESSAGE_ALREADY_RECALLED: {
    message: "Tin nhắn này đã được thu hồi.",
    code: "CHAT_MESSAGE_ALREADY_RECALLED",
  },
  INVALID_FORWARD_DESTINATIONS: {
    message: "Vui lòng chọn ít nhất một cuộc trò chuyện hợp lệ để chuyển tiếp.",
    code: "CHAT_INVALID_FORWARD_DESTINATIONS",
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
