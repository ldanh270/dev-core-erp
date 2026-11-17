import { API_BASE_URL } from "@/config/api.config"
import { chatApi } from "@/lib/chat-api"
import { useAuthStore } from "@/store/auth-store"
import type {
  ChatMessageDto,
  ConversationSummaryDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  SendMessageDto,
  UpdateParticipantSettingsDto,
} from "@/types/chat.types"

import { useEffect } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const CHAT_QUERY_KEYS = {
  ALL: ["chat"] as const,
  CONVERSATIONS: ["chat", "conversations"] as const,
  CONVERSATION: (id: string) => ["chat", "conversation", id] as const,
  MESSAGES: (id: string) => ["chat", "messages", id] as const,
}

/**
 * Hook to retrieve user conversations and subscribe to real-time message stream.
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

  // Real-time SSE listener
  useEffect(() => {
    if (!isAuthenticated) return

    const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""
    const streamUrl = `${API_BASE_URL}/chat/stream${tokenParam}`

    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true })

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type: string
            payload?: ChatMessageDto
          }

          if (payload.type === "message" && payload.payload) {
            const incomingMsg = payload.payload

            // 1. Append to active conversation messages cache if open
            queryClient.setQueryData<ChatMessageDto[]>(
              CHAT_QUERY_KEYS.MESSAGES(incomingMsg.conversationId),
              (old) => {
                if (!old) return [incomingMsg]
                if (old.some((m) => m.id === incomingMsg.id)) return old
                return [...old, incomingMsg]
              },
            )

            // 2. Update conversation summary in list
            queryClient.setQueryData<ConversationSummaryDto[]>(
              CHAT_QUERY_KEYS.CONVERSATIONS,
              (old) => {
                if (!old) return old
                return old.map((conv) => {
                  if (conv.id === incomingMsg.conversationId) {
                    const isFromMe = incomingMsg.senderId === user?.id
                    return {
                      ...conv,
                      lastMessage: incomingMsg,
                      unreadCount: isFromMe ? conv.unreadCount : conv.unreadCount + 1,
                      updatedAt: incomingMsg.createdAt,
                    }
                  }
                  return conv
                }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              },
            )
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
 * Hook to retrieve conversation details and messages.
 */
export function useChatMessages(conversationId?: string) {
  const queryClient = useQueryClient()

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
      // Optimistically insert message into cache
      queryClient.setQueryData<ChatMessageDto[]>(
        CHAT_QUERY_KEYS.MESSAGES(conversationId || ""),
        (old) => {
          if (!old) return [newMsg]
          if (old.some((m) => m.id === newMsg.id)) return old
          return [...old, newMsg]
        },
      )

      // Update conversation list preview
      queryClient.setQueryData<ConversationSummaryDto[]>(
        CHAT_QUERY_KEYS.CONVERSATIONS,
        (old) => {
          if (!old) return old
          return old.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                lastMessage: newMsg,
                updatedAt: newMsg.createdAt,
              }
            }
            return conv
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        },
      )
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Không thể gửi tin nhắn")
    },
  })

  const markReadMutation = useMutation({
    mutationFn: () => {
      if (!conversationId) return Promise.resolve()
      return chatApi.markAsRead(conversationId)
    },
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummaryDto[]>(
        CHAT_QUERY_KEYS.CONVERSATIONS,
        (old) => {
          if (!old) return old
          return old.map((conv) => {
            if (conv.id === conversationId) {
              return { ...conv, unreadCount: 0 }
            }
            return conv
          })
        },
      )
    },
  })

  return {
    ...messagesQuery,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    markAsRead: markReadMutation.mutate,
  }
}

/**
 * Mutation hooks for creating conversations
 */
export function useCreateDirectChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateDirectConversationDto) => chatApi.createDirectConversation(dto),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      return newConv
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Không thể tạo cuộc trò chuyện")
    },
  })
}

export function useCreateGroupChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateGroupConversationDto) => chatApi.createGroupConversation(dto),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Tạo nhóm chat thành công")
      return newConv
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Không thể tạo nhóm chat")
    },
  })
}

/**
 * Mutation to update participant settings (isPinned, isMuted, isRestricted)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Không thể cập nhật cài đặt")
    },
  })
}

/**
 * Mutation to delete or leave a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.CONVERSATIONS })
      toast.success("Đã xoá cuộc trò chuyện")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || "Không thể xoá cuộc trò chuyện")
    },
  })
}
