import { Button } from "@/components/ui/button"
import {
  CHAT_BUTTON_SIZE,
  CHAT_BUTTON_VARIANT,
  CONVERSATION_TYPE,
} from "@/config/entities/chat.config"
import type { NewChatTab } from "@/hooks/chat/use-new-chat-modal"

import { User, Users } from "lucide-react"

/**
 * Properties for the new chat modal tab switch controls.
 */
interface NewChatTabsProps {
  /** The currently active tab (direct or group). */
  tab: NewChatTab
  /** Callback fired when a tab is selected by the user. */
  onTabChange: (tab: NewChatTab) => void
}

/**
 * Renders tab selector buttons for switching between direct 1-1 chat creation and group chat creation.
 *
 * @param props - Component properties conforming to {@link NewChatTabsProps}.
 * @returns Rendered tab switcher element.
 */
export function NewChatTabs({ tab, onTabChange }: NewChatTabsProps) {
  return (
    <div className="flex border-b border-border bg-muted/40 p-1">
      <Button
        type="button"
        variant={
          tab === CONVERSATION_TYPE.DIRECT
            ? CHAT_BUTTON_VARIANT.SECONDARY
            : CHAT_BUTTON_VARIANT.GHOST
        }
        size={CHAT_BUTTON_SIZE.SM}
        onClick={() => {
          onTabChange(CONVERSATION_TYPE.DIRECT)
        }}
        className="flex-1"
      >
        <User className="h-3.5 w-3.5" />
        Nhắn tin 1-1
      </Button>
      <Button
        type="button"
        variant={
          tab === CONVERSATION_TYPE.GROUP
            ? CHAT_BUTTON_VARIANT.SECONDARY
            : CHAT_BUTTON_VARIANT.GHOST
        }
        size={CHAT_BUTTON_SIZE.SM}
        onClick={() => {
          onTabChange(CONVERSATION_TYPE.GROUP)
        }}
        className="flex-1"
      >
        <Users className="h-3.5 w-3.5" />
        Tạo nhóm chat
      </Button>
    </div>
  )
}
