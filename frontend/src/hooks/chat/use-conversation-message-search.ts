import { CHAT_CONFIG, CHAT_MESSAGE_TYPE } from "@/config/entities/chat.config"
import { CHAT_QUERY_KEYS } from "@/hooks/chat/chat-query-keys"
import { chatApi } from "@/lib/chat-api"
import type { ChatMessageDto } from "@/types/chat.types"

import { useEffect, useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"

/**
 * Message search result entity enriched with parsed plain-text preview.
 */
export interface ConversationMessageSearchResult extends ChatMessageDto {
  /** Formatted plain-text snippet without markdown or mention tokens. */
  preview: string
}

/**
 * Debounces message search input and queries the backend for matching messages in a conversation.
 *
 * @param conversationId Unique identifier of the conversation to search within
 * @returns State and list of matched messages
 */
export function useConversationMessageSearch(conversationId: string) {
  const [messageQuery, setMessageQuery] = useState("")
  const [debouncedMessageQuery, setDebouncedMessageQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMessageQuery(messageQuery.trim())
    }, CHAT_CONFIG.MESSAGE_SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [messageQuery])

  const messageSearchQuery = useQuery({
    queryKey: CHAT_QUERY_KEYS.SEARCH_MESSAGES(conversationId, debouncedMessageQuery),
    queryFn: () => chatApi.searchMessages(conversationId, debouncedMessageQuery),
    enabled: debouncedMessageQuery.length >= CHAT_CONFIG.MIN_SEARCH_QUERY_LENGTH,
  })

  const messages = useMemo<ConversationMessageSearchResult[]>(
    () =>
      messageSearchQuery.data?.map((message) => ({
        ...message,
        preview: getMessagePreview(message),
      })) ?? [],
    [messageSearchQuery.data],
  )

  return {
    messageQuery,
    setMessageQuery,
    debouncedMessageQuery,
    isFetching: messageSearchQuery.isFetching,
    isError: messageSearchQuery.isError,
    messages,
  }
}

/**
 * Builds a readable search-result preview from text or attachment metadata.
 * Strips mention markdown syntax (@[name](emp:id)) for plain display.
 *
 * @param message Raw message data
 * @returns Plain-text preview string
 */
function getMessagePreview(message: ChatMessageDto): string {
  if (message.content) {
    return message.content.replace(/[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g, "$1")
  }
  if (message.type === CHAT_MESSAGE_TYPE.IMAGE) return "Đã gửi một hình ảnh"
  if (message.type === CHAT_MESSAGE_TYPE.FILE) return message.fileName || "Đã gửi một tệp đính kèm"
  return ""
}
