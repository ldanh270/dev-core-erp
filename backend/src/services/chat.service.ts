import {
  CHAT_CONFIG,
  CHAT_ERRORS,
  CONVERSATION_TYPE,
} from "@/configs/entities/chat.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import type { IEmployeeRepository } from "@/types/employee.types.ts"
import type {
  ChatMessageDto,
  ConversationSummaryDto,
  CreateGroupConversationDto,
  IChatRepository,
  IChatService,
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
  SendMessageDto,
  UpdateParticipantSettingsDto,
} from "@/types/chat.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service orchestrating chat operations, access control, and real-time message distribution.
 * Adheres to Clean Architecture and S.O.L.I.D. principles.
 */
export class ChatService implements IChatService {
  constructor(
    private readonly chatRepo: IChatRepository,
    private readonly employeeRepo: IEmployeeRepository,
    private readonly bus = eventBus,
  ) {}

  /**
   * Retrieves all conversations for the authenticated user.
   */
  async getMyConversations(employeeId: string): Promise<ConversationSummaryDto[]> {
    return this.chatRepo.findConversationsByEmployeeId(employeeId)
  }

  /**
   * Retrieves conversation details and verifies membership.
   */
  async getConversationDetail(
    conversationId: string,
    employeeId: string,
  ): Promise<ConversationSummaryDto> {
    const conv = await this.chatRepo.findConversationById(conversationId, employeeId)
    if (!conv) {
      throw new AppError(
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.code,
      )
    }
    return conv
  }

  /**
   * Finds existing 1-1 conversation or creates a new one between two employees.
   */
  async getOrCreateDirectConversation(
    currentUserId: string,
    partnerId: string,
  ): Promise<ConversationSummaryDto> {
    if (currentUserId === partnerId) {
      throw new AppError(
        CHAT_ERRORS.CANNOT_CHAT_WITH_SELF.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.CANNOT_CHAT_WITH_SELF.code,
      )
    }

    // Verify partner is valid and active
    const partner = await this.employeeRepo.findById(partnerId)
    if (!partner || partner.status !== EMPLOYEE_STATUS.ACTIVE) {
      throw new AppError(
        CHAT_ERRORS.EMPLOYEE_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.EMPLOYEE_NOT_FOUND.code,
      )
    }

    // Check if direct conversation already exists
    const existing = await this.chatRepo.findDirectConversationBetween(currentUserId, partnerId)
    if (existing) {
      return existing
    }

    // Create new direct conversation
    return this.chatRepo.createConversation({
      type: CONVERSATION_TYPE.DIRECT,
      creatorId: currentUserId,
      participantIds: [currentUserId, partnerId],
    })
  }

  /**
   * Creates a new group conversation with multiple employees.
   */
  async createGroupConversation(
    currentUserId: string,
    data: CreateGroupConversationDto,
  ): Promise<ConversationSummaryDto> {
    const otherMembers = data.participantIds.filter((id) => id !== currentUserId)
    if (otherMembers.length < 2) {
      throw new AppError(
        CHAT_ERRORS.INVALID_GROUP_PARTICIPANTS.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.INVALID_GROUP_PARTICIPANTS.code,
      )
    }

    return this.chatRepo.createConversation({
      type: CONVERSATION_TYPE.GROUP,
      title: data.title.trim() || "Nhóm mới",
      avatarUrl: data.avatarUrl,
      creatorId: currentUserId,
      participantIds: [currentUserId, ...otherMembers],
    })
  }

  /**
   * Retrieves messages for a conversation, marks as read, and validates participant membership.
   */
  async getMessages(
    conversationId: string,
    employeeId: string,
    limit = CHAT_CONFIG.DEFAULT_PAGE_SIZE,
    beforeCursor?: string,
  ): Promise<ChatMessageDto[]> {
    const isMember = await this.chatRepo.isParticipant(conversationId, employeeId)
    if (!isMember) {
      throw new AppError(
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.code,
      )
    }

    // Auto-mark conversation as read when messages are fetched
    await this.chatRepo.updateLastRead(conversationId, employeeId)

    const clampedLimit = Math.min(Math.max(limit, 1), CHAT_CONFIG.MAX_PAGE_SIZE)
    return this.chatRepo.findMessages(conversationId, { limit: clampedLimit, beforeCursor })
  }

  /**
   * Sends a message in a conversation and emits real-time events to all participants.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageDto> {
    const conversation = await this.chatRepo.findConversationById(conversationId, senderId)
    if (!conversation) {
      throw new AppError(
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.code,
      )
    }

    if (!data.content?.trim() && !data.fileUrl) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_CONTENT_REQUIRED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_CONTENT_REQUIRED.code,
      )
    }

    const createdMessage = await this.chatRepo.createMessage(conversationId, senderId, {
      ...data,
      content: data.content?.slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH) ?? "",
    })

    // Broadcast in real-time to all other conversation participants via EventBus
    for (const participant of conversation.participants) {
      if (participant.employeeId !== senderId) {
        this.bus.emitChatMessage(participant.employeeId, createdMessage)
      }
    }

    return createdMessage
  }

  /**
   * Explicitly marks a conversation as read.
   */
  async markAsRead(conversationId: string, employeeId: string): Promise<void> {
    await this.chatRepo.updateLastRead(conversationId, employeeId)
  }

  /**
   * Mentions Autocomplete: Search employees (@)
   */
  async searchMentionEmployees(query: string, limit = 10): Promise<MentionEmployeeItem[]> {
    return this.chatRepo.searchEmployeesForMention(query.trim(), limit)
  }

  /**
   * Mentions Autocomplete: Search projects (#)
   */
  async searchMentionProjects(query: string, limit = 10): Promise<MentionProjectItem[]> {
    return this.chatRepo.searchProjectsForMention(query.trim(), limit)
  }

  /**
   * Mentions Autocomplete: Search tasks (!)
   */
  async searchMentionTasks(
    query: string,
    limit = 10,
    projectId?: string,
  ): Promise<MentionTaskItem[]> {
    return this.chatRepo.searchTasksForMention(query.trim(), limit, projectId)
  }

  /**
   * Registers a real-time SSE listener for an employee.
   */
  subscribeToChatStream(
    employeeId: string,
    onMessage: (message: ChatMessageDto) => void,
  ): () => void {
    this.bus.onChatMessage(employeeId, onMessage)
    return () => {
      this.bus.offChatMessage(employeeId, onMessage)
    }
  }

  /**
   * Updates participant settings (Pin, Mute, Restrict)
   */
  async updateParticipantSettings(
    conversationId: string,
    employeeId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void> {
    const isMember = await this.chatRepo.isParticipant(conversationId, employeeId)
    if (!isMember) {
      throw new AppError(
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.code,
      )
    }

    await this.chatRepo.updateParticipantSettings(conversationId, employeeId, settings)
  }

  /**
   * Deletes / leaves / hides conversation for this employee
   */
  async deleteConversationForEmployee(
    conversationId: string,
    employeeId: string,
  ): Promise<void> {
    const isMember = await this.chatRepo.isParticipant(conversationId, employeeId)
    if (!isMember) {
      throw new AppError(
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.UNAUTHORIZED_PARTICIPANT.code,
      )
    }

    await this.chatRepo.deleteConversationForEmployee(conversationId, employeeId)
  }
}
