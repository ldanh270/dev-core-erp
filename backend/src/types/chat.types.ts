import type {
  IChatMessageType,
  IConversationType,
  IMentionType,
} from "@/configs/entities/chat.config.ts"

/**
 * Structured entity reference associated with a message.
 * The UI also embeds a token in `content`; this optional object carries a typed ID and display metadata.
 */
export interface ChatMessageMention {
  type: IMentionType
  id: string
  label: string
  metadata?: {
    code?: string
    status?: string
    priority?: string
  }
}

/** Participant profile and per-conversation read position returned by the backend. */
export interface ConversationParticipantDto {
  /** Membership-row ID; differs from `employeeId`, which identifies the person. */
  id: string
  employeeId: string
  fullName: string
  username: string
  avatarUrl?: string | null
  joinedAt: Date
  /** Read watermark used to calculate this member's unread count. */
  lastReadAt: Date
}

/**
 * Message shape shared by REST responses and real-time events.
 * Dates are `Date` values in the service layer and are serialized by Express at the HTTP boundary.
 */
export interface ChatMessageDto {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string | null
  content: string
  type: IChatMessageType
  /** Attachment fields are null/omitted for text-only messages. */
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  mentions?: ChatMessageMention[] | null
  /** True when the sender recalled the message; content and attachment fields are then redacted. */
  isRecalled: boolean
  /** Pin state is shared by all participants in the conversation. */
  isPinned: boolean
  pinnedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ChatStreamEventType = "message.created" | "message.updated" | "message.recalled"

/** Event envelope sent to chat participants over Socket.IO. */
export interface ChatStreamEvent {
  type: ChatStreamEventType
  message: ChatMessageDto
}

/**
 * Conversation list/detail shape, including only the requesting member's unread and preference state.
 * Direct-chat title/avatar values are resolved to the other participant by the repository.
 */
export interface ConversationSummaryDto {
  id: string
  type: IConversationType
  title: string
  avatarUrl?: string | null
  unreadCount: number
  /** These preference flags belong to the requesting employee, not the whole conversation. */
  isPinned: boolean
  isMuted: boolean
  isRestricted: boolean
  lastMessage?: ChatMessageDto | null
  participants: ConversationParticipantDto[]
  createdAt: Date
  updatedAt: Date
}

/** Partial update of preferences stored on the current employee's participant record. */
export interface UpdateParticipantSettingsDto {
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
}

/** Input for opening a direct conversation; the authenticated employee is supplied separately. */
export interface CreateDirectConversationDto {
  /** Employee other than the authenticated caller. */
  partnerId: string
}

/**
 * Input for creating a group. `participantIds` names the other members; the service adds the creator.
 */
export interface CreateGroupConversationDto {
  title: string
  /** Other members to add; the service adds the authenticated creator. */
  participantIds: string[]
  avatarUrl?: string
}

/**
 * Message creation input. At least text or an attachment URL must be present.
 * Mention metadata is optional because the renderer can also read tokens from `content`.
 */
export interface SendMessageDto {
  content: string
  type?: IChatMessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
  /** Optional references corresponding to mention tokens embedded in `content`. */
  mentions?: ChatMessageMention[]
}

/** Target conversations for a single source message being forwarded as new messages. */
export interface ForwardMessageDto {
  conversationIds: string[]
}

/** Lightweight employee result used by mention autocomplete and member pickers. */
export interface MentionEmployeeItem {
  id: string
  fullName: string
  username: string
  avatarUrl?: string | null
  position?: string | null
}

/** Lightweight project result used to render `#` autocomplete choices. */
export interface MentionProjectItem {
  id: string
  name: string
  status: string
  techStack: string[]
}

/** Lightweight task result used to render `!` autocomplete choices. */
export interface MentionTaskItem {
  id: string
  title: string
  status: string
  priority: string
  projectId: string
  projectName?: string
}

/**
 * Persistence contract for chat operations.
 * Methods that accept an employee ID scope reads or mutations to that employee's membership.
 */
export interface IChatRepository {
  /** List visible memberships with per-member unread counts and the latest visible message. */
  findConversationsByEmployeeId(employeeId: string): Promise<ConversationSummaryDto[]>
  /** Return null for missing, globally deleted, or non-member conversations. */
  findConversationById(
    conversationId: string,
    employeeId: string,
  ): Promise<ConversationSummaryDto | null>
  /** Find a visible direct conversation containing both employees, if one exists. */
  findDirectConversationBetween(
    employeeId1: string,
    employeeId2: string,
  ): Promise<ConversationSummaryDto | null>
  /** Persist the conversation and its initial memberships as one atomic operation. */
  createConversation(data: {
    type: IConversationType
    title?: string
    avatarUrl?: string
    creatorId: string
    participantIds: string[]
  }): Promise<ConversationSummaryDto>
  /** Add memberships or reactivate existing soft-deleted membership rows. */
  addParticipants(conversationId: string, participantIds: string[]): Promise<void>
  /** Check for an active membership; hidden memberships do not grant access. */
  isParticipant(conversationId: string, employeeId: string): Promise<boolean>
  /** Fetch a page oldest-to-newest; cursor message time is the exclusive upper boundary. */
  findMessages(
    conversationId: string,
    options: { limit: number; beforeCursor?: string; searchQuery?: string },
  ): Promise<ChatMessageDto[]>
  /** Create a message and return the enriched DTO including sender display data. */
  createMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto>
  /** Find a message only through an active membership in its conversation. */
  findMessageById(messageId: string, employeeId: string): Promise<ChatMessageDto | null>
  /** Update message text only while it is active and owned by the sender. */
  editMessage(messageId: string, senderId: string, content: string): Promise<ChatMessageDto | null>
  /** Soft-recall an active message only while it is owned by the sender. */
  recallMessage(messageId: string, senderId: string): Promise<ChatMessageDto | null>
  /** Set the shared pin state for an active message in a conversation the employee can access. */
  setMessagePinned(
    messageId: string,
    employeeId: string,
    isPinned: boolean,
  ): Promise<ChatMessageDto | null>
  /** Create forwarded copies in all targets atomically; null means the source or a target is inaccessible. */
  forwardMessage(
    messageId: string,
    senderId: string,
    conversationIds: string[],
  ): Promise<ChatMessageDto[] | null>
  /** Advance the employee's read watermark for the conversation. */
  updateLastRead(conversationId: string, employeeId: string): Promise<void>
  /** Search active employees by display name or username for `@` autocomplete. */
  searchEmployeesForMention(query: string, limit?: number): Promise<MentionEmployeeItem[]>
  /** Search projects by name for `#` autocomplete. */
  searchProjectsForMention(query: string, limit?: number): Promise<MentionProjectItem[]>
  /** Search tasks by title for `!` autocomplete, optionally restricted to one project. */
  searchTasksForMention(
    query: string,
    limit?: number,
    projectId?: string,
  ): Promise<MentionTaskItem[]>
  /** Update only the current participant's personal conversation preferences. */
  updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void>
  /** Hide the conversation for one employee without deleting shared messages. */
  deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void>
}

/**
 * Business-logic contract for chat.
 * The service validates participant access and domain rules before calling the repository.
 */
export interface IChatService {
  /** List the authenticated employee's visible conversations. */
  getMyConversations(employeeId: string): Promise<ConversationSummaryDto[]>
  /** Resolve a conversation only when the employee is an active participant. */
  getConversationDetail(conversationId: string, employeeId: string): Promise<ConversationSummaryDto>
  /** Return an existing direct conversation or create one after validating the partner. */
  getOrCreateDirectConversation(
    currentUserId: string,
    partnerId: string,
  ): Promise<ConversationSummaryDto>
  /** Create a group; `participantIds` excludes the caller and must satisfy group rules. */
  createGroupConversation(
    currentUserId: string,
    data: CreateGroupConversationDto,
  ): Promise<ConversationSummaryDto>
  /** Add validated active employees to a group the caller can access. */
  addParticipants(
    conversationId: string,
    employeeId: string,
    participantIds: string[],
  ): Promise<ConversationSummaryDto>
  /** Fetch a bounded message page and advance the caller's read watermark. */
  getMessages(
    conversationId: string,
    employeeId: string,
    limit?: number,
    beforeCursor?: string,
  ): Promise<ChatMessageDto[]>
  /** Search message text after verifying conversation membership. */
  searchMessages(
    conversationId: string,
    employeeId: string,
    query: string,
  ): Promise<ChatMessageDto[]>
  /** Persist a message and publish it to the other participants' real-time channels. */
  sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto>
  /** Edit text only when the caller is the sender of an active message. */
  editMessage(messageId: string, employeeId: string, content: string): Promise<ChatMessageDto>
  /** Soft-recall one of the caller's messages for every conversation participant. */
  recallMessage(messageId: string, employeeId: string): Promise<ChatMessageDto>
  /** Pin or unpin a message for the whole conversation. */
  setMessagePinned(
    messageId: string,
    employeeId: string,
    isPinned: boolean,
  ): Promise<ChatMessageDto>
  /** Forward an active message as new messages to one or more accessible conversations. */
  forwardMessage(
    messageId: string,
    employeeId: string,
    conversationIds: string[],
  ): Promise<ChatMessageDto[]>
  /** Explicitly advance the caller's read watermark. */
  markAsRead(conversationId: string, employeeId: string): Promise<void>
  /** Search active employee records for `@` mention selection. */
  searchMentionEmployees(query: string, limit?: number): Promise<MentionEmployeeItem[]>
  /** Search project records for `#` mention selection. */
  searchMentionProjects(query: string, limit?: number): Promise<MentionProjectItem[]>
  /** Search task records for `!` mention selection, optionally by project. */
  searchMentionTasks(query: string, limit?: number, projectId?: string): Promise<MentionTaskItem[]>
  /** Update per-employee pin, mute, or restriction flags after access validation. */
  updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void>
  /** Hide a conversation from the caller's list while preserving other members' history. */
  deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void>
}
