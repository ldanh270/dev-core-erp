import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChatMessageItem } from "@/hooks/chat/use-chat-message-item"
import type { ChatMessageDto } from "@/types/chat.types"

import {
  Download,
  FileText,
  Forward,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react"

import { MentionMessageRenderer } from "./MentionMessageRenderer"

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
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={onCancelEdit}
                    className="text-[11px] hover:bg-background/20"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={saveEdit}
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
                      onClick={previewImage}
                      className="max-h-60 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {message.type === "file" && message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 p-2 rounded-lg mb-1 transition-colors ${
                      isMe
                        ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background hover:bg-background/80 text-foreground border border-border"
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[180px] font-medium">
                      {message.fileName || "Tệp đính kèm"}
                    </span>
                    <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
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

          {!message.isRecalled && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Thao tác tin nhắn"
                  className="mt-1 text-muted-foreground opacity-100 transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isMe ? "end" : "start"} className="w-44">
                {isMe && (
                  <DropdownMenuItem onSelect={startEdit}>
                    <Pencil />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={forward}>
                  <Forward />
                  Chuyển tiếp
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={togglePin}>
                  {message.isPinned ? <PinOff /> : <Pin />}
                  {message.isPinned ? "Bỏ ghim" : "Ghim"}
                </DropdownMenuItem>
                {isMe && (
                  <DropdownMenuItem variant="destructive" onSelect={recall}>
                    <Trash2 />
                    Thu hồi
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
