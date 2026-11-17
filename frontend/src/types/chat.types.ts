import type {
  IChatMessageType,
  IConversationType,
  IMentionType,
} from "@/config/entities/chat.config"

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

export interface ConversationParticipantDto {
  id: string
  employeeId: string
  fullName: string
  username: string
  avatarUrl?: string | null
  joinedAt: string
  lastReadAt: string
}

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
  createdAt: string
  updatedAt: string
}

export interface ConversationSummaryDto {
  id: string
  type: IConversationType
  title: string
  avatarUrl?: string | null
  unreadCount: number
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
  lastMessage?: ChatMessageDto | null
  participants: ConversationParticipantDto[]
  createdAt: string
  updatedAt: string
}

export interface UpdateParticipantSettingsDto {
  isPinned?: boolean
  isMuted?: boolean
  isRestricted?: boolean
}

export interface CreateDirectConversationDto {
  partnerId: string
}

export interface CreateGroupConversationDto {
  title: string
  participantIds: string[]
  avatarUrl?: string
}

export interface SendMessageDto {
  content: string
  type?: IChatMessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mentions?: ChatMessageMention[]
}

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
