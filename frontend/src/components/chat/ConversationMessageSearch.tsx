import { CHAT_QUERY_KEYS } from "@/hooks/chat/chat-query-keys"
import { chatApi } from "@/lib/chat-api"
import type { ChatMessageDto } from "@/types/chat.types"

import { useEffect, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Search } from "lucide-react"

interface ConversationMessageSearchProps {
  conversationId: string
}

/**
 * Searches and previews messages within one conversation.
 */
export function ConversationMessageSearch({ conversationId }: ConversationMessageSearchProps) {
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

  return (
    <div className="space-y-2 border-b border-border p-3">
      <label className="text-xs font-semibold text-foreground" htmlFor="chat-message-search">
        Tìm kiếm tin nhắn
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="chat-message-search"
          value={messageQuery}
          onChange={(event) => {
            setMessageQuery(event.target.value)
          }}
          placeholder="Tìm trong cuộc trò chuyện..."
          className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
        />
      </div>

      {messageQuery.trim().length > 0 && messageQuery.trim().length < 2 && (
        <p className="text-xs text-muted-foreground">Nhập ít nhất 2 ký tự để tìm.</p>
      )}
      {debouncedMessageQuery.length >= 2 && (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {messageSearchQuery.isFetching ? (
            <p className="p-2 text-xs text-muted-foreground">Đang tìm tin nhắn...</p>
          ) : messageSearchQuery.isError ? (
            <p className="p-2 text-xs text-destructive">
              Không thể tìm tin nhắn. Vui lòng thử lại.
            </p>
          ) : messageSearchQuery.data?.length ? (
            messageSearchQuery.data.map((message) => (
              <div key={message.id} className="rounded-lg p-2 hover:bg-muted/70">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    {message.senderName}
                  </span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm")}
                  </time>
                </div>
                <p className="break-words text-xs text-muted-foreground">
                  {getMessagePreview(message)}
                </p>
              </div>
            ))
          ) : (
            <p className="p-2 text-xs text-muted-foreground">Không tìm thấy tin nhắn phù hợp.</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Converts structured mention tokens into readable labels for search-result previews.
 */
function getMessagePreview(message: ChatMessageDto): string {
  if (message.content) {
    return message.content.replace(/[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g, "$1")
  }
  if (message.type === "image") return "Đã gửi một hình ảnh"
  if (message.type === "file") return message.fileName || "Đã gửi một tệp đính kèm"
  return ""
}
