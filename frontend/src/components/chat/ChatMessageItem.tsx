import { useChatMessageItem } from "@/hooks/chat/use-chat-message-item"
import type { ChatMessageDto } from "@/types/chat.types"

import { ChatMessageActions } from "./ChatMessageActions"
import { ChatMessageContent } from "./ChatMessageContent"

interface ChatMessageItemProps {
  message: ChatMessageDto
  conversationType: string
  currentEmployeeId?: string
  isEditing: boolean
  editContent: string
  receiptStatus: string
  onEditContentChange: (content: string) => void
  onCancelEdit: () => void
  onSaveEdit: (messageId: string) => void
  onStartEdit: (message: ChatMessageDto) => void
  onForward: (messageId: string) => void
  onTogglePin: (messageId: string, isPinned: boolean) => void
  onRecall: (messageId: string) => void
  onPreviewImage: (fileUrl: string | null) => void
}

export function ChatMessageItem({
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
}
