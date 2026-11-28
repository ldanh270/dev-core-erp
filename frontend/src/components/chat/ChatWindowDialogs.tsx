import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHAT_BUTTON_SIZE, CHAT_BUTTON_VARIANT, CHAT_CONFIG } from "@/config/entities/chat.config"
import type { ConversationSummaryDto } from "@/types/chat.types"

import React from "react"

import { Check, X } from "lucide-react"

/**
 * Props for the ChatWindowDialogs component.
 */
export interface ChatWindowDialogsProps {
  /** Available conversations eligible for message forwarding. */
  conversations: ConversationSummaryDto[]
  /** Controls open visibility state of the message forwarding dialog. */
  isForwardDialogOpen: boolean
  /** List of selected conversation IDs for forwarding target. */
  selectedConversationIds: string[]
  /** URL of image currently being viewed in full-screen overlay, or null. */
  previewImage: string | null
  /** Callback fired when forward dialog open state changes. */
  onForwardDialogChange: (isOpen: boolean) => void
  /** Callback fired when a conversation is toggled in the forward selection. */
  onToggleConversation: (conversationId: string, isSelected: boolean) => void
  /** Callback submitting the forward request. */
  onSubmitForward: () => void
  /** Callback closing the full-screen image preview overlay. */
  onClosePreview: () => void
}

/**
 * Renders modal overlays for the chat module including message forwarding and full-screen image preview.
 */
export const ChatWindowDialogs = React.memo(function ChatWindowDialogs({
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
                  onChange={(event) => {
                    onToggleConversation(conversation.id, event.target.checked)
                  }}
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
              variant={CHAT_BUTTON_VARIANT.SECONDARY}
              size={CHAT_BUTTON_SIZE.ICON_SM}
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
})
