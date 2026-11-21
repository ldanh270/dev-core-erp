import type { ChatWindowProps } from "@/components/chat/chat-window.types"
import { useConfirm } from "@/components/common"
import { CHAT_BUTTON_VARIANT, CHAT_RECEIPT_STATUS } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Options accepted by the useChatWindow hook.
 */
export type UseChatWindowOptions = Pick<
  ChatWindowProps,
  | "conversation"
  | "messages"
  | "onlineEmployeeIds"
  | "typingEmployeeIds"
  | "readAtByEmployeeId"
  | "deliveredMessageIds"
  | "onLoadPreviousPage"
  | "hasPreviousPage"
  | "isLoadingPreviousPage"
  | "onEditMessage"
  | "onRecallMessage"
  | "onSetMessagePinned"
  | "onForwardMessage"
> & {
  /** Employee ID of the currently logged-in user. */
  currentEmployeeId?: string
}

/**
 * Custom hook managing interactive states, callbacks, scrolling, editing, and forwarding for ChatWindow.
 * Memoizes handlers with useCallback to avoid unnecessary re-renders.
 *
 * @param options Configuration options and parent action callbacks
 * @returns State and event handlers for the ChatWindow component
 */
export function useChatWindow(options: UseChatWindowOptions) {
  const {
    conversation,
    messages,
    onlineEmployeeIds,
    typingEmployeeIds,
    readAtByEmployeeId,
    deliveredMessageIds,
    onLoadPreviousPage,
    hasPreviousPage,
    isLoadingPreviousPage,
    onEditMessage,
    onRecallMessage,
    onSetMessagePinned,
    onForwardMessage,
    currentEmployeeId,
  } = options

  const confirm = useConfirm()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const latestMessageIdRef = useRef<string | null>(null)

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null)
  const [forwardConversationIds, setForwardConversationIds] = useState<string[]>([])

  const otherParticipants = useMemo(
    () =>
      conversation?.participants.filter(
        (participant) => participant.employeeId !== currentEmployeeId,
      ) ?? [],
    [conversation?.participants, currentEmployeeId],
  )

  const typingNames = useMemo(
    () =>
      otherParticipants
        .filter((participant) => typingEmployeeIds.includes(participant.employeeId))
        .map((participant) => participant.fullName),
    [otherParticipants, typingEmployeeIds],
  )

  const onlineCount = useMemo(
    () =>
      otherParticipants.filter((participant) => onlineEmployeeIds.includes(participant.employeeId))
        .length,
    [otherParticipants, onlineEmployeeIds],
  )

  useEffect(() => {
    const latestMessageId = messages.at(-1)?.id ?? null
    if (latestMessageId !== latestMessageIdRef.current) {
      latestMessageIdRef.current = latestMessageId
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    setIsDetailsOpen(false)
    latestMessageIdRef.current = null
  }, [conversation?.id])

  /**
   * Handles upward scrolling to automatically load previous message history pages.
   */
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || container.scrollTop > 80 || !hasPreviousPage || isLoadingPreviousPage) return

    const previousHeight = container.scrollHeight
    void onLoadPreviousPage().then(() => {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight - previousHeight
        }
      })
    })
  }, [hasPreviousPage, isLoadingPreviousPage, onLoadPreviousPage])

  /**
   * Computes the delivery and read receipt status for a message.
   *
   * @param message Chat message to determine receipt status for
   * @returns Formatted receipt label string
   */
  const getMessageReceipt = useCallback(
    (message: ChatMessageDto) => {
      const hasBeenRead = otherParticipants.some((participant) => {
        const lastReadAt = readAtByEmployeeId[participant.employeeId]
        return lastReadAt && new Date(lastReadAt) >= new Date(message.createdAt)
      })

      return hasBeenRead
        ? CHAT_RECEIPT_STATUS.READ
        : deliveredMessageIds.includes(message.id)
          ? CHAT_RECEIPT_STATUS.DELIVERED
          : CHAT_RECEIPT_STATUS.SENT
    },
    [deliveredMessageIds, otherParticipants, readAtByEmployeeId],
  )

  /**
   * Initiates inline editing for a specified message.
   *
   * @param message Target message to edit
   */
  const startEditingMessage = useCallback((message: ChatMessageDto) => {
    setEditContent(message.content)
    setEditingMessageId(message.id)
  }, [])

  /**
   * Persists edited message content through the parent callback.
   *
   * @param messageId ID of the message being edited
   */
  const saveEditedMessage = useCallback(
    (messageId: string) => {
      onEditMessage(messageId, editContent)
      setEditingMessageId(null)
    },
    [editContent, onEditMessage],
  )

  /**
   * Cancels inline message editing mode.
   */
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null)
  }, [])

  /**
   * Toggles the visibility of the conversation details sidebar.
   */
  const toggleDetails = useCallback(() => {
    setIsDetailsOpen((open) => !open)
  }, [])

  /**
   * Closes the conversation details sidebar.
   */
  const closeDetails = useCallback(() => {
    setIsDetailsOpen(false)
  }, [])

  /**
   * Prompts user confirmation and recalls a message.
   *
   * @param messageId ID of the message to recall
   */
  const recallMessage = useCallback(
    async (messageId: string) => {
      const confirmed = await confirm({
        title: "Thu hồi tin nhắn?",
        description: "Tin nhắn sẽ được thay bằng thông báo đã thu hồi với mọi thành viên.",
        confirmText: "Thu hồi",
        cancelText: "Hủy",
        variant: CHAT_BUTTON_VARIANT.DESTRUCTIVE,
      })
      if (confirmed) onRecallMessage(messageId)
    },
    [confirm, onRecallMessage],
  )

  /**
   * Opens the message forwarding modal for the target message.
   *
   * @param messageId ID of the message to forward
   */
  const startForwardingMessage = useCallback((messageId: string) => {
    setForwardConversationIds([])
    setForwardingMessageId(messageId)
  }, [])

  /**
   * Toggles conversation selection in the forward dialog.
   *
   * @param conversationId Destination conversation ID
   * @param isSelected Whether the conversation is selected
   */
  const toggleForwardConversation = useCallback((conversationId: string, isSelected: boolean) => {
    setForwardConversationIds((selected) =>
      isSelected ? [...selected, conversationId] : selected.filter((id) => id !== conversationId),
    )
  }, [])

  /**
   * Submits message forwarding to all selected conversations.
   */
  const submitForward = useCallback(() => {
    if (!forwardingMessageId || !forwardConversationIds.length) return
    onForwardMessage(forwardingMessageId, forwardConversationIds)
    setForwardingMessageId(null)
  }, [forwardConversationIds, forwardingMessageId, onForwardMessage])

  /**
   * Handles forward modal open state changes.
   *
   * @param isOpen Modal open state
   */
  const handleForwardDialogChange = useCallback((isOpen: boolean) => {
    if (!isOpen) setForwardingMessageId(null)
  }, [])

  return {
    messagesEndRef,
    messagesContainerRef,
    previewImage,
    setPreviewImage,
    isDetailsOpen,
    toggleDetails,
    closeDetails,
    editingMessageId,
    editContent,
    setEditContent,
    cancelEditing,
    forwardingMessageId,
    handleForwardDialogChange,
    forwardConversationIds,
    typingNames,
    onlineCount,
    handleMessagesScroll,
    getMessageReceipt,
    startEditingMessage,
    saveEditedMessage,
    recallMessage,
    startForwardingMessage,
    toggleForwardConversation,
    submitForward,
    setMessagePinned: onSetMessagePinned,
  }
}
