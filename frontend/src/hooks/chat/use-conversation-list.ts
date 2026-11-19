import { useConfirm } from "@/components/common"
import { CONVERSATION_TYPE, type IConversationType } from "@/config/entities/chat.config"
import { useDeleteConversation, useUpdateChatSettings } from "@/hooks/chat/use-chat"
import type { ConversationSummaryDto } from "@/types/chat.types"

import { useMemo, useState } from "react"

import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

/** Owns conversation filtering, display data, and per-member conversation actions. */
export function useConversationList(conversations: ConversationSummaryDto[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | IConversationType>("all")
  const updateSettingsMutation = useUpdateChatSettings()
  const deleteConversationMutation = useDeleteConversation()
  const confirm = useConfirm()

  const filteredConversations = useMemo(
    () =>
      conversations
        .filter((conversation) => {
          const matchesSearch = conversation.title
            .toLocaleLowerCase()
            .includes(searchTerm.trim().toLocaleLowerCase())
          if (filterType === "all") return matchesSearch
          return matchesSearch && conversation.type === filterType
        })
        .map((conversation) => ({
          ...conversation,
          timeAgo: conversation.lastMessage?.createdAt
            ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                addSuffix: true,
                locale: vi,
              })
            : "",
          lastMessagePreview: getLastMessagePreview(conversation),
        })),
    [conversations, filterType, searchTerm],
  )

  const togglePin = (conversation: ConversationSummaryDto) => {
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isPinned: !conversation.isPinned },
    })
  }

  const toggleMute = (conversation: ConversationSummaryDto) => {
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isMuted: !conversation.isMuted },
    })
  }

  const toggleRestricted = (conversation: ConversationSummaryDto) => {
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isRestricted: !conversation.isRestricted },
    })
  }

  const deleteConversation = async (conversation: ConversationSummaryDto) => {
    const confirmed = await confirm({
      title: "Xoá cuộc trò chuyện?",
      description: `Cuộc trò chuyện với "${conversation.title}" sẽ bị ẩn khỏi tài khoản của bạn.`,
      confirmText: "Xoá",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (confirmed) deleteConversationMutation.mutate(conversation.id)
  }

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredConversations,
    togglePin,
    toggleMute,
    toggleRestricted,
    deleteConversation,
    isDirectFilter: filterType === CONVERSATION_TYPE.DIRECT,
  }
}

function getLastMessagePreview(conversation: ConversationSummaryDto): string {
  const lastMessage = conversation.lastMessage
  if (!lastMessage) return "Bắt đầu trò chuyện"
  if (lastMessage.isRecalled) return "Tin nhắn đã được thu hồi"
  if (lastMessage.type === "image") return "Đã gửi một hình ảnh"
  if (lastMessage.type === "file") return "Đã gửi một tệp đính kèm"
  return lastMessage.content.replace(/[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g, "$1")
}
