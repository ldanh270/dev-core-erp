import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CHAT_BUTTON_SIZE, CHAT_BUTTON_VARIANT } from "@/config/entities/chat.config"
import type { ChatMessageDto } from "@/types/chat.types"

import { Forward, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react"

/**
 * Properties for rendering message-specific action dropdown menu.
 */
interface ChatMessageActionsProps {
  /** The message entity associated with these actions. */
  message: ChatMessageDto
  /** Whether the message was authored by the authenticated employee. */
  isMe: boolean
  /** Whether this message is currently being edited in inline mode. */
  isEditing: boolean
  /** Callback to trigger inline editing mode for the message. */
  onStartEdit: () => void
  /** Callback to open the message forwarding destination picker. */
  onForward: () => void
  /** Callback to toggle the pinned state of the message. */
  onTogglePin: () => void
  /** Callback to recall / unsend the message for all participants. */
  onRecall: () => void
}

/**
 * Renders an action menu dropdown for a message row, providing options for editing,
 * forwarding, pinning, and recalling messages based on ownership permissions.
 *
 * @param props - Properties conforming to {@link ChatMessageActionsProps}.
 * @returns Rendered dropdown menu trigger and contents, or null if recalled/editing.
 */
export function ChatMessageActions({
  message,
  isMe,
  isEditing,
  onStartEdit,
  onForward,
  onTogglePin,
  onRecall,
}: ChatMessageActionsProps) {
  if (message.isRecalled || isEditing) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={CHAT_BUTTON_VARIANT.GHOST}
          size={CHAT_BUTTON_SIZE.ICON_XS}
          aria-label="Thao tác tin nhắn"
          className="mt-1 text-muted-foreground opacity-100 transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isMe ? "end" : "start"} className="w-44">
        {isMe && (
          <DropdownMenuItem onSelect={onStartEdit}>
            <Pencil />
            Chỉnh sửa
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onForward}>
          <Forward />
          Chuyển tiếp
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onTogglePin}>
          {message.isPinned ? <PinOff /> : <Pin />}
          {message.isPinned ? "Bỏ ghim" : "Ghim"}
        </DropdownMenuItem>
        {isMe && (
          <DropdownMenuItem variant={CHAT_BUTTON_VARIANT.DESTRUCTIVE} onSelect={onRecall}>
            <Trash2 />
            Thu hồi
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
