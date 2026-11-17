import apiClient from "@/lib/api-client"
import type {
  AddChatParticipantsDto,
  ChatMessageDto,
  ConversationSummaryDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
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
    const res = await apiClient.get<{ data: ConversationSummaryDto[] }>("/chat/conversations")
    return res.data.data || []
  },

  /** Fetch a conversation only if the signed-in employee is an active participant. */
  async getConversationDetail(id: string): Promise<ConversationSummaryDto> {
    const res = await apiClient.get<{ data: ConversationSummaryDto }>(`/chat/conversations/${id}`)
    return res.data.data
  },

  /** Return the existing direct conversation for this pair or create it if absent. */
  async createDirectConversation(
    dto: CreateDirectConversationDto,
  ): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      "/chat/conversations/direct",
      dto,
    )
    return res.data.data
  },

  /** Create a group; the server adds the signed-in employee to the supplied member IDs. */
  async createGroupConversation(dto: CreateGroupConversationDto): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      "/chat/conversations/group",
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
      `/chat/conversations/${conversationId}/participants`,
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
    limit = 30,
    beforeCursor?: string,
  ): Promise<ChatMessageDto[]> {
    const params: Record<string, string | number> = { limit }
    if (beforeCursor) params["beforeCursor"] = beforeCursor

    const res = await apiClient.get<{ data: ChatMessageDto[] }>(
      `/chat/conversations/${conversationId}/messages`,
      { params },
    )
    return res.data.data || []
  },

  /** Search the authenticated member's conversation history by message text. */
  async searchMessages(conversationId: string, query: string): Promise<ChatMessageDto[]> {
    const res = await apiClient.get<{ data: ChatMessageDto[] }>(
      `/chat/conversations/${conversationId}/messages/search`,
      { params: { q: query } },
    )
    return res.data.data || []
  },

  /** Persist a text, attachment, or mention-token message and return its enriched DTO. */
  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatMessageDto> {
    const res = await apiClient.post<{ data: ChatMessageDto }>(
      `/chat/conversations/${conversationId}/messages`,
      dto,
    )
    return res.data.data
  },

  /** Advance the signed-in member's read watermark to the current time. */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/chat/conversations/${conversationId}/read`)
  },

  /** Update pin, mute, or restriction preferences for this member only. */
  async updateSettings(
    conversationId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void> {
    await apiClient.patch(`/chat/conversations/${conversationId}/settings`, settings)
  },

  /**
   * Hide the conversation for the current employee.
   * This is a per-membership soft delete and does not erase the other participants' history.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${conversationId}`)
  },

  /**
   * Upload a file before sending its returned URL in a message.
   * The multipart field name must remain `file` to match the backend Multer route.
   */
  async uploadAttachment(file: File): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
    type: "image" | "file"
  }> {
    const formData = new FormData()
    formData.append("file", file)
    const res = await apiClient.post<{
      data: { fileUrl: string; fileName: string; fileSize: number; type: "image" | "file" }
    }>("/chat/upload", formData, {
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
  async searchMentionEmployees(q: string, limit = 8): Promise<MentionEmployeeItem[]> {
    const res = await apiClient.get<{ data: MentionEmployeeItem[] }>("/chat/mentions/employees", {
      params: { q, limit },
    })
    return res.data.data || []
  },

  /** Search projects for `#` autocomplete. */
  async searchMentionProjects(q: string, limit = 8): Promise<MentionProjectItem[]> {
    const res = await apiClient.get<{ data: MentionProjectItem[] }>("/chat/mentions/projects", {
      params: { q, limit },
    })
    return res.data.data || []
  },

  /** Search tasks for `!` autocomplete, optionally limiting results to a project. */
  async searchMentionTasks(q: string, limit = 8, projectId?: string): Promise<MentionTaskItem[]> {
    const params: Record<string, string | number> = { q, limit }
    if (projectId) params["projectId"] = projectId

    const res = await apiClient.get<{ data: MentionTaskItem[] }>("/chat/mentions/tasks", {
      params,
    })
    return res.data.data || []
  },
}
