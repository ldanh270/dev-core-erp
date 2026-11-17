import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CHAT_CONFIG, CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useAuthStore } from "@/store/auth-store"
import type { ChatMessageDto, ConversationSummaryDto, SendMessageDto } from "@/types/chat.types"

import React, { useEffect, useRef, useState } from "react"

import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Check,
  Download,
  FileText,
  Forward,
  MessageSquare,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { ConversationDetailsPanel } from "./ConversationDetailsPanel"
import { MentionInput } from "./MentionInput"
import { MentionMessageRenderer } from "./MentionMessageRenderer"

interface ChatWindowProps {
  /** Omitted while the route has no matching conversation or the list is still loading. */
  conversation?: ConversationSummaryDto
  /** Chronological messages for the selected conversation. */
  messages: ChatMessageDto[]
  /** Existing accessible conversations shown as possible forwarding destinations. */
  conversations: ConversationSummaryDto[]
  /** Parent mutation handler; rejection is surfaced by the chat mutation hook. */
  onSendMessage: (data: SendMessageDto) => Promise<void>
  onEditMessage: (messageId: string, content: string) => void
  onRecallMessage: (messageId: string) => void
  onSetMessagePinned: (messageId: string, isPinned: boolean) => void
  onForwardMessage: (messageId: string, conversationIds: string[]) => void
  isLoading?: boolean
}

/**
 * Renders the selected conversation, message history, and composer.
 * The selected conversation controls the header/details panel, while image previews stay local to
 * this window and are discarded when the component unmounts.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  conversations,
  onSendMessage,
  onEditMessage,
  onRecallMessage,
  onSetMessagePinned,
  onForwardMessage,
  isLoading,
}) => {
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null)
  const [forwardConversationIds, setForwardConversationIds] = useState<string[]>([])

  // Keep the newest message in view whenever the rendered message list changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // The details panel is scoped to one conversation; don't leave it open against a newly selected chat.
  useEffect(() => {
    setIsDetailsOpen(false)
  }, [conversation?.id])

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 h-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-1">
          Chào mừng đến với phân hệ Tin nhắn
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          Trò chuyện trực tiếp 1-1 hoặc theo nhóm. Gõ @ để nhắc nhân viên, # để gắn thẻ dự án, ! để
          gắn thẻ công việc.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setIsDetailsOpen((open) => !open)
          }}
          aria-expanded={isDetailsOpen}
          aria-label="Mở thông tin cuộc trò chuyện"
          className="flex min-w-0 items-center gap-3 text-left hover:opacity-80"
        >
          <div className="relative shrink-0">
            {conversation.type === CONVERSATION_TYPE.GROUP ? (
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {conversation.avatarUrl ? (
                  <img
                    src={conversation.avatarUrl}
                    alt={conversation.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  conversation.title.charAt(0).toUpperCase()
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{conversation.title}</h3>
            <span className="text-[11px] text-muted-foreground truncate">
              {conversation.type === CONVERSATION_TYPE.GROUP
                ? `${conversation.participants.length} thành viên`
                : "Trò chuyện 1-1"}
            </span>
          </div>
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {isLoading ? (
          <div className="text-center py-6 text-xs text-muted-foreground">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-xs">Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
            <p className="text-[11px]">Hãy gửi lời chào hoặc gõ @ để nhắc đến ai đó!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id
            const timeStr = format(new Date(msg.createdAt), "HH:mm", { locale: vi })

            return (
              <div
                key={msg.id}
                className={`group flex gap-2.5 items-end ${isMe ? "justify-end" : "justify-start"}`}
              >
                {/* Partner avatar if not me */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      msg.senderName.charAt(0).toUpperCase()
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && conversation.type === CONVERSATION_TYPE.GROUP && (
                    <span className="text-[10px] text-muted-foreground mb-1 ml-1">
                      {msg.senderName}
                    </span>
                  )}

                  <div className="flex items-start gap-1">
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-muted text-foreground rounded-bl-xs border border-border/50"
                      }`}
                    >
                      {editingMessageId === msg.id ? (
                        <div className="min-w-52 space-y-2">
                          <textarea
                            autoFocus
                            value={editContent}
                            onChange={(event) => {
                              setEditContent(event.target.value)
                            }}
                            maxLength={4000}
                            aria-label="Chỉnh sửa nội dung tin nhắn"
                            className="w-full min-h-20 resize-y rounded-md border border-border bg-background p-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(null)
                              }}
                              className="rounded px-2 py-1 text-[11px] hover:bg-background/20"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onEditMessage(msg.id, editContent)
                                setEditingMessageId(null)
                              }}
                              className="rounded bg-background/20 px-2 py-1 text-[11px] font-medium hover:bg-background/30"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : msg.isRecalled ? (
                        <span className="italic opacity-75">Tin nhắn đã được thu hồi</span>
                      ) : (
                        <>
                          {msg.isPinned && (
                            <div className="mb-1 flex items-center gap-1 text-[10px] opacity-80">
                              <Pin className="h-3 w-3" />
                              Đã ghim
                            </div>
                          )}

                          {/* Image Attachment */}
                          {msg.type === "image" && msg.fileUrl && (
                            <div className="mb-1.5 overflow-hidden rounded-lg">
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || "Ảnh đính kèm"}
                                onClick={() => {
                                  setPreviewImage(msg.fileUrl || null)
                                }}
                                className="max-h-60 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              />
                            </div>
                          )}

                          {/* File Attachment */}
                          {msg.type === "file" && msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
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
                                {msg.fileName || "Tệp đính kèm"}
                              </span>
                              <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            </a>
                          )}

                          {/* Text content with mentions */}
                          {msg.content && (
                            <MentionMessageRenderer
                              content={msg.content}
                              mentions={msg.mentions}
                              isOutgoing={isMe}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {!msg.isRecalled && editingMessageId !== msg.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Thao tác tin nhắn"
                            className="mt-1 rounded-full p-1 text-muted-foreground opacity-100 transition-opacity hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMe ? "end" : "start"} className="w-44">
                          {isMe && (
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditContent(msg.content)
                                setEditingMessageId(msg.id)
                              }}
                            >
                              <Pencil />
                              Chỉnh sửa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={() => {
                              setForwardConversationIds([])
                              setForwardingMessageId(msg.id)
                            }}
                          >
                            <Forward />
                            Chuyển tiếp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              onSetMessagePinned(msg.id, !msg.isPinned)
                            }}
                          >
                            {msg.isPinned ? <PinOff /> : <Pin />}
                            {msg.isPinned ? "Bỏ ghim" : "Ghim"}
                          </DropdownMenuItem>
                          {isMe && (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                if (window.confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) {
                                  onRecallMessage(msg.id)
                                }
                              }}
                            >
                              <Trash2 />
                              Thu hồi
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{timeStr}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <MentionInput onSendMessage={onSendMessage} />

      {/* Keep conversation tools in this pane so the message context remains visible. */}
      {isDetailsOpen && (
        <ConversationDetailsPanel
          conversation={conversation}
          onClose={() => {
            setIsDetailsOpen(false)
          }}
        />
      )}

      <Dialog
        open={Boolean(forwardingMessageId)}
        onOpenChange={(open) => {
          if (!open) setForwardingMessageId(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển tiếp tin nhắn</DialogTitle>
            <DialogDescription>
              Chọn một hoặc nhiều cuộc trò chuyện nhận tin nhắn.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {conversations.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={forwardConversationIds.includes(item.id)}
                  disabled={
                    !forwardConversationIds.includes(item.id) &&
                    forwardConversationIds.length >= CHAT_CONFIG.MAX_FORWARD_CONVERSATIONS
                  }
                  onChange={(event) => {
                    setForwardConversationIds((selected) =>
                      event.target.checked
                        ? [...selected, item.id]
                        : selected.filter((id) => id !== item.id),
                    )
                  }}
                />
                <span className="truncate text-sm">{item.title}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                if (forwardingMessageId && forwardConversationIds.length) {
                  onForwardMessage(forwardingMessageId, forwardConversationIds)
                  setForwardingMessageId(null)
                }
              }}
              disabled={!forwardConversationIds.length}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Chuyển tiếp
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setPreviewImage(null)
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Xem trước ảnh"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setPreviewImage(null)
              }}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-background text-foreground shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
