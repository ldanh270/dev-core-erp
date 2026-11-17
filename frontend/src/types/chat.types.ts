import type {
  IChatMessageType,
  IConversationType,
  IMentionType,
} from "@/config/entities/chat.config"

/**
 * Browser-facing chat DTOs use serialized ISO date strings, unlike backend service DTOs.
 * Keep these shapes aligned with `backend/src/types/chat.types.ts`.
 */
export interface ChatMessageMention {
  /** Entity category associated with the `@`, `#`, or `!` token in message content. */
  type: IMentionType
  id: string
  label: string
  metadata?: {
    code?: string
    status?: string
    priority?: string
  }
}

/** Participant profile and read watermark returned with a conversation summary. */
export interface ConversationParticipantDto {
  /** Membership-row ID, not the employee ID. */
  id: string
  employeeId: string
  fullName: string
  username: string
  avatarUrl?: string | null
  joinedAt: string
  lastReadAt: string
}

/** Serialized chat message returned by REST endpoints and SSE events. */
export interface ChatMessageDto {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string | null
  content: string
  type: IChatMessageType
  /** Serialized attachment metadata; absent for text-only messages. */
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  mentions?: ChatMessageMention[] | null
  /** Recalled messages are rendered as a placeholder with their original payload redacted. */
  isRecalled: boolean
  /** Message pin state is shared with every member of the conversation. */
  isPinned: boolean
  pinnedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type ChatStreamEventType = "message.created" | "message.updated" | "message.recalled"

/** Event envelope used by the authenticated chat SSE stream. */
export interface ChatStreamEvent {
  type: ChatStreamEventType
  message: ChatMessageDto
}

/**
 * Conversation list/detail DTO.
 * Preference and unread fields are calculated for the signed-in employee's membership.
 */
export interface ConversationSummaryDto {
  id: string
  type: IConversationType
  title: string
  avatarUrl?: string | null
  unreadCount: number
  /** Preferences are specific to the current employee's membership. */
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
  lastMessage?: ChatMessageDto | null
  participants: ConversationParticipantDto[]
  createdAt: string
  updatedAt: string
}

/** Partial update to the signed-in employee's preferences for one conversation. */
export interface UpdateParticipantSettingsDto {
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
}

export interface CreateDirectConversationDto {
  /** Employee to chat with; the signed-in employee is inferred by the backend. */
  partnerId: string
}

/** Group creation payload; the backend adds the creator as a participant. */
export interface CreateGroupConversationDto {
  title: string
  participantIds: string[]
  avatarUrl?: string
}

export interface AddChatParticipantsDto {
  /** Employee IDs to add to an existing group. */
  participantIds: string[]
}

/** Message payload accepted by the chat API; the backend validates content and membership. */
export interface SendMessageDto {
  content: string
  type?: IChatMessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mentions?: ChatMessageMention[]
}

/** Existing conversation IDs that should receive a new copy of the source message. */
export interface ForwardMessageDto {
  conversationIds: string[]
}

/** Lightweight employee option returned by `@` autocomplete. */
export interface MentionEmployeeItem {
  id: string
  fullName: string
  username: string
  avatarUrl?: string | null
  position?: string | null
}

/** Lightweight project option returned by `#` autocomplete. */
export interface MentionProjectItem {
  id: string
  name: string
  status: string
  techStack: string[]
}

/** Lightweight task option returned by `!` autocomplete. */
export interface MentionTaskItem {
  id: string
  title: string
  status: string
  priority: string
  projectId: string
  projectName?: string
}
