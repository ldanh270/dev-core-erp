import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChatMessageDto } from "@/types/chat.types"

import { Forward, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react"

interface ChatMessageActionsProps {
  message: ChatMessageDto
  isMe: boolean
  isEditing: boolean
  onStartEdit: () => void
  onForward: () => void
  onTogglePin: () => void
  onRecall: () => void
}

/** Renders message action menu separately from payload and editing UI. */
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
          variant="ghost"
          size="icon-xs"
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
          <DropdownMenuItem variant="destructive" onSelect={onRecall}>
            <Trash2 />
            Thu hồi
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
