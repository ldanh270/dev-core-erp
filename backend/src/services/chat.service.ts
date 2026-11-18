import { CHAT_CONFIG, CHAT_ERRORS, CONVERSATION_TYPE } from "@/configs/entities/chat.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { eventBus } from "@/libs/event-bus.ts"
import type {
  ChatMessageDto,
  ChatStreamEvent,
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
import type { IEmployeeRepository } from "@/types/employee.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Chat business layer: validates membership and domain rules, delegates persistence, and publishes
 * new messages to each other participant's in-process event channel for WebSocket delivery.
 * Authorization is intentionally checked here before repository reads or mutations.
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
   * Return the visible direct conversation for this pair, or create one if absent.
   * The partner must be active and cannot be the caller; an existing conversation is reused rather
   * than creating duplicate history.
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
   * Create a group after removing the caller from the requested member list.
   * At least two other members are required; the caller is then added exactly once by the service.
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
   * Add active employees to a group the caller can access.
   * Duplicate IDs and the caller's own ID are removed before capacity checks; only genuinely new
   * memberships count against the group limit.
   */
  async addParticipants(
    conversationId: string,
    employeeId: string,
    participantIds: string[],
  ): Promise<ConversationSummaryDto> {
    const conversation = await this.chatRepo.findConversationById(conversationId, employeeId)
    if (!conversation) {
      throw new AppError(
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.code,
      )
    }

    if (conversation.type !== CONVERSATION_TYPE.GROUP) {
      throw new AppError(
        CHAT_ERRORS.GROUP_CONVERSATION_REQUIRED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.GROUP_CONVERSATION_REQUIRED.code,
      )
    }

    // Exclude the caller and collapse duplicate IDs before validating counts or writing memberships.
    const uniqueParticipantIds = Array.from(
      new Set(participantIds.filter((id) => id !== employeeId)),
    )
    if (!uniqueParticipantIds.length) {
      throw new AppError(
        CHAT_ERRORS.INVALID_GROUP_PARTICIPANTS.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.INVALID_GROUP_PARTICIPANTS.code,
      )
    }

    // Count only genuinely new members; existing participants must not consume capacity twice.
    const currentParticipantIds = new Set(conversation.participants.map((p) => p.employeeId))
    const newParticipantCount = uniqueParticipantIds.filter(
      (id) => !currentParticipantIds.has(id),
    ).length

    if (conversation.participants.length + newParticipantCount > CHAT_CONFIG.MAX_GROUP_MEMBERS) {
      throw new AppError(
        CHAT_ERRORS.GROUP_MEMBER_LIMIT_REACHED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.GROUP_MEMBER_LIMIT_REACHED.code,
      )
    }

    const employees = await Promise.all(
      uniqueParticipantIds.map((id) => this.employeeRepo.findById(id)),
    )
    if (employees.some((employee) => !employee || employee.status !== EMPLOYEE_STATUS.ACTIVE)) {
      throw new AppError(
        CHAT_ERRORS.EMPLOYEE_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.EMPLOYEE_NOT_FOUND.code,
      )
    }

    await this.chatRepo.addParticipants(conversationId, uniqueParticipantIds)
    const updatedConversation = await this.chatRepo.findConversationById(conversationId, employeeId)
    if (!updatedConversation) {
      throw new AppError(
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.message,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.CONVERSATION_NOT_FOUND.code,
      )
    }
    return updatedConversation
  }

  /**
   * Fetch a bounded page for an active participant and advance that participant's read watermark.
   * The limit is clamped here even if a caller bypasses the controller's query parsing.
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
   * Searches only after confirming membership; blank terms return without querying the repository.
   */
  async searchMessages(
    conversationId: string,
    employeeId: string,
    query: string,
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

    const searchQuery = query.trim()
    if (!searchQuery) return []

    return this.chatRepo.findMessages(conversationId, {
      limit: CHAT_CONFIG.SEARCH_PAGE_SIZE,
      searchQuery,
    })
  }

  /**
   * Validate, persist, then publish a message event to every active conversation participant.
   * Event delivery also updates other sessions owned by the sender.
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

    // Broadcast the typed creation event to every active member, including the sender's other sessions.
    this.publishMessageEvent(conversation.participants, {
      type: "message.created",
      message: createdMessage,
    })

    return createdMessage
  }

  /** Edit an active message owned by the caller and notify all active members. */
  async editMessage(
    messageId: string,
    employeeId: string,
    content: string,
  ): Promise<ChatMessageDto> {
    const message = await this.getAccessibleMessage(messageId, employeeId)
    if (message.senderId !== employeeId) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_OWNER_REQUIRED.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_OWNER_REQUIRED.code,
      )
    }
    if (message.isRecalled) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_ALREADY_RECALLED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_ALREADY_RECALLED.code,
      )
    }

    const normalizedContent = content.trim()
    if (!normalizedContent) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_CONTENT_REQUIRED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_CONTENT_REQUIRED.code,
      )
    }

    const updated = await this.chatRepo.editMessage(
      messageId,
      employeeId,
      normalizedContent.slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH),
    )
    if (!updated) return this.throwMessageNotFound()

    const conversation = await this.getConversationDetail(updated.conversationId, employeeId)
    this.publishMessageEvent(conversation.participants, {
      type: "message.updated",
      message: updated,
    })
    return updated
  }

  /** Globally recall an active message owned by the caller and publish the redacted tombstone. */
  async recallMessage(messageId: string, employeeId: string): Promise<ChatMessageDto> {
    const message = await this.getAccessibleMessage(messageId, employeeId)
    if (message.senderId !== employeeId) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_OWNER_REQUIRED.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_OWNER_REQUIRED.code,
      )
    }
    if (message.isRecalled) {
      throw new AppError(
        CHAT_ERRORS.MESSAGE_ALREADY_RECALLED.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.MESSAGE_ALREADY_RECALLED.code,
      )
    }

    const recalled = await this.chatRepo.recallMessage(messageId, employeeId)
    if (!recalled) return this.throwMessageNotFound()

    const conversation = await this.getConversationDetail(recalled.conversationId, employeeId)
    this.publishMessageEvent(conversation.participants, {
      type: "message.recalled",
      message: recalled,
    })
    return recalled
  }

  /** Pin or unpin an active message globally for its conversation participants. */
  async setMessagePinned(
    messageId: string,
    employeeId: string,
    isPinned: boolean,
  ): Promise<ChatMessageDto> {
    const message = await this.getAccessibleMessage(messageId, employeeId)
    if (message.isRecalled) return this.throwMessageNotFound()

    const updated = await this.chatRepo.setMessagePinned(messageId, employeeId, isPinned)
    if (!updated) return this.throwMessageNotFound()

    const conversation = await this.getConversationDetail(updated.conversationId, employeeId)
    this.publishMessageEvent(conversation.participants, {
      type: "message.updated",
      message: updated,
    })
    return updated
  }

  /** Validate all target conversations before atomically forwarding and publishing new messages. */
  async forwardMessage(
    messageId: string,
    employeeId: string,
    conversationIds: string[],
  ): Promise<ChatMessageDto[]> {
    const message = await this.getAccessibleMessage(messageId, employeeId)
    if (message.isRecalled) return this.throwMessageNotFound()

    const uniqueConversationIds = Array.from(new Set(conversationIds))
    if (
      !uniqueConversationIds.length ||
      uniqueConversationIds.length > CHAT_CONFIG.MAX_FORWARD_CONVERSATIONS
    ) {
      throw new AppError(
        CHAT_ERRORS.INVALID_FORWARD_DESTINATIONS.message,
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.INVALID_FORWARD_DESTINATIONS.code,
      )
    }

    const forwarded = await this.chatRepo.forwardMessage(
      messageId,
      employeeId,
      uniqueConversationIds,
    )
    if (!forwarded) {
      throw new AppError(
        CHAT_ERRORS.INVALID_FORWARD_DESTINATIONS.message,
        HttpStatusCode.FORBIDDEN,
        ErrorLayer.SERVICE,
        CHAT_ERRORS.INVALID_FORWARD_DESTINATIONS.code,
      )
    }

    for (const forwardedMessage of forwarded) {
      const conversation = await this.chatRepo.findConversationById(
        forwardedMessage.conversationId,
        employeeId,
      )
      if (conversation) {
        this.publishMessageEvent(conversation.participants, {
          type: "message.created",
          message: forwardedMessage,
        })
      }
    }
    return forwarded
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

  private async getAccessibleMessage(
    messageId: string,
    employeeId: string,
  ): Promise<ChatMessageDto> {
    const message = await this.chatRepo.findMessageById(messageId, employeeId)
    if (!message) return this.throwMessageNotFound()
    return message
  }

  private throwMessageNotFound(): never {
    throw new AppError(
      CHAT_ERRORS.MESSAGE_NOT_FOUND.message,
      HttpStatusCode.NOT_FOUND,
      ErrorLayer.SERVICE,
      CHAT_ERRORS.MESSAGE_NOT_FOUND.code,
    )
  }

  private publishMessageEvent(
    participants: ConversationSummaryDto["participants"],
    event: ChatStreamEvent,
  ): void {
    for (const participant of participants) {
      this.bus.emitChatMessage(participant.employeeId, event)
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
   * Soft-hide a conversation for one member only; shared messages remain available to others.
   */
  async deleteConversationForEmployee(conversationId: string, employeeId: string): Promise<void> {
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
