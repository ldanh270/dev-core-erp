import { CHAT_QUERY_KEYS } from "@/hooks/chat/chat-query-keys"
import { chatApi } from "@/lib/chat-api"
import type { ChatMessageDto } from "@/types/chat.types"

import { useEffect, useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"

interface ConversationMessageSearchResult extends ChatMessageDto {
  preview: string
}

/** Debounces message search and returns matching messages with display-ready previews. */
export function useConversationMessageSearch(conversationId: string) {
  const [messageQuery, setMessageQuery] = useState("")
  const [debouncedMessageQuery, setDebouncedMessageQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMessageQuery(messageQuery.trim())
    }, 250)

    return () => {
      clearTimeout(timer)
    }
  }, [messageQuery])

  const messageSearchQuery = useQuery({
    queryKey: CHAT_QUERY_KEYS.SEARCH_MESSAGES(conversationId, debouncedMessageQuery),
    queryFn: () => chatApi.searchMessages(conversationId, debouncedMessageQuery),
    enabled: debouncedMessageQuery.length >= 2,
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

/** Build a readable search-result preview from text or attachment metadata. */
function getMessagePreview(message: ChatMessageDto): string {
  if (message.content) {
    return message.content.replace(/[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g, "$1")
  }
  if (message.type === "image") return "Đã gửi một hình ảnh"
  if (message.type === "file") return message.fileName || "Đã gửi một tệp đính kèm"
  return ""
}
