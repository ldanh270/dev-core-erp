import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CHAT_BUTTON_SIZE, CHAT_BUTTON_VARIANT, CHAT_CONFIG } from "@/config/entities/chat.config"
import type { MentionEmployeeItem } from "@/types/chat.types"

import React from "react"

import { X } from "lucide-react"

/**
 * Props for the NewChatGroupFields component.
 */
export interface NewChatGroupFieldsProps {
  /** Current text value entered for the group conversation title. */
  groupTitle: string
  /** List of employee members selected for inclusion in the group. */
  selectedMembers: MentionEmployeeItem[]
  /** Callback fired when the group title input text changes. */
  onGroupTitleChange: (title: string) => void
  /** Callback fired to remove an employee from the selected group membership. */
  onRemoveMember: (member: MentionEmployeeItem) => void
}

/**
 * Renders group title input and removable selected-member chips for the create-group tab.
 */
export const NewChatGroupFields = React.memo(function NewChatGroupFields({
  groupTitle,
  selectedMembers,
  onGroupTitleChange,
  onRemoveMember,
}: NewChatGroupFieldsProps) {
  return (
    <div className="space-y-2 border-b border-border p-3">
      <Input
        type="text"
        value={groupTitle}
        maxLength={CHAT_CONFIG.MAX_GROUP_TITLE_LENGTH}
        onChange={(event) => {
          onGroupTitleChange(event.target.value)
        }}
        placeholder="Đặt tên nhóm chat..."
        className="rounded-full border-border bg-muted/60 text-xs"
      />
      {selectedMembers.length > 0 && (
        <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto pt-1">
          {selectedMembers.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {member.fullName}
              <Button
                type="button"
                variant={CHAT_BUTTON_VARIANT.GHOST}
                size={CHAT_BUTTON_SIZE.ICON_XS}
                onClick={() => {
                  onRemoveMember(member)
                }}
                aria-label={`Bỏ ${member.fullName}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
