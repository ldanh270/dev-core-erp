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

export const chatApi = {
  /**
   * Fetch all conversations for current user
   */
  async getConversations(): Promise<ConversationSummaryDto[]> {
    const res = await apiClient.get<{ data: ConversationSummaryDto[] }>("/chat/conversations")
    return res.data.data || []
  },

  /**
   * Fetch a single conversation detail
   */
  async getConversationDetail(id: string): Promise<ConversationSummaryDto> {
    const res = await apiClient.get<{ data: ConversationSummaryDto }>(`/chat/conversations/${id}`)
    return res.data.data
  },

  /**
   * Create or find a direct 1-1 conversation
   */
  async createDirectConversation(
    dto: CreateDirectConversationDto,
  ): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      "/chat/conversations/direct",
      dto,
    )
    return res.data.data
  },

  /**
   * Create a group conversation
   */
  async createGroupConversation(dto: CreateGroupConversationDto): Promise<ConversationSummaryDto> {
    const res = await apiClient.post<{ data: ConversationSummaryDto }>(
      "/chat/conversations/group",
      dto,
    )
    return res.data.data
  },

  /**
   * Add employees to an existing group conversation
   */
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
   * Fetch messages for a conversation
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

  /**
   * Search messages across a conversation's history
   */
  async searchMessages(conversationId: string, query: string): Promise<ChatMessageDto[]> {
    const res = await apiClient.get<{ data: ChatMessageDto[] }>(
      `/chat/conversations/${conversationId}/messages/search`,
      { params: { q: query } },
    )
    return res.data.data || []
  },

  /**
   * Send a chat message
   */
  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatMessageDto> {
    const res = await apiClient.post<{ data: ChatMessageDto }>(
      `/chat/conversations/${conversationId}/messages`,
      dto,
    )
    return res.data.data
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/chat/conversations/${conversationId}/read`)
  },

  /**
   * Update participant settings (Pin, Mute, Restrict)
   */
  async updateSettings(
    conversationId: string,
    settings: UpdateParticipantSettingsDto,
  ): Promise<void> {
    await apiClient.patch(`/chat/conversations/${conversationId}/settings`, settings)
  },

  /**
   * Delete / leave / hide conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${conversationId}`)
  },

  /**
   * Upload file or image attachment
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
   * Autocomplete queries for mention syntax:
   * @ -> Employee
   * # -> Project
   * ! -> Task
   */
  async searchMentionEmployees(q: string, limit = 8): Promise<MentionEmployeeItem[]> {
    const res = await apiClient.get<{ data: MentionEmployeeItem[] }>("/chat/mentions/employees", {
      params: { q, limit },
    })
    return res.data.data || []
  },

  async searchMentionProjects(q: string, limit = 8): Promise<MentionProjectItem[]> {
    const res = await apiClient.get<{ data: MentionProjectItem[] }>("/chat/mentions/projects", {
      params: { q, limit },
    })
    return res.data.data || []
  },

  async searchMentionTasks(q: string, limit = 8, projectId?: string): Promise<MentionTaskItem[]> {
    const params: Record<string, string | number> = { q, limit }
    if (projectId) params["projectId"] = projectId

    const res = await apiClient.get<{ data: MentionTaskItem[] }>("/chat/mentions/tasks", {
      params,
    })
    return res.data.data || []
  },
}
