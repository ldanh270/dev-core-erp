/**
 * Configuration and domain constants for the independent Chat subsystem.
 * Strictly adheres to Enum Naming Law: UPPER_SNAKE keys, lower_snake_case values matching backend & Prisma.
 */

/** Supported conversation categories; values mirror the backend and Prisma schema. */
export const CONVERSATION_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const

/** Runtime values accepted for a conversation type. */
export const CONVERSATION_TYPES = [CONVERSATION_TYPE.DIRECT, CONVERSATION_TYPE.GROUP] as const

/** Union of supported conversation categories. */
export type IConversationType = (typeof CONVERSATION_TYPES)[number]

/** Message payload kinds supported by the chat UI. */
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

/** Union of supported message payload types. */
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

/** Runtime values accepted for structured message mention categories. */
export const MENTION_TYPES = [
  MENTION_TYPE.EMPLOYEE,
  MENTION_TYPE.PROJECT,
  MENTION_TYPE.TASK,
] as const

/** Union of supported mention entity categories. */
export type IMentionType = (typeof MENTION_TYPES)[number]

/** Trigger characters for employee, project, and task autocomplete. */
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
  CONNECT_ERROR: "connect_error",
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

/** Lifecycle event names used in chat message updates and client cache synchronization. */
export const CHAT_STREAM_EVENT = {
  CREATED: "message.created",
  UPDATED: "message.updated",
  RECALLED: "message.recalled",
} as const

export type IChatStreamEventType = (typeof CHAT_STREAM_EVENT)[keyof typeof CHAT_STREAM_EVENT]

/** Frontend limits shared by chat controls; backend validation remains authoritative. */
export const CHAT_CONFIG = {
  MIN_PAGE_SIZE: 1, // Lowest accepted message page size.
  MAX_MESSAGE_LENGTH: 4000, // Mirror the backend text limit for client-side controls.
  MAX_GROUP_TITLE_LENGTH: 100, // Maximum group title length accepted by the backend.
  MIN_GROUP_PARTICIPANTS: 2, // Minimum selected members other than the group creator.
  DEFAULT_PAGE_SIZE: 30, // Default initial history page size; server-side values remain authoritative.
  MAX_PAGE_SIZE: 100, // Mirror the backend cap to avoid requesting an oversized page.
  MAX_UNREAD_BADGE_COUNT: 99, // Cap unread badges before rendering the 99+ label.
  MAX_FORWARD_CONVERSATIONS: 20, // Mirror the maximum number of forwarding destinations.
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
