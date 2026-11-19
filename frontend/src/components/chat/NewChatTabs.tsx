import { Button } from "@/components/ui/button"
import type { NewChatTab } from "@/hooks/chat/use-new-chat-modal"

import { User, Users } from "lucide-react"

interface NewChatTabsProps {
  tab: NewChatTab
  onTabChange: (tab: NewChatTab) => void
}

/** Renders the direct-chat and group-chat tab controls. */
export function NewChatTabs({ tab, onTabChange }: NewChatTabsProps) {
  return (
    <div className="flex border-b border-border bg-muted/40 p-1">
      <Button
        type="button"
        variant={tab === "direct" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => {
          onTabChange("direct")
        }}
        className="flex-1"
      >
        <User className="h-3.5 w-3.5" />
        Nhắn tin 1-1
      </Button>
      <Button
        type="button"
        variant={tab === "group" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => {
          onTabChange("group")
        }}
        className="flex-1"
      >
        <Users className="h-3.5 w-3.5" />
        Tạo nhóm chat
      </Button>
    </div>
  )
}
