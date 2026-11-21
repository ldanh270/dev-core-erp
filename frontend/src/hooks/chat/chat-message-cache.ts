import { CHAT_STREAM_EVENT } from "@/config/entities/chat.config"
import type { ChatMessageDto, ChatStreamEvent, ConversationSummaryDto } from "@/types/chat.types"

import type { InfiniteData, QueryClient } from "@tanstack/react-query"

import { CHAT_QUERY_KEYS } from "./chat-query-keys"

/**
 * Applies a chat message event to history, search results, and conversation previews.
 */
export const applyMessageEvent = (
  queryClient: QueryClient,
  event: ChatStreamEvent,
  currentEmployeeId?: string,
) => {
  const { message, type } = event
  const isCreated = type === CHAT_STREAM_EVENT.CREATED

  queryClient.setQueryData<InfiniteData<ChatMessageDto[]>>(
    CHAT_QUERY_KEYS.MESSAGES(message.conversationId),
    (old) => {
      if (!old) {
        return isCreated ? { pages: [[message]], pageParams: [undefined] } : old
      }

      const exists = old.pages.some((page) => page.some((item) => item.id === message.id))
      if (!exists && !isCreated) return old

      const pages = old.pages.map((page, index) => {
        if (index === 0 && isCreated && !exists) return [...page, message]
        return page.map((item) => (item.id === message.id ? message : item))
      })
      return { ...old, pages }
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
