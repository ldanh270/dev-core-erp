import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { ROUTES } from "@/config/routes.config"
import { useDeleteConversation, useUpdateChatSettings } from "@/hooks/chat/use-chat"
import { routerNavigate } from "@/lib/router-navigator"
import { useAuthStore } from "@/store/auth-store"
import type { ChatMessageDto, ConversationSummaryDto } from "@/types/chat.types"

import React, { useEffect, useRef, useState } from "react"

import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Bell,
  BellOff,
  Download,
  FileText,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { MentionInput } from "./MentionInput"
import { MentionMessageRenderer } from "./MentionMessageRenderer"

interface ChatWindowProps {
  conversation?: ConversationSummaryDto
  messages: ChatMessageDto[]
  onSendMessage: (data: any) => Promise<void>
  isLoading?: boolean
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  isLoading,
}) => {
  const { user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 h-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-1">Chào mừng đến với phân hệ Tin nhắn</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          Trò chuyện trực tiếp 1-1 hoặc theo nhóm. Gõ @ để nhắc nhân viên, # để gắn thẻ dự án, ! để gắn thẻ công việc.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
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
        </div>
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
                className={`flex gap-2.5 items-end ${isMe ? "justify-end" : "justify-start"}`}
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
                <div
                  className={`max-w-[70%] flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {!isMe && conversation.type === CONVERSATION_TYPE.GROUP && (
                    <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.senderName}</span>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted text-foreground rounded-bl-xs border border-border/50"
                    }`}
                  >
                    {/* Image Attachment */}
                    {msg.type === "image" && msg.fileUrl && (
                      <div className="mb-1.5 overflow-hidden rounded-lg">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || "Ảnh đính kèm"}
                          onClick={() => setPreviewImage(msg.fileUrl || null)}
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
                        <span className="truncate max-w-[180px] font-medium">{msg.fileName || "Tệp đính kèm"}</span>
                        <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </a>
                    )}

                    {/* Text content with mentions */}
                    {msg.content && (
                      <MentionMessageRenderer content={msg.content} mentions={msg.mentions} />
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Xem trước ảnh" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
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
