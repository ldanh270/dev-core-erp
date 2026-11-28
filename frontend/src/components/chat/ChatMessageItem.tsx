import { useChatMessageItem } from "@/hooks/chat/use-chat-message-item"
import type { ChatMessageDto } from "@/types/chat.types"

import { memo } from "react"

import { ChatMessageActions } from "./ChatMessageActions"
import { ChatMessageContent } from "./ChatMessageContent"

/**
 * Properties for rendering an individual chat message row.
 */
interface ChatMessageItemProps {
  /** The chat message entity to render. */
  message: ChatMessageDto
  /** Category of the current conversation (e.g. direct or group). */
  conversationType: string
  /** The authenticated employee ID used to determine message ownership and alignment. */
  currentEmployeeId?: string
  /** Whether this specific message is currently undergoing inline editing. */
  isEditing: boolean
  /** Draft text currently entered in the inline edit field. */
  editContent: string
  /** Read receipt label (e.g. "Đã gửi", "Đã nhận", "Đã xem") for outgoing messages. */
  receiptStatus: string
  /** Callback fired when the draft edit content changes. */
  onEditContentChange: (content: string) => void
  /** Callback to cancel inline editing and discard changes. */
  onCancelEdit: () => void
  /** Callback to persist updated message content. */
  onSaveEdit: (messageId: string) => void
  /** Callback to start editing mode for this message. */
  onStartEdit: (message: ChatMessageDto) => void
  /** Callback to open the message forwarding dialog. */
  onForward: (messageId: string) => void
  /** Callback to toggle the pinned status of this message. */
  onTogglePin: (messageId: string, isPinned: boolean) => void
  /** Callback to recall / unsend this message. */
  onRecall: (messageId: string) => void
  /** Callback to preview an attached image in full screen. */
  onPreviewImage: (fileUrl: string | null) => void
}

/**
 * Renders an individual chat message with sender metadata, text/attachment payload,
 * action menu, and delivery timestamp.
 * Wrapped in React.memo to prevent unnecessary re-rendering across long message lists.
 *
 * @param props - Properties conforming to {@link ChatMessageItemProps}.
 * @returns Memoized chat message element.
 */
export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  conversationType,
  currentEmployeeId,
  isEditing,
  editContent,
  receiptStatus,
  onEditContentChange,
  onCancelEdit,
  onSaveEdit,
  onStartEdit,
  onForward,
  onTogglePin,
  onRecall,
  onPreviewImage,
}: ChatMessageItemProps) {
  const {
    isMe,
    timeText,
    isGroupConversation,
    saveEdit,
    previewImage,
    startEdit,
    forward,
    togglePin,
    recall,
  } = useChatMessageItem({
    message,
    conversationType,
    currentEmployeeId,
    onEditContentChange,
    onSaveEdit,
    onStartEdit,
    onForward,
    onTogglePin,
    onRecall,
    onPreviewImage,
  })

  return (
    <div className={`group flex gap-2.5 items-end ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mb-1">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            message.senderName.charAt(0).toUpperCase()
          )}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && isGroupConversation && (
          <span className="text-[10px] text-muted-foreground mb-1 ml-1">{message.senderName}</span>
        )}

        <div className="flex items-start gap-1">
          <ChatMessageContent
            message={message}
            isMe={isMe}
            isEditing={isEditing}
            editContent={editContent}
            onEditContentChange={onEditContentChange}
            onCancelEdit={onCancelEdit}
            onSaveEdit={saveEdit}
            onPreviewImage={previewImage}
          />
          <ChatMessageActions
            message={message}
            isMe={isMe}
            isEditing={isEditing}
            onStartEdit={startEdit}
            onForward={forward}
            onTogglePin={togglePin}
            onRecall={recall}
          />
        </div>

        <span className="text-[9px] text-muted-foreground mt-0.5 px-1">
          {timeText}
          {isMe && (
            <>
              {" · "}
              {receiptStatus}
            </>
          )}
        </span>
      </div>
    </div>
  )
})
