import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useConversationList } from "@/hooks/chat/use-conversation-list"
import type { ConversationSummaryDto } from "@/types/chat.types"

import React from "react"

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
  /** Conversation summaries already scoped to the signed-in employee. */
  conversations: ConversationSummaryDto[]
  /** Route-selected conversation, used only for the active-row appearance. */
  activeConversationId?: string
  /** Parent callback owns navigation so the URL remains the source of selection state. */
  onSelectConversation: (id: string) => void
  /** Opens the parent-managed new conversation dialog. */
  onOpenNewChatModal: () => void
  isLoading?: boolean
}

/**
 * Searchable conversation list with direct/group filters and per-member actions.
 * Pin, mute, restriction, and hide operations are delegated to mutations; selection is delegated
 * to the parent so this component does not maintain a second active-conversation state.
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChatModal,
  isLoading,
}) => {
  const {
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
  } = useConversationList(conversations)

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
        <Button
          type="button"
          size="sm"
          onClick={onOpenNewChatModal}
          className="gap-1.5"
          title="Tạo cuộc trò chuyện mới"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo mới</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
            }}
            placeholder="Tìm cuộc trò chuyện..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2.5">
          <Button
            type="button"
            variant={filterType === "all" ? "default" : "ghost"}
            size="xs"
            onClick={() => {
              setFilterType("all")
            }}
            className={filterType === "all" ? "" : "bg-muted text-muted-foreground"}
          >
            Tất cả
          </Button>
          <Button
            type="button"
            variant={filterType === CONVERSATION_TYPE.DIRECT ? "default" : "ghost"}
            size="xs"
            onClick={() => {
              setFilterType(CONVERSATION_TYPE.DIRECT)
            }}
            className={
              filterType === CONVERSATION_TYPE.DIRECT ? "" : "bg-muted text-muted-foreground"
            }
          >
            1-1
          </Button>
          <Button
            type="button"
            variant={filterType === CONVERSATION_TYPE.GROUP ? "default" : "ghost"}
            size="xs"
            onClick={() => {
              setFilterType(CONVERSATION_TYPE.GROUP)
            }}
            className={
              filterType === CONVERSATION_TYPE.GROUP ? "" : "bg-muted text-muted-foreground"
            }
          >
            Nhóm
          </Button>
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
              ? formatDistanceToNow(new Date(c.lastMessage.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })
              : ""

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id)
                }}
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
                          c.unreadCount > 0
                            ? "font-bold text-foreground"
                            : "font-medium text-foreground"
                        }`}
                      >
                        {c.title}
                      </span>
                      {c.isMuted && (
                        <BellOff
                          className="w-3 h-3 text-muted-foreground shrink-0"
                          aria-label="Đã tắt thông báo"
                        />
                      )}
                      {c.isRestricted && (
                        <ShieldAlert
                          className="w-3 h-3 text-amber-500 shrink-0"
                          aria-label="Đang bị hạn chế"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>

                  <p
                    className={`text-xs truncate mt-0.5 ${
                      c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {c.lastMessage
                      ? c.lastMessage.isRecalled
                        ? "Tin nhắn đã được thu hồi"
                        : c.lastMessage.type === "image"
                          ? "Đã gửi một hình ảnh"
                          : c.lastMessage.type === "file"
                            ? "Đã gửi một tệp đính kèm"
                            : c.lastMessage.content.replace(
                                /[@#!]\[(.+?)\]\((?:emp|proj|task):[^)]+\)/g,
                                "$1",
                              )
                      : "Bắt đầu trò chuyện"}
                  </p>
                </div>

                {/* 3-dots Menu Button */}
                <div className="absolute right-2 top-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleMenu(c.id)
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
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="absolute right-0 top-full mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg z-50 p-1 divide-y divide-border/50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="py-0.5">
                        {/* Pin or unpin */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            togglePin(c)
                          }}
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

                        {/* Mute or unmute */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleMute(c)
                          }}
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

                        {/* Restrict or unrestrict */}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleRestricted(c)
                          }}
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

                      {/* Hide this conversation for the current employee */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            deleteConversation(c)
                          }}
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
