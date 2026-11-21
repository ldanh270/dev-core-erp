import { EmptyState } from "@/components/common/empty-state"
import type { ChatMessageDto } from "@/types/chat.types"

import React, { type RefObject } from "react"

import { MessageSquare } from "lucide-react"

import { ChatMessageItem } from "./ChatMessageItem"

/**
 * Props for the ChatMessageList component.
 */
export interface ChatMessageListProps {
  /** List of chat messages rendered in chronological order. */
  messages: ChatMessageDto[]
  /** ID of the current authenticated user used to differentiate sent vs received messages. */
  currentEmployeeId?: string
  /** Conversation type: direct or group. */
  conversationType: string
  /** Indicates whether initial message loading is active. */
  isLoading: boolean
  /** Indicates whether an older history page is currently being fetched. */
  isLoadingPreviousPage: boolean
  /** Names of other room participants currently typing. */
  typingNames: string[]
  /** ID of the message currently in edit mode, or null. */
  editingMessageId: string | null
  /** Draft text buffer for inline editing. */
  editContent: string
  /** Reference to the scrollable container DOM element. */
  messagesContainerRef: RefObject<HTMLDivElement | null>
  /** Reference to the anchor div at the bottom of the list for auto-scrolling. */
  messagesEndRef: RefObject<HTMLDivElement | null>
  /** Callback fired on scroll to detect top reach and fetch older pages. */
  onMessagesScroll: () => void
  /** Computes read/delivered/sent receipt status string for a message. */
  getMessageReceipt: (message: ChatMessageDto) => string
  /** Callback updating the current inline edit buffer text. */
  onEditContentChange: (content: string) => void
  /** Callback canceling inline edit mode. */
  onCancelEdit: () => void
  /** Callback persisting an edited message to the backend. */
  onSaveEdit: (messageId: string) => void
  /** Callback initiating edit mode for a target message. */
  onStartEdit: (message: ChatMessageDto) => void
  /** Callback opening forward dialog for a message. */
  onForward: (messageId: string) => void
  /** Callback toggling pinned status for a message. */
  onTogglePin: (messageId: string, isPinned: boolean) => void
  /** Callback triggering message recall. */
  onRecall: (messageId: string) => void
  /** Callback displaying full preview of an image attachment. */
  onPreviewImage: (fileUrl: string | null) => void
}

/**
 * Renders the scrollable message stream, typing indicators, loading placeholders, and empty states.
 */
export const ChatMessageList = React.memo(function ChatMessageList({
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
})
