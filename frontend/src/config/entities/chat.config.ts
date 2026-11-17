/**
 * Configuration and domain constants for the independent Chat subsystem.
 * Strictly adheres to Enum Naming Law: UPPER_SNAKE keys, lower_snake_case values matching backend & Prisma.
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

/** Frontend limits shared by chat controls; backend validation remains authoritative. */
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000, // Mirror the backend text limit for client-side controls.
  DEFAULT_PAGE_SIZE: 30, // Default initial history page size; server-side values remain authoritative.
  MAX_PAGE_SIZE: 100, // Mirror the backend cap to avoid requesting an oversized page.
  MAX_FORWARD_CONVERSATIONS: 20, // Mirror the maximum number of forwarding destinations.
} as const
