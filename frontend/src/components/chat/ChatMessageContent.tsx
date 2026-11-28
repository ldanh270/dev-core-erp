import { Button } from "@/components/ui/button"
import { CHAT_BUTTON_SIZE, CHAT_BUTTON_VARIANT, CHAT_CONFIG } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import { Pin } from "lucide-react"

import { ChatMessageAttachment } from "./ChatMessageAttachment"
import { MentionMessageRenderer } from "./MentionMessageRenderer"

/**
 * Properties for rendering message content payloads (text, attachments, tombstones, and inline edit mode).
 */
interface ChatMessageContentProps {
  /** The message entity to render. */
  message: ChatMessageDto
  /** Whether the message was authored by the authenticated employee. */
  isMe: boolean
  /** Whether the message is currently in inline editing mode. */
  isEditing: boolean
  /** Current draft text entered inside the editing textarea. */
  editContent: string
  /** Callback fired as the editing textarea text changes. */
  onEditContentChange: (content: string) => void
  /** Callback to cancel editing and discard unsaved draft changes. */
  onCancelEdit: () => void
  /** Callback to submit and save the edited message text. */
  onSaveEdit: () => void
  /** Callback to open full-screen preview for an attached image. */
  onPreviewImage: () => void
}

/**
 * Renders the body content of a chat message bubble, including inline editor,
 * recalled tombstone notices, pinned indicators, media attachments, and interactive mentions.
 *
 * @param props - Properties conforming to {@link ChatMessageContentProps}.
 * @returns Rendered message bubble container.
 */
export function ChatMessageContent({
  message,
  isMe,
  isEditing,
  editContent,
  onEditContentChange,
  onCancelEdit,
  onSaveEdit,
  onPreviewImage,
}: ChatMessageContentProps) {
  return (
    <div
      className={`rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
        isMe
          ? "bg-primary text-primary-foreground rounded-br-xs"
          : "bg-muted text-foreground rounded-bl-xs border border-border/50"
      }`}
    >
      {isEditing ? (
        <div className="min-w-52 space-y-2">
          <textarea
            autoFocus
            value={editContent}
            onChange={(event) => {
              onEditContentChange(event.target.value)
            }}
            maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            aria-label="Chỉnh sửa nội dung tin nhắn"
            className="w-full min-h-20 resize-y rounded-md border border-border bg-background p-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant={CHAT_BUTTON_VARIANT.GHOST}
              size={CHAT_BUTTON_SIZE.XS}
              onClick={onCancelEdit}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant={CHAT_BUTTON_VARIANT.GHOST}
              size={CHAT_BUTTON_SIZE.XS}
              onClick={onSaveEdit}
              className="bg-background/20 text-[11px] hover:bg-background/30"
            >
              Lưu
            </Button>
          </div>
        </div>
      ) : message.isRecalled ? (
        <span className="italic opacity-75">Tin nhắn đã được thu hồi</span>
      ) : (
        <>
          {message.isPinned && (
            <div className="mb-1 flex items-center gap-1 text-[10px] opacity-80">
              <Pin className="h-3 w-3" />
              Đã ghim
            </div>
          )}
          <ChatMessageAttachment message={message} isMe={isMe} onPreviewImage={onPreviewImage} />
          {message.content && (
            <MentionMessageRenderer
              content={message.content}
              mentions={message.mentions}
              isOutgoing={isMe}
            />
          )}
        </>
      )}
    </div>
  )
}
