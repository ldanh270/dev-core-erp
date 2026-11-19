import { Button } from "@/components/ui/button"
import type { ChatMessageDto } from "@/types/chat.types"

import { Download, FileText, Pin } from "lucide-react"

import { MentionMessageRenderer } from "./MentionMessageRenderer"

interface ChatMessageContentProps {
  message: ChatMessageDto
  isMe: boolean
  isEditing: boolean
  editContent: string
  onEditContentChange: (content: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onPreviewImage: () => void
}

/** Renders message payload variants and keeps each variant in a single presentational component. */
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
            maxLength={4000}
            aria-label="Chỉnh sửa nội dung tin nhắn"
            className="w-full min-h-20 resize-y rounded-md border border-border bg-background p-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={onCancelEdit}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
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
          {message.type === "image" && message.fileUrl && (
            <div className="mb-1.5 overflow-hidden rounded-lg">
              <img
                src={message.fileUrl}
                alt={message.fileName || "Ảnh đính kèm"}
                onClick={onPreviewImage}
                className="max-h-60 max-w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
              />
            </div>
          )}
          {message.type === "file" && message.fileUrl && (
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
          )}
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
