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

/** Frontend limits shared by chat controls; backend validation remains authoritative. */
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000, // Mirror the backend text limit for client-side controls.
  DEFAULT_PAGE_SIZE: 30, // Default initial history page size; server-side values remain authoritative.
  MAX_PAGE_SIZE: 100, // Mirror the backend cap to avoid requesting an oversized page.
  MAX_FORWARD_CONVERSATIONS: 20, // Mirror the maximum number of forwarding destinations.
} as const
