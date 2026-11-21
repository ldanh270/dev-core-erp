/**
 * Configuration and domain constants for the independent Chat subsystem.
 * Strictly adheres to Enum Naming Law: UPPER_SNAKE keys, lower_snake_case values matching Prisma.
 */

/** Supported conversation categories persisted by the chat subsystem. */
export const CONVERSATION_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const

/** Runtime values accepted for a conversation type; kept in sync with Prisma's ConversationType. */
export const CONVERSATION_TYPES = [CONVERSATION_TYPE.DIRECT, CONVERSATION_TYPE.GROUP] as const

/** Union of conversation categories accepted by chat APIs and services. */
export type IConversationType = (typeof CONVERSATION_TYPES)[number]

/** Message payload kinds. Attachments use file metadata while text remains in `content`. */
export const CHAT_MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
} as const

/** Runtime values accepted for a message payload type. */
export const CHAT_MESSAGE_TYPES = [
  CHAT_MESSAGE_TYPE.TEXT,
  CHAT_MESSAGE_TYPE.IMAGE,
  CHAT_MESSAGE_TYPE.FILE,
] as const

/** Union of message payload types accepted by chat APIs and services. */
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

/** Runtime values accepted for a structured message mention. */
export const MENTION_TYPES = [
  MENTION_TYPE.EMPLOYEE,
  MENTION_TYPE.PROJECT,
  MENTION_TYPE.TASK,
] as const

/** Union of entity categories that can be referenced in a message. */
export type IMentionType = (typeof MENTION_TYPES)[number]

/** Trigger characters used for employee, project, and task autocomplete. */
export const MENTION_PREFIX = {
  EMPLOYEE: "@",
  PROJECT: "#",
  TASK: "!",
} as const

/** Mention entity identifiers serialized in markdown-style tokens (e.g. @[Name](emp:id)). */
export const MENTION_TOKEN_ENTITY = {
  EMPLOYEE: "emp",
  PROJECT: "proj",
  TASK: "task",
} as const

export type IMentionTokenEntity = (typeof MENTION_TOKEN_ENTITY)[keyof typeof MENTION_TOKEN_ENTITY]

/** Filter categories for conversation list view: all, direct, or group. */
export const CHAT_CONVERSATION_FILTER = {
  ALL: "all",
  DIRECT: CONVERSATION_TYPE.DIRECT,
  GROUP: CONVERSATION_TYPE.GROUP,
} as const

export const CHAT_CONVERSATION_FILTERS = [
  CHAT_CONVERSATION_FILTER.ALL,
  CHAT_CONVERSATION_FILTER.DIRECT,
  CHAT_CONVERSATION_FILTER.GROUP,
] as const

export type IChatConversationFilter = (typeof CHAT_CONVERSATION_FILTERS)[number]

/** Standard UI button variants used across chat interface controls. */
export const CHAT_BUTTON_VARIANT = {
  DEFAULT: "default",
  GHOST: "ghost",
  OUTLINE: "outline",
  DESTRUCTIVE: "destructive",
  SECONDARY: "secondary",
} as const

export type IChatButtonVariant = (typeof CHAT_BUTTON_VARIANT)[keyof typeof CHAT_BUTTON_VARIANT]

/** Standard UI button sizes used across chat interface controls. */
export const CHAT_BUTTON_SIZE = {
  DEFAULT: "default",
  SM: "sm",
  LG: "lg",
  ICON: "icon",
  XS: "xs",
  ICON_XS: "icon-xs",
  ICON_SM: "icon-sm",
} as const

export type IChatButtonSize = (typeof CHAT_BUTTON_SIZE)[keyof typeof CHAT_BUTTON_SIZE]

/** User-facing receipt status labels for message delivery and read indicators. */
export const CHAT_RECEIPT_STATUS = {
  READ: "Đã xem",
  DELIVERED: "Đã nhận",
  SENT: "Đã gửi",
} as const

export type IChatReceiptStatus = (typeof CHAT_RECEIPT_STATUS)[keyof typeof CHAT_RECEIPT_STATUS]

/** Realtime WebSocket event names for chat messaging and presence. */
export const CHAT_SOCKET_EVENT = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting",
  MESSAGE: "chat:message",
  PRESENCE_SNAPSHOT: "presence:snapshot",
  PRESENCE_CHANGED: "presence:changed",
  TYPING_CHANGED: "typing:changed",
  CONVERSATION_READ: "conversation:read",
  MESSAGE_STATUS: "message:status",
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  ERROR: "chat:error",
} as const

export type IChatSocketEvent = (typeof CHAT_SOCKET_EVENT)[keyof typeof CHAT_SOCKET_EVENT]

/** Lifecycle event names used in persisted chat message updates and client cache synchronization. */
export const CHAT_STREAM_EVENT = {
  CREATED: "message.created",
  UPDATED: "message.updated",
  RECALLED: "message.recalled",
} as const

export type IChatStreamEventType = (typeof CHAT_STREAM_EVENT)[keyof typeof CHAT_STREAM_EVENT]

/**
 * Shared backend limits and timing values for chat requests.
 * Pagination and message limits are enforced by the service.
 */
export const CHAT_CONFIG = {
  MIN_PAGE_SIZE: 1, // Lowest accepted page size after service-side clamping.
  MAX_MESSAGE_LENGTH: 4000, // Maximum text length accepted for one message.
  MAX_GROUP_TITLE_LENGTH: 100, // Maximum title length accepted for a group conversation.
  MIN_GROUP_PARTICIPANTS: 2, // Minimum number of members other than the group creator.
  DEFAULT_PAGE_SIZE: 30, // Number of messages returned when the client omits a page size.
  MAX_PAGE_SIZE: 100, // Service-side ceiling applied even when a caller requests more.
  MAX_GROUP_MEMBERS: 100, // Maximum current group size allowed when adding members.
  MAX_UNREAD_BADGE_COUNT: 99, // Cap unread badges before rendering the 99+ label.
  MAX_FORWARD_CONVERSATIONS: 20, // Bound one forward operation to a manageable number of destinations.
  SEARCH_PAGE_SIZE: 50, // Maximum number of messages returned by a history search.
  MENTION_SUGGESTION_LIMIT: 8, // Default number of mention candidates returned.
  NEW_CHAT_EMPLOYEE_SEARCH_LIMIT: 15, // Number of employees shown when starting a conversation.
  GROUP_MEMBER_SEARCH_LIMIT: 20, // Number of employee candidates shown when adding members.
  MIN_SEARCH_QUERY_LENGTH: 2, // Minimum text length before running chat searches.
  MENTION_SEARCH_DEBOUNCE_MS: 150, // Delay for mention autocomplete requests.
  GROUP_MEMBER_SEARCH_DEBOUNCE_MS: 200, // Delay for group-member lookup requests.
  MESSAGE_SEARCH_DEBOUNCE_MS: 250, // Delay for conversation message search requests.
  MENTION_FOCUS_DELAY_MS: 10, // Delay before restoring the composer cursor after insertion.
  MAX_ATTACHMENT_SIZE_BYTES: 25 * 1024 * 1024, // 25MB max file attachment limit.
  TYPING_DEBOUNCE_MS: 1500, // Inactivity threshold before clearing typing state.
  TYPING_TIMEOUT_MS: 3000, // Failsafe timeout for incoming typing indicators.
  SOCKET_ACK_TIMEOUT_MS: 5000, // Delivery acknowledgment timeout for Socket.IO events.
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
