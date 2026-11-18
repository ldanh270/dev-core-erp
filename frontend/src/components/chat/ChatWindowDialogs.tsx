import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHAT_CONFIG } from "@/config/entities/chat.config"
import type { ConversationSummaryDto } from "@/types/chat.types"

import { Check, X } from "lucide-react"

interface ChatWindowDialogsProps {
  conversations: ConversationSummaryDto[]
  isForwardDialogOpen: boolean
  selectedConversationIds: string[]
  previewImage: string | null
  onForwardDialogChange: (isOpen: boolean) => void
  onToggleConversation: (conversationId: string, isSelected: boolean) => void
  onSubmitForward: () => void
  onClosePreview: () => void
}

export function ChatWindowDialogs({
  conversations,
  isForwardDialogOpen,
  selectedConversationIds,
  previewImage,
  onForwardDialogChange,
  onToggleConversation,
  onSubmitForward,
  onClosePreview,
}: ChatWindowDialogsProps) {
  return (
    <>
      <Dialog open={isForwardDialogOpen} onOpenChange={onForwardDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển tiếp tin nhắn</DialogTitle>
            <DialogDescription>
              Chọn một hoặc nhiều cuộc trò chuyện nhận tin nhắn.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <label
                key={conversation.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedConversationIds.includes(conversation.id)}
                  disabled={
                    !selectedConversationIds.includes(conversation.id) &&
                    selectedConversationIds.length >= CHAT_CONFIG.MAX_FORWARD_CONVERSATIONS
                  }
                  onChange={(event) => onToggleConversation(conversation.id, event.target.checked)}
                />
                <span className="truncate text-sm">{conversation.title}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={onSubmitForward}
              disabled={!selectedConversationIds.length}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Chuyển tiếp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClosePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Xem trước ảnh"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label="Đóng ảnh xem trước"
              onClick={onClosePreview}
              className="absolute -top-3 -right-3 shadow-md"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
