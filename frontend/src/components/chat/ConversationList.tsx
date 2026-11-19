import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useConversationList } from "@/hooks/chat/use-conversation-list"
import type { ConversationSummaryDto } from "@/types/chat.types"

import React from "react"

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
    filteredConversations,
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
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.timeAgo}</span>
                  </div>

                  <p
                    className={`text-xs truncate mt-0.5 ${
                      c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {c.lastMessagePreview}
                  </p>
                </div>

                {/* 3-dots Menu Button */}
                <div className="absolute right-2 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100"
                        title="Tuỳ chọn cuộc trò chuyện"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => {
                          togglePin(c)
                        }}
                      >
                        {c.isPinned ? <PinOff /> : <Pin />}
                        {c.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          toggleMute(c)
                        }}
                      >
                        {c.isMuted ? <Bell /> : <BellOff />}
                        {c.isMuted ? "Bật thông báo" : "Tắt thông báo"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          toggleRestricted(c)
                        }}
                      >
                        {c.isRestricted ? <ShieldCheck /> : <ShieldAlert />}
                        {c.isRestricted ? "Bỏ hạn chế" : "Hạn chế"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          deleteConversation(c)
                        }}
                      >
                        <Trash2 />
                        Xoá cuộc trò chuyện
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
