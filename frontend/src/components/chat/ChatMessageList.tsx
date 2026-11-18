import { EmptyState } from "@/components/common/empty-state"
import type { ChatMessageDto } from "@/types/chat.types"

import type { RefObject } from "react"

import { MessageSquare } from "lucide-react"

import { ChatMessageItem } from "./ChatMessageItem"

interface ChatMessageListProps {
  messages: ChatMessageDto[]
  currentEmployeeId?: string
  conversationType: string
  isLoading: boolean
  isLoadingPreviousPage: boolean
  typingNames: string[]
  editingMessageId: string | null
  editContent: string
  messagesContainerRef: RefObject<HTMLDivElement | null>
  messagesEndRef: RefObject<HTMLDivElement | null>
  onMessagesScroll: () => void
  getMessageReceipt: (message: ChatMessageDto) => string
  onEditContentChange: (content: string) => void
  onCancelEdit: () => void
  onSaveEdit: (messageId: string) => void
  onStartEdit: (message: ChatMessageDto) => void
  onForward: (messageId: string) => void
  onTogglePin: (messageId: string, isPinned: boolean) => void
  onRecall: (messageId: string) => void
  onPreviewImage: (fileUrl: string | null) => void
}

export function ChatMessageList({
  messages,
  currentEmployeeId,
  conversationType,
  isLoading,
  isLoadingPreviousPage,
  typingNames,
  editingMessageId,
  editContent,
  messagesContainerRef,
  messagesEndRef,
  onMessagesScroll,
  getMessageReceipt,
  onEditContentChange,
  onCancelEdit,
  onSaveEdit,
  onStartEdit,
  onForward,
  onTogglePin,
  onRecall,
  onPreviewImage,
}: ChatMessageListProps) {
  return (
    <div
      ref={messagesContainerRef}
      onScroll={onMessagesScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3.5"
    >
      {isLoadingPreviousPage && (
        <div className="text-center py-2 text-xs text-muted-foreground">
          Đang tải tin nhắn cũ hơn...
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-6 text-xs text-muted-foreground">Đang tải tin nhắn...</div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có tin nhắn nào trong cuộc trò chuyện này."
          description="Hãy gửi lời chào hoặc gõ @ để nhắc đến ai đó!"
          compact
          className="py-12"
        />
      ) : (
        messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            conversationType={conversationType}
            currentEmployeeId={currentEmployeeId}
            isEditing={editingMessageId === message.id}
            editContent={editContent}
            receiptStatus={getMessageReceipt(message)}
            onEditContentChange={onEditContentChange}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onStartEdit={onStartEdit}
            onForward={onForward}
            onTogglePin={onTogglePin}
            onRecall={onRecall}
            onPreviewImage={onPreviewImage}
          />
        ))
      )}
      {typingNames.length > 0 && (
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {typingNames.join(", ")} đang nhập...
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
