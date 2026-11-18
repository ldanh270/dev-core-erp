import type { ConversationSummaryDto } from "@/types/chat.types"

import { Users, X } from "lucide-react"

import { ConversationMemberManager } from "./ConversationMemberManager"
import { ConversationMessageSearch } from "./ConversationMessageSearch"

interface ConversationDetailsPanelProps {
  /** Conversation whose metadata and membership are displayed. */
  conversation: ConversationSummaryDto
  /** Closes the panel without changing the selected conversation. */
  onClose: () => void
}

/**
 * Displays conversation metadata, message search, and participant management.
 */
export function ConversationDetailsPanel({ conversation, onClose }: ConversationDetailsPanelProps) {
  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-sm text-foreground">Thông tin cuộc trò chuyện</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông tin cuộc trò chuyện"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{conversation.title}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.participants.length} thành viên
          </p>
        </div>
      </div>

      <ConversationMessageSearch conversationId={conversation.id} />
      <ConversationMemberManager conversation={conversation} />
    </aside>
  )
}
