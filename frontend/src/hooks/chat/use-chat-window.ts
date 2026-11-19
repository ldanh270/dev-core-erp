import type { ChatWindowProps } from "@/components/chat/chat-window.types"
import { useConfirm } from "@/components/common"
import type { ChatMessageDto } from "@/types/chat.types"

import { useEffect, useRef, useState } from "react"

type UseChatWindowOptions = Pick<
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
> & { currentEmployeeId?: string }

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
  const otherParticipants =
    conversation?.participants.filter(
      (participant) => participant.employeeId !== currentEmployeeId,
    ) ?? []
  const typingNames = otherParticipants
    .filter((participant) => typingEmployeeIds.includes(participant.employeeId))
    .map((participant) => participant.fullName)
  const onlineCount = otherParticipants.filter((participant) =>
    onlineEmployeeIds.includes(participant.employeeId),
  ).length

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

  const handleMessagesScroll = () => {
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
  }

  const getMessageReceipt = (message: ChatMessageDto) => {
    const hasBeenRead = otherParticipants.some((participant) => {
      const lastReadAt = readAtByEmployeeId[participant.employeeId]
      return lastReadAt && new Date(lastReadAt) >= new Date(message.createdAt)
    })

    return hasBeenRead ? "Đã xem" : deliveredMessageIds.includes(message.id) ? "Đã nhận" : "Đã gửi"
  }

  const startEditingMessage = (message: ChatMessageDto) => {
    setEditContent(message.content)
    setEditingMessageId(message.id)
  }

  const saveEditedMessage = (messageId: string) => {
    onEditMessage(messageId, editContent)
    setEditingMessageId(null)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
  }
  const toggleDetails = () => {
    setIsDetailsOpen((open) => !open)
  }
  const closeDetails = () => {
    setIsDetailsOpen(false)
  }

  const recallMessage = async (messageId: string) => {
    const confirmed = await confirm({
      title: "Thu hồi tin nhắn?",
      description: "Tin nhắn sẽ được thay bằng thông báo đã thu hồi với mọi thành viên.",
      confirmText: "Thu hồi",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (confirmed) onRecallMessage(messageId)
  }

  const startForwardingMessage = (messageId: string) => {
    setForwardConversationIds([])
    setForwardingMessageId(messageId)
  }

  const toggleForwardConversation = (conversationId: string, isSelected: boolean) => {
    setForwardConversationIds((selected) =>
      isSelected ? [...selected, conversationId] : selected.filter((id) => id !== conversationId),
    )
  }

  const submitForward = () => {
    if (!forwardingMessageId || !forwardConversationIds.length) return
    onForwardMessage(forwardingMessageId, forwardConversationIds)
    setForwardingMessageId(null)
  }

  const handleForwardDialogChange = (isOpen: boolean) => {
    if (!isOpen) setForwardingMessageId(null)
  }

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
