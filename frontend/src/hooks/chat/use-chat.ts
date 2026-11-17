import { API_BASE_URL } from "@/config/api.config"
import { chatApi } from "@/lib/chat-api"
import { useAuthStore } from "@/store/auth-store"
import type {
  AddChatParticipantsDto,
  ChatMessageDto,
  ChatStreamEvent,
  ConversationSummaryDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  ForwardMessageDto,
  SendMessageDto,
  UpdateParticipantSettingsDto,
} from "@/types/chat.types"

import { useEffect } from "react"

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

interface ChatApiErrorResponse {
  error?: {
    message?: string
  }
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  // Only Axios errors have the response shape used by this API; network and other errors use the fallback.
  if (!axios.isAxiosError<ChatApiErrorResponse>(error)) return fallback
  return error.response?.data.error?.message ?? fallback
}

/** Apply a created/updated message consistently to history, search results, and list previews. */
const applyMessageEvent = (
  queryClient: QueryClient,
  event: ChatStreamEvent,
  currentEmployeeId?: string,
) => {
  const { message, type } = event
  const isCreated = type === "message.created"

  queryClient.setQueryData<ChatMessageDto[]>(
    CHAT_QUERY_KEYS.MESSAGES(message.conversationId),
    (old) => {
      if (!old) return isCreated ? [message] : old
      const exists = old.some((item) => item.id === message.id)
      if (!exists) return isCreated ? [...old, message] : old
      return old.map((item) => (item.id === message.id ? message : item))
    },
  )

  queryClient.setQueriesData<ChatMessageDto[]>(
    { queryKey: ["chat", "search-messages", message.conversationId] },
    (old) =>
      old?.flatMap((item) => {
        if (item.id !== message.id) return [item]
        return message.isRecalled ? [] : [message]
      }),
  )

  queryClient.setQueryData<ConversationSummaryDto[]>(CHAT_QUERY_KEYS.CONVERSATIONS, (old) => {
    if (!old) return old
    return old
      .map((conversation) => {
        if (conversation.id !== message.conversationId) return conversation
        const lastMessageMatches = conversation.lastMessage?.id === message.id
        return {
          ...conversation,
          lastMessage: isCreated || lastMessageMatches ? message : conversation.lastMessage,
          unreadCount:
            isCreated && message.senderId !== currentEmployeeId
              ? conversation.unreadCount + 1
              : conversation.unreadCount,
          updatedAt: isCreated ? message.createdAt : conversation.updatedAt,
        }
      })
      .sort(
        (a, b) =>
          Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  })
}

/** Centralized cache keys keep list, detail, history, and search results isolated. */
export const CHAT_QUERY_KEYS = {
  ALL: ["chat"] as const,
  CONVERSATIONS: ["chat", "conversations"] as const,
  CONVERSATION: (id: string) => ["chat", "conversation", id] as const,
  MESSAGES: (id: string) => ["chat", "messages", id] as const,
  SEARCH_MESSAGES: (id: string, query: string) => ["chat", "search-messages", id, query] as const,
}

/**
 * Loads the signed-in employee's conversation list and maintains its React Query cache from SSE.
 * Incoming messages are deduplicated by ID before being appended, and the stream is closed when
 * authentication or the hook lifecycle ends.
 */
export function useChatConversations() {
  const queryClient = useQueryClient()
  const { isAuthenticated, accessToken, user } = useAuthStore()

  const query = useQuery<ConversationSummaryDto[]>({
    queryKey: CHAT_QUERY_KEYS.CONVERSATIONS,
    queryFn: () => chatApi.getConversations(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  })

  // EventSource uses cookies when available; the query token supports servers that authenticate SSE via URL.
  useEffect(() => {
    if (!isAuthenticated) return

    const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""
    const streamUrl = `${API_BASE_URL}/chat/stream${tokenParam}`

    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true })

      eventSource.onmessage = (event) => {
        try {
          const streamEvent = JSON.parse(event.data) as ChatStreamEvent
          if (
            ["message.created", "message.updated", "message.recalled"].includes(streamEvent.type) &&
            streamEvent.message?.id &&
            streamEvent.message.conversationId
          ) {
            applyMessageEvent(queryClient, streamEvent, user?.id)
          }
        } catch (e) {
          console.error("Failed to parse SSE chat message:", e)
        }
      }

      eventSource.onerror = (err) => {
        console.warn("Chat SSE stream disconnected, reconnecting...", err)
      }
    } catch (e) {
      console.error("Failed to initialize Chat EventSource:", e)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }, [isAuthenticated, accessToken, user?.id, queryClient])

  return query
}

/**
 * Loads one conversation's message page and exposes send/read mutations.
 * Successful mutations update local caches after the server responds; server errors remain visible
 * through the mutation's toast handling.
 */
export function useChatMessages(conversationId?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const messagesQuery = useQuery<ChatMessageDto[]>({
    queryKey: CHAT_QUERY_KEYS.MESSAGES(conversationId || ""),
    queryFn: () => (conversationId ? chatApi.getMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  })

  const sendMutation = useMutation({
    mutationFn: (dto: SendMessageDto) => {
      if (!conversationId) throw new Error("Conversation ID is required")
      return chatApi.sendMessage(conversationId, dto)
    },
    onSuccess: (newMsg) => {
      applyMessageEvent(queryClient, { type: "message.created", message: newMsg }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi tin nhắn"))
    },
  })

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      chatApi.editMessage(messageId, content),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.updated", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể chỉnh sửa tin nhắn"))
    },
  })

  const recallMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.recallMessage(messageId),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.recalled", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể thu hồi tin nhắn"))
    },
  })

  const pinMessageMutation = useMutation({
    mutationFn: ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) =>
      chatApi.setMessagePinned(messageId, isPinned),
    onSuccess: (message) => {
      applyMessageEvent(queryClient, { type: "message.updated", message }, user?.id)
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái ghim"))
    },
  })

  const forwardMessageMutation = useMutation({
    mutationFn: ({ messageId, ...dto }: { messageId: string } & ForwardMessageDto) =>
      chatApi.forwardMessage(messageId, dto),
    onSuccess: (messages) => {
      messages.forEach((message) => {
        applyMessageEvent(queryClient, { type: "message.created", message }, user?.id)
      })
      toast.success("Đã chuyển tiếp tin nhắn")
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể chuyển tiếp tin nhắn"))
    },
  })

  const markReadMutation = useMutation({
    mutationFn: () => {
      if (!conversationId) return Promise.resolve()
      return chatApi.markAsRead(conversationId)
    },
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummaryDto[]>(CHAT_QUERY_KEYS.CONVERSATIONS, (old) => {
        if (!old) return old
        return old.map((conv) => {
          if (conv.id === conversationId) {
            return { ...conv, unreadCount: 0 }
          }
          return conv
        })
      })
    },
  })

  return {
    ...messagesQuery,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    editMessage: (messageId: string, content: string) =>
      editMessageMutation.mutate({ messageId, content }),
    recallMessage: recallMessageMutation.mutate,
    setMessagePinned: (messageId: string, isPinned: boolean) =>
      pinMessageMutation.mutate({ messageId, isPinned }),
    forwardMessage: (messageId: string, conversationIds: string[]) =>
      forwardMessageMutation.mutate({ messageId, conversationIds }),
    isMessageActionPending:
      editMessageMutation.isPending ||
      recallMessageMutation.isPending ||
      pinMessageMutation.isPending ||
      forwardMessageMutation.isPending,
    markAsRead: markReadMutation.mutate,
  }
}

/**
 * Mutations for creating direct and group conversations.
 * Awaiting list invalidation ensures callers navigate only after the refreshed list can resolve
 * the newly created conversation.
 */
export function useCreateDirectChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateDirectConversationDto) => chatApi.createDirectConversation(dto),
    onSuccess: async () => {
      // Wait for the list refresh so callers don't continue with stale conversation data.
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo cuộc trò chuyện"))
    },
  })
}

/** Create a group and wait for its refreshed list entry before resolving. */
export function useCreateGroupChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateGroupConversationDto) => chatApi.createGroupConversation(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Tạo nhóm chat thành công")
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo nhóm chat"))
    },
  })
}

/** Adds members and replaces the cached conversation summary with the server's updated DTO. */
export function useAddChatParticipants() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, ...dto }: { conversationId: string } & AddChatParticipantsDto) =>
      chatApi.addParticipants(conversationId, dto),
    onSuccess: (updatedConversation) => {
      queryClient.setQueryData<ConversationSummaryDto[]>(CHAT_QUERY_KEYS.CONVERSATIONS, (old) =>
        old?.map((conversation) =>
          conversation.id === updatedConversation.id ? updatedConversation : conversation,
        ),
      )
      toast.success("Đã thêm thành viên vào nhóm")
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể thêm thành viên"))
    },
  })
}

/**
 * Persists the current employee's pin, mute, and restriction preferences, then refreshes summaries
 * because those fields and the pinned ordering are computed per participant.
 */
export function useUpdateChatSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      settings,
    }: {
      conversationId: string
      settings: UpdateParticipantSettingsDto
    }) => chatApi.updateSettings(conversationId, settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật cài đặt"))
    },
  })
}

/**
 * Hides a conversation for the current employee and refreshes the list so the row disappears.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.deleteConversation(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Đã xoá cuộc trò chuyện")
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể xoá cuộc trò chuyện"))
    },
  })
}
