import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface UseChatMessageItemOptions {
  message: ChatMessageDto
  conversationType: string
  currentEmployeeId?: string
  onEditContentChange: (content: string) => void
  onSaveEdit: (messageId: string) => void
  onStartEdit: (message: ChatMessageDto) => void
  onForward: (messageId: string) => void
  onTogglePin: (messageId: string, isPinned: boolean) => void
  onRecall: (messageId: string) => void
  onPreviewImage: (fileUrl: string | null) => void
}

/** Derives message ownership/display state and adapts item callbacks to a single action. */
export function useChatMessageItem(options: UseChatMessageItemOptions) {
  const { message, conversationType, currentEmployeeId } = options
  const isMe = message.senderId === currentEmployeeId
  const timeText = format(new Date(message.createdAt), "HH:mm", { locale: vi })
  const isGroupConversation = conversationType === CONVERSATION_TYPE.GROUP

  const saveEdit = () => {
    options.onSaveEdit(message.id)
  }
  const previewImage = () => {
    options.onPreviewImage(message.fileUrl || null)
  }
  const startEdit = () => {
    options.onStartEdit(message)
  }
  const forward = () => {
    options.onForward(message.id)
  }
  const togglePin = () => {
    options.onTogglePin(message.id, !message.isPinned)
  }
  const recall = () => {
    options.onRecall(message.id)
  }

  return {
    isMe,
    timeText,
    isGroupConversation,
    saveEdit,
    previewImage,
    startEdit,
    forward,
    togglePin,
    recall,
  }
}
