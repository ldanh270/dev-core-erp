import type {
  IChatMessageType,
  IConversationType,
  IMentionType,
} from "@/configs/entities/chat.config.ts"

/**
 * Parsed mention structure stored alongside chat messages.
 * Supports employees (@), projects (#), and tasks (!).
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

/**
 * Participant details within a conversation
 */
export interface ConversationParticipantDto {
  id: string
  employeeId: string
  fullName: string
  username: string
  avatarUrl?: string | null
  joinedAt: Date
  lastReadAt: Date
}

/**
 * Chat message payload returned to the client
 */
export interface ChatMessageDto {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string | null
  content: string
  type: IChatMessageType
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  mentions?: ChatMessageMention[] | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Conversation summary with last message and unread count
 */
export interface ConversationSummaryDto {
  id: string
  type: IConversationType
  title: string
  avatarUrl?: string | null
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  isRestricted: boolean
  lastMessage?: ChatMessageDto | null
  participants: ConversationParticipantDto[]
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for updating participant preferences (Pin, Mute, Restrict)
 */
export interface UpdateParticipantSettingsDto {
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
}

/**
 * DTO for creating a 1-1 direct conversation
 */
export interface CreateDirectConversationDto {
  partnerId: string
}

/**
 * DTO for creating a group conversation
 */
export interface CreateGroupConversationDto {
  title: string
  participantIds: string[]
  avatarUrl?: string
}

/**
 * DTO for sending a chat message
 */
export interface SendMessageDto {
  content: string
  type?: IChatMessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mentions?: ChatMessageMention[]
}

/**
 * Query DTO for searching mentionable entities (@, #, !)
 */
export interface MentionEmployeeItem {
  id: string
  fullName: string
  username: string
  avatarUrl?: string | null
  position?: string | null
}

export interface MentionProjectItem {
  id: string
  name: string
  status: string
  techStack: string[]
}

export interface MentionTaskItem {
  id: string
  title: string
  status: string
  priority: string
  projectId: string
  projectName?: string
}

/**
 * Chat Repository Interface (DIP - Dependency Inversion Principle)
 */
export interface IChatRepository {
  findConversationsByEmployeeId(employeeId: string): Promise<ConversationSummaryDto[]>
  findConversationById(
    conversationId: string,
    employeeId: string,
  ): Promise<ConversationSummaryDto | null>
  findDirectConversationBetween(
    employeeId1: string,
    employeeId2: string,
  ): Promise<ConversationSummaryDto | null>
  createConversation(data: {
    type: IConversationType
    title?: string
    avatarUrl?: string
    creatorId: string
    participantIds: string[]
  }): Promise<ConversationSummaryDto>
  addParticipants(conversationId: string, participantIds: string[]): Promise<void>
  isParticipant(conversationId: string, employeeId: string): Promise<boolean>
  findMessages(
    conversationId: string,
    options: { limit: number; beforeCursor?: string; searchQuery?: string },
  ): Promise<ChatMessageDto[]>
  createMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto>
  updateLastRead(conversationId: string, employeeId: string): Promise<void>
  searchEmployeesForMention(query: string, limit?: number): Promise<MentionEmployeeItem[]>
  searchProjectsForMention(query: string, limit?: number): Promise<MentionProjectItem[]>
  searchTasksForMention(
    query: string,
    limit?: number,
    projectId?: string,
  ): Promise<MentionTaskItem[]>
  updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void>
  deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void>
}

/**
 * Chat Service Interface (DIP)
 */
export interface IChatService {
  getMyConversations(employeeId: string): Promise<ConversationSummaryDto[]>
  getConversationDetail(conversationId: string, employeeId: string): Promise<ConversationSummaryDto>
  getOrCreateDirectConversation(
    currentUserId: string,
    partnerId: string,
  ): Promise<ConversationSummaryDto>
  createGroupConversation(
    currentUserId: string,
    data: CreateGroupConversationDto,
  ): Promise<ConversationSummaryDto>
  addParticipants(
    conversationId: string,
    employeeId: string,
    participantIds: string[],
  ): Promise<ConversationSummaryDto>
  getMessages(
    conversationId: string,
    employeeId: string,
    limit?: number,
    beforeCursor?: string,
  ): Promise<ChatMessageDto[]>
  searchMessages(
    conversationId: string,
    employeeId: string,
    query: string,
  ): Promise<ChatMessageDto[]>
  sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto>
  markAsRead(conversationId: string, employeeId: string): Promise<void>
  searchMentionEmployees(query: string, limit?: number): Promise<MentionEmployeeItem[]>
  searchMentionProjects(query: string, limit?: number): Promise<MentionProjectItem[]>
  searchMentionTasks(query: string, limit?: number, projectId?: string): Promise<MentionTaskItem[]>
  subscribeToChatStream(
    employeeId: string,
    onMessage: (message: ChatMessageDto) => void,
  ): () => void
  updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void>
  deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void>
}
