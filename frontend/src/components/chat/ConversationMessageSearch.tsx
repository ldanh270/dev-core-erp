import { Input } from "@/components/ui/input"
import { useConversationMessageSearch } from "@/hooks/chat/use-conversation-message-search"

import { format } from "date-fns"
import { Search } from "lucide-react"

interface ConversationMessageSearchProps {
  conversationId: string
}

/**
 * Renders search controls and previews for messages in a conversation.
 */
export function ConversationMessageSearch({ conversationId }: ConversationMessageSearchProps) {
  const { messageQuery, setMessageQuery, debouncedMessageQuery, isFetching, isError, messages } =
    useConversationMessageSearch(conversationId)
  const hasValidQuery = debouncedMessageQuery.length >= 2

  return (
    <div className="space-y-2 border-b border-border p-3">
      <label className="text-xs font-semibold text-foreground" htmlFor="chat-message-search">
        Tìm kiếm tin nhắn
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="chat-message-search"
          value={messageQuery}
          onChange={(event) => {
            setMessageQuery(event.target.value)
          }}
          placeholder="Tìm trong cuộc trò chuyện..."
          className="rounded-full border-border bg-muted/50 py-2 pl-9 pr-3 text-xs"
        />
      </div>

      {messageQuery.trim().length > 0 && messageQuery.trim().length < 2 && (
        <p className="text-xs text-muted-foreground">Nhập ít nhất 2 ký tự để tìm.</p>
      )}
      {hasValidQuery && (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {isFetching ? (
            <p className="p-2 text-xs text-muted-foreground">Đang tìm tin nhắn...</p>
          ) : isError ? (
            <p className="p-2 text-xs text-destructive">
              Không thể tìm tin nhắn. Vui lòng thử lại.
            </p>
          ) : messages.length ? (
            messages.map((message) => (
              <div key={message.id} className="rounded-lg p-2 hover:bg-muted/70">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    {message.senderName}
                  </span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm")}
                  </time>
                </div>
                <p className="break-words text-xs text-muted-foreground">{message.preview}</p>
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
