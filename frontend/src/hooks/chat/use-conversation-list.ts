import { CONVERSATION_TYPE, type IConversationType } from "@/config/entities/chat.config"
import { useDeleteConversation, useUpdateChatSettings } from "@/hooks/chat/use-chat"
import type { ConversationSummaryDto } from "@/types/chat.types"

import { useEffect, useRef, useState } from "react"

/** Owns conversation filtering, menu state, and per-member conversation actions. */
export function useConversationList(conversations: ConversationSummaryDto[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | IConversationType>("all")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const updateSettingsMutation = useUpdateChatSettings()
  const deleteConversationMutation = useDeleteConversation()

  useEffect(() => {
    // The menu is a popover, so a document-level outside click closes only the active menu.
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null)
      }
    }
    if (menuOpenId) document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [menuOpenId])

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.title
      .toLocaleLowerCase()
      .includes(searchTerm.trim().toLocaleLowerCase())
    if (filterType === "all") return matchesSearch
    return matchesSearch && conversation.type === filterType
  })

  const closeMenu = () => {
    setMenuOpenId(null)
  }

  const toggleMenu = (conversationId: string) => {
    setMenuOpenId((current) => (current === conversationId ? null : conversationId))
  }

  const togglePin = (conversation: ConversationSummaryDto) => {
    closeMenu()
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isPinned: !conversation.isPinned },
    })
  }

  const toggleMute = (conversation: ConversationSummaryDto) => {
    closeMenu()
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isMuted: !conversation.isMuted },
    })
  }

  const toggleRestricted = (conversation: ConversationSummaryDto) => {
    closeMenu()
    updateSettingsMutation.mutate({
      conversationId: conversation.id,
      settings: { isRestricted: !conversation.isRestricted },
    })
  }

  const deleteConversation = (conversation: ConversationSummaryDto) => {
    closeMenu()
    if (window.confirm(`Bạn có chắc muốn xoá cuộc trò chuyện với "${conversation.title}"?`)) {
      deleteConversationMutation.mutate(conversation.id)
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    menuOpenId,
    menuRef,
    filteredConversations,
    toggleMenu,
    togglePin,
    toggleMute,
    toggleRestricted,
    deleteConversation,
    isDirectFilter: filterType === CONVERSATION_TYPE.DIRECT,
  }
}
