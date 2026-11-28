import { CHAT_MESSAGE_TYPE } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import React from "react"

import { Download, FileText } from "lucide-react"

/**
 * Props for the ChatMessageAttachment component.
 */
export interface ChatMessageAttachmentProps {
  /** The chat message entity containing attachment details. */
  message: ChatMessageDto
  /** Indicates whether the message belongs to the current logged-in employee. */
  isMe: boolean
  /** Callback triggered when the user clicks an image attachment to view its full preview. */
  onPreviewImage: () => void
}

/**
 * Renders attachment preview (image or downloadable file) for a chat message.
 */
export const ChatMessageAttachment = React.memo(function ChatMessageAttachment({
  message,
  isMe,
  onPreviewImage,
}: ChatMessageAttachmentProps) {
  if (!message.fileUrl) return null

  if (message.type === CHAT_MESSAGE_TYPE.IMAGE) {
    return (
      <div className="mb-1.5 overflow-hidden rounded-lg">
        <img
          src={message.fileUrl}
          alt={message.fileName || "Ảnh đính kèm"}
          onClick={onPreviewImage}
          className="max-h-60 max-w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
        />
      </div>
    )
  }

  if (message.type === CHAT_MESSAGE_TYPE.FILE) {
    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`mb-1 flex items-center gap-2 rounded-lg p-2 transition-colors ${
          isMe
            ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
            : "border border-border bg-background text-foreground hover:bg-background/80"
        }`}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="max-w-[180px] truncate font-medium">
          {message.fileName || "Tệp đính kèm"}
        </span>
        <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </a>
    )
  }

  return null
})
