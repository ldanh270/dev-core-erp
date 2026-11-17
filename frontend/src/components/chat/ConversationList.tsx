import { CONVERSATION_TYPE, type IConversationType } from "@/config/entities/chat.config"
import { useDeleteConversation, useUpdateChatSettings } from "@/hooks/chat/use-chat"
import type { ConversationSummaryDto } from "@/types/chat.types"

import React, { useEffect, useRef, useState } from "react"

import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Bell,
  BellOff,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"

interface ConversationListProps {
  conversations: ConversationSummaryDto[]
  activeConversationId?: string
  onSelectConversation: (id: string) => void
  onOpenNewChatModal: () => void
  isLoading?: boolean
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChatModal,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | IConversationType>("all")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const updateSettingsMutation = useUpdateChatSettings()
  const deleteConversationMutation = useDeleteConversation()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    if (menuOpenId) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [menuOpenId])

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterType === "all") return matchesSearch
    return matchesSearch && c.type === filterType
  })

  const handleTogglePin = (e: React.MouseEvent, c: ConversationSummaryDto) => {
    e.stopPropagation()
    setMenuOpenId(null)
    updateSettingsMutation.mutate({
      conversationId: c.id,
      settings: { isPinned: !c.isPinned },
    })
  }

  const handleToggleMute = (e: React.MouseEvent, c: ConversationSummaryDto) => {
    e.stopPropagation()
    setMenuOpenId(null)
    updateSettingsMutation.mutate({
      conversationId: c.id,
      settings: { isMuted: !c.isMuted },
    })
  }

  const handleToggleRestrict = (e: React.MouseEvent, c: ConversationSummaryDto) => {
    e.stopPropagation()
    setMenuOpenId(null)
    updateSettingsMutation.mutate({
      conversationId: c.id,
      settings: { isRestricted: !c.isRestricted },
    })
  }

  const handleDeleteConversation = (e: React.MouseEvent, c: ConversationSummaryDto) => {
    e.stopPropagation()
    setMenuOpenId(null)
    if (window.confirm(`Bạn có chắc muốn xoá cuộc trò chuyện với "${c.title}"?`)) {
      deleteConversationMutation.mutate(c.id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-base text-foreground">Tin nhắn</h2>
        </div>
        <button
          type="button"
          onClick={onOpenNewChatModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer transition-colors shadow-sm"
          title="Tạo cuộc trò chuyện mới"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo mới</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm cuộc trò chuyện..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2.5">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              filterType === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterType(CONVERSATION_TYPE.DIRECT)}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              filterType === CONVERSATION_TYPE.DIRECT
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            1-1
          </button>
          <button
            type="button"
            onClick={() => setFilterType(CONVERSATION_TYPE.GROUP)}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              filterType === CONVERSATION_TYPE.GROUP
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Nhóm
          </button>
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Đang tải danh sách...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2 text-muted-foreground">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId
            const isMenuOpen = menuOpenId === c.id
            const timeAgo = c.lastMessage?.createdAt
              ? formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: true, locale: vi })
              : ""

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`group relative w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  isActive ? "bg-accent/70" : "hover:bg-muted/40"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {c.type === CONVERSATION_TYPE.GROUP ? (
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.title}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        c.title.charAt(0).toUpperCase()
                      )}
                    </div>
                  )}

                  {/* Pin badge indicator on avatar */}
                  {c.isPinned && (
                    <span
                      className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-amber-500 text-white shadow-xs"
                      title="Đã ghim"
                    >
                      <Pin className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}

                  {/* Unread badge */}
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-sm">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-sm truncate ${
                          c.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                        }`}
                      >
                        {c.title}
                      </span>
                      {c.isMuted && (
                        <BellOff className="w-3 h-3 text-muted-foreground shrink-0" title="Đã tắt thông báo" />
                      )}
                      {c.isRestricted && (
                        <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" title="Đang bị hạn chế" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>

                  <p
                    className={`text-xs truncate mt-0.5 ${
                      c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {c.lastMessage ? (
                      c.lastMessage.type === "image" ? (
                        "Đã gửi một hình ảnh"
                      ) : c.lastMessage.type === "file" ? (
                        "Đã gửi một tệp đính kèm"
                      ) : (
                        c.lastMessage.content.replace(
                          /[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g,
                          "$1",
                        )
                      )
                    ) : (
                      "Bắt đầu trò chuyện"
                    )}
                  </p>
                </div>

                {/* 3-dots Menu Button */}
                <div className="absolute right-2 top-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId((prev) => (prev === c.id ? null : c.id))
                    }}
                    className={`p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors ${
                      isMenuOpen ? "bg-muted text-foreground" : "opacity-0 group-hover:opacity-100"
                    }`}
                    title="Tuỳ chọn cuộc trò chuyện"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* 3-dots Dropdown Menu Popover */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg z-50 p-1 divide-y divide-border/50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="py-0.5">
                        {/* Ghim / Bỏ ghim */}
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(e, c)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-muted cursor-pointer transition-colors text-foreground"
                        >
                          {c.isPinned ? (
                            <>
                              <PinOff className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Bỏ ghim</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-3.5 h-3.5 text-amber-500" />
                              <span>Ghim lên đầu</span>
                            </>
                          )}
                        </button>

                        {/* Tắt / Bật thông báo */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleMute(e, c)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-muted cursor-pointer transition-colors text-foreground"
                        >
                          {c.isMuted ? (
                            <>
                              <Bell className="w-3.5 h-3.5 text-primary" />
                              <span>Bật thông báo</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Tắt thông báo</span>
                            </>
                          )}
                        </button>

                        {/* Hạn chế / Bỏ hạn chế */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleRestrict(e, c)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-muted cursor-pointer transition-colors text-foreground"
                        >
                          {c.isRestricted ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Bỏ hạn chế</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                              <span>Hạn chế</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Xoá */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, c)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xoá cuộc trò chuyện</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
