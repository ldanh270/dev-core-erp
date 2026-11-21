import { API_ENDPOINTS } from "@/config/api.config"
import { CHAT_CONFIG, type IChatMessageType } from "@/config/entities/chat.config"
import apiClient from "@/lib/api-client"
import type {
  AddChatParticipantsDto,
  ChatMessageDto,
  ConversationSummaryDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  ForwardMessageDto,
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
  SendMessageDto,
  UpdateParticipantSettingsDto,
} from "@/types/chat.types"

/**
 * Typed REST boundary for chat.
 * The server wraps successful payloads in `{ data, error }`; date fields arrive as ISO strings
 * and are described by the browser-facing DTOs.
 */
export const chatApi = {
  /** Fetch the signed-in employee's visible conversation summaries. */
  async getConversations(): Promise<ConversationSummaryDto[]> {
    const res = await apiClient.get<{ data: ConversationSummaryDto[] }>(
      API_ENDPOINTS.CHAT.CONVERSATIONS,
    )
    return res.data.data || []
  },

  /** Fetch a conversation only if the signed-in employee is an active participant. */
  async getConversationDetail(id: string): Promise<ConversationSummaryDto> {
    const res = await apiClient.get<{ data: ConversationSummaryDto }>(
      API_ENDPOINTS.CHAT.CONVERSATION_DETAIL(id),
    )
    return res.data.data
  },

  /** Return the existing direct conversation for this pair or create it if absent. */
  async createDirectConversation(
    dto: CreateDirectConversationDto,
  ): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      API_ENDPOINTS.CHAT.DIRECT,
      dto,
    )
    return res.data.data
  },

  /** Create a group; the server adds the signed-in employee to the supplied member IDs. */
  async createGroupConversation(dto: CreateGroupConversationDto): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      API_ENDPOINTS.CHAT.GROUP,
      dto,
    )
    return res.data.data
  },

  /** Add employees to a group the signed-in employee can access. */
  async addParticipants(
    conversationId: string,
    dto: AddChatParticipantsDto,
  ): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      API_ENDPOINTS.CHAT.PARTICIPANTS(conversationId),
      dto,
    )
    return res.data.data
  },

  /**
   * Fetch one chronological message page.
   * `beforeCursor` is the ID of the newest message already loaded; the server returns earlier
   * messages while keeping the result ordered oldest-to-newest for rendering.
   */
  async getMessages(
    conversationId: string,
    limit: number = CHAT_CONFIG.DEFAULT_PAGE_SIZE,
    beforeCursor?: string,
  ): Promise<ChatMessageDto[]> {
    const params: Record<string, string | number> = { limit }
    if (beforeCursor) params["beforeCursor"] = beforeCursor

    const res = await apiClient.get<{ data: ChatMessageDto[] }>(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId),
      { params },
    )
    return res.data.data || []
  },

  /** Search the authenticated member's conversation history by message text. */
  async searchMessages(conversationId: string, query: string): Promise<ChatMessageDto[]> {
    const res = await apiClient.get<{ data: ChatMessageDto[] }>(
      API_ENDPOINTS.CHAT.SEARCH_MESSAGES(conversationId),
      { params: { q: query } },
    )
    return res.data.data || []
  },

  /** Persist a text, attachment, or mention-token message and return its enriched DTO. */
  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatMessageDto> {
    const res = await apiClient.post<{ data: ChatMessageDto }>(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId),
      dto,
    )
    return res.data.data
  },

  /** Edit the signed-in employee's own message text. */
  async editMessage(messageId: string, content: string): Promise<ChatMessageDto> {
    const res = await apiClient.patch<{ data: ChatMessageDto }>(
      API_ENDPOINTS.CHAT.MESSAGE_DETAIL(encodeURIComponent(messageId)),
      { content },
    )
    return res.data.data
  },

  /** Recall the signed-in employee's own message for all conversation participants. */
  async recallMessage(messageId: string): Promise<ChatMessageDto> {
    const res = await apiClient.delete<{ data: ChatMessageDto }>(
      API_ENDPOINTS.CHAT.MESSAGE_DETAIL(encodeURIComponent(messageId)),
    )
    return res.data.data
  },

  /** Set the shared pin state of an active message. */
  async setMessagePinned(messageId: string, isPinned: boolean): Promise<ChatMessageDto> {
    const res = await apiClient.patch<{ data: ChatMessageDto }>(
      API_ENDPOINTS.CHAT.PIN_MESSAGE(encodeURIComponent(messageId)),
      { isPinned },
    )
    return res.data.data
  },

  /** Forward a message to multiple existing conversations. */
  async forwardMessage(messageId: string, dto: ForwardMessageDto): Promise<ChatMessageDto[]> {
    const res = await apiClient.post<{ data: ChatMessageDto[] }>(
      API_ENDPOINTS.CHAT.FORWARD_MESSAGE(encodeURIComponent(messageId)),
      dto,
    )
    return res.data.data
  },

  /** Advance the signed-in member's read watermark to the current time. */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CHAT.MARK_READ(conversationId))
  },

  /** Update pin, mute, or restriction preferences for this member only. */
  async updateSettings(
    conversationId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.CHAT.SETTINGS(conversationId), settings)
  },

  /**
   * Hide the conversation for the current employee.
   * This is a per-membership soft delete and does not erase the other participants' history.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CHAT.CONVERSATION_DETAIL(conversationId))
  },

  /**
   * Upload a file before sending its returned URL in a message.
   * The multipart field name must remain `file` to match the backend Multer route.
   */
  async uploadAttachment(file: File): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
    type: IChatMessageType
  }> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await apiClient.post<{
      data: { fileUrl: string; fileName: string; fileSize: number; type: IChatMessageType }
    }>(API_ENDPOINTS.CHAT.UPLOAD, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data.data
  },

  /**
   * Autocomplete queries for the three mention triggers:
   * @ -> Employee
   * # -> Project
   * ! -> Task
   * Results are lightweight lookup DTOs, not full entity records.
   */
  async searchMentionEmployees(
    q: string,
    limit: number = CHAT_CONFIG.MENTION_SUGGESTION_LIMIT,
  ): Promise<MentionEmployeeItem[]> {
    const res = await apiClient.get<{ data: MentionEmployeeItem[] }>(
      API_ENDPOINTS.CHAT.MENTION_EMPLOYEES,
      {
        params: { q, limit },
      },
    )
    return res.data.data || []
  },

  /** Search projects for `#` autocomplete. */
  async searchMentionProjects(
    q: string,
    limit: number = CHAT_CONFIG.MENTION_SUGGESTION_LIMIT,
  ): Promise<MentionProjectItem[]> {
    const res = await apiClient.get<{ data: MentionProjectItem[] }>(
      API_ENDPOINTS.CHAT.MENTION_PROJECTS,
      {
        params: { q, limit },
      },
    )
    return res.data.data || []
  },

  /** Search tasks for `!` autocomplete, optionally limiting results to a project. */
  async searchMentionTasks(
    q: string,
    limit: number = CHAT_CONFIG.MENTION_SUGGESTION_LIMIT,
    projectId?: string,
  ): Promise<MentionTaskItem[]> {
    const params: Record<string, string | number> = { q, limit }
    if (projectId) params["projectId"] = projectId

    const res = await apiClient.get<{ data: MentionTaskItem[] }>(API_ENDPOINTS.CHAT.MENTION_TASKS, {
      params,
    })
    return res.data.data || []
  },
}
