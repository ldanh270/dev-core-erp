import { useConfirm } from "@/components/common"
import {
  CHAT_CONVERSATION_FILTER,
  CHAT_MESSAGE_TYPE,
  CONVERSATION_TYPE,
  type IChatConversationFilter,
} from "@/config/entities/chat.config"
import { useDeleteConversation, useUpdateChatSettings } from "@/hooks/chat/use-chat"
import type { ConversationSummaryDto } from "@/types/chat.types"

import { useCallback, useMemo, useState } from "react"

import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Hook to manage conversation filtering, search query matching, preview formatting,
 * and per-member conversation actions (pin, mute, restrict, delete).
 *
 * @param conversations - List of conversation summaries belonging to the signed-in user.
 * @returns Filter state, search query, filtered and decorated conversations, and action handlers.
 * @example
 * ```tsx
 * const { filteredConversations, searchTerm, setSearchTerm, filterType, setFilterType } =
 *   useConversationList(conversations)
 * ```
 */
export function useConversationList(conversations: ConversationSummaryDto[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<IChatConversationFilter>(CHAT_CONVERSATION_FILTER.ALL)
  const updateSettingsMutation = useUpdateChatSettings()
  const deleteConversationMutation = useDeleteConversation()
  const confirm = useConfirm()

  /**
   * Filter and decorate conversations according to active filter and search text.
   */
  const filteredConversations = useMemo(
    () =>
      conversations
        .filter((conversation) => {
          const matchesSearch = conversation.title
            .toLocaleLowerCase()
            .includes(searchTerm.trim().toLocaleLowerCase())
          if (filterType === CHAT_CONVERSATION_FILTER.ALL) return matchesSearch
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

  /**
   * Toggle pinned status for the specified conversation.
   *
   * @param conversation - Target conversation to toggle pin state.
   */
  const togglePin = useCallback(
    (conversation: ConversationSummaryDto) => {
      updateSettingsMutation.mutate({
        conversationId: conversation.id,
        settings: { isPinned: !conversation.isPinned },
      })
    },
    [updateSettingsMutation],
  )

  /**
   * Toggle notification mute status for the specified conversation.
   *
   * @param conversation - Target conversation to toggle mute state.
   */
  const toggleMute = useCallback(
    (conversation: ConversationSummaryDto) => {
      updateSettingsMutation.mutate({
        conversationId: conversation.id,
        settings: { isMuted: !conversation.isMuted },
      })
    },
    [updateSettingsMutation],
  )

  /**
   * Toggle restricted access mode for the specified conversation.
   *
   * @param conversation - Target conversation to toggle restriction state.
   */
  const toggleRestricted = useCallback(
    (conversation: ConversationSummaryDto) => {
      updateSettingsMutation.mutate({
        conversationId: conversation.id,
        settings: { isRestricted: !conversation.isRestricted },
      })
    },
    [updateSettingsMutation],
  )

  /**
   * Prompt confirmation and soft delete (hide) the conversation for the current user.
   *
   * @param conversation - Target conversation to hide/delete from view.
   */
  const deleteConversation = useCallback(
    async (conversation: ConversationSummaryDto) => {
      const confirmed = await confirm({
        title: "Xoá cuộc trò chuyện?",
        description: `Cuộc trò chuyện với "${conversation.title}" sẽ bị ẩn khỏi tài khoản của bạn.`,
        confirmText: "Xoá",
        cancelText: "Hủy",
        variant: "destructive",
      })
      if (confirmed) deleteConversationMutation.mutate(conversation.id)
    },
    [confirm, deleteConversationMutation],
  )

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

/**
 * Builds a readable conversation preview text from its latest message or default state.
 *
 * @param conversation - The conversation summary holding the latest message metadata.
 * @returns Formatted human-readable message preview string.
 */
function getLastMessagePreview(conversation: ConversationSummaryDto): string {
  const lastMessage = conversation.lastMessage
  if (!lastMessage) return "Bắt đầu trò chuyện"
  if (lastMessage.isRecalled) return "Tin nhắn đã được thu hồi"
  if (lastMessage.type === CHAT_MESSAGE_TYPE.IMAGE) return "Đã gửi một hình ảnh"
  if (lastMessage.type === CHAT_MESSAGE_TYPE.FILE) return "Đã gửi một tệp đính kèm"
  return lastMessage.content.replace(/[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g, "$1")
}
