import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import { useCallback } from "react"

import { format } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Options accepted by the useChatMessageItem hook.
 */
export interface UseChatMessageItemOptions {
  /** The chat message item being rendered. */
  message: ChatMessageDto
  /** Type of the parent conversation (direct or group). */
  conversationType: string
  /** Logged-in employee ID to identify sent vs received messages. */
  currentEmployeeId?: string
  /** Callback fired when inline edit content changes. */
  onEditContentChange: (content: string) => void
  /** Callback saving edited message content. */
  onSaveEdit: (messageId: string) => void
  /** Callback initiating message editing mode. */
  onStartEdit: (message: ChatMessageDto) => void
  /** Callback opening forward dialog for this message. */
  onForward: (messageId: string) => void
  /** Callback toggling message pin status. */
  onTogglePin: (messageId: string, isPinned: boolean) => void
  /** Callback initiating message recall. */
  onRecall: (messageId: string) => void
  /** Callback opening image attachment preview. */
  onPreviewImage: (fileUrl: string | null) => void
}

/**
 * Derives message ownership, timestamp formatting, and wraps item actions in useCallback.
 *
 * @param options Configuration options and callbacks
 * @returns Formatted display values and memoized event handlers
 */
export function useChatMessageItem(options: UseChatMessageItemOptions) {
  const {
    message,
    conversationType,
    currentEmployeeId,
    onSaveEdit,
    onPreviewImage,
    onStartEdit,
    onForward,
    onTogglePin,
    onRecall,
  } = options

  const isMe = message.senderId === currentEmployeeId
  const timeText = format(new Date(message.createdAt), "HH:mm", { locale: vi })
  const isGroupConversation = conversationType === CONVERSATION_TYPE.GROUP

  /**
   * Persists the current edit draft for this message.
   */
  const saveEdit = useCallback(() => {
    onSaveEdit(message.id)
  }, [message.id, onSaveEdit])

  /**
   * Opens full-size preview for the attached image.
   */
  const previewImage = useCallback(() => {
    onPreviewImage(message.fileUrl || null)
  }, [message.fileUrl, onPreviewImage])

  /**
   * Enters inline edit mode for this message.
   */
  const startEdit = useCallback(() => {
    onStartEdit(message)
  }, [message, onStartEdit])

  /**
   * Opens the forwarding modal with this message selected.
   */
  const forward = useCallback(() => {
    onForward(message.id)
  }, [message.id, onForward])

  /**
   * Toggles pinned state for this message.
   */
  const togglePin = useCallback(() => {
    onTogglePin(message.id, !message.isPinned)
  }, [message.id, message.isPinned, onTogglePin])

  /**
   * Initiates recall confirmation for this message.
   */
  const recall = useCallback(() => {
    onRecall(message.id)
  }, [message.id, onRecall])

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
