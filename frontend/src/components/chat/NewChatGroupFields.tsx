import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MentionEmployeeItem } from "@/types/chat.types"

import { X } from "lucide-react"

interface NewChatGroupFieldsProps {
  groupTitle: string
  selectedMembers: MentionEmployeeItem[]
  onGroupTitleChange: (title: string) => void
  onRemoveMember: (member: MentionEmployeeItem) => void
}

/** Renders group title and selected-member chips for the create-group tab. */
export function NewChatGroupFields({
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
                variant="ghost"
                size="icon-xs"
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
}
