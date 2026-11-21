import { Button } from "@/components/ui/button"
import {
  CHAT_BUTTON_SIZE,
  CHAT_BUTTON_VARIANT,
  CHAT_MESSAGE_TYPE,
} from "@/config/entities/chat.config"
import type { AttachedFile } from "@/hooks/chat/use-mention-input"

import React from "react"

import { Image as ImageIcon, Paperclip, X } from "lucide-react"

/**
 * Props for the MentionAttachmentChip component.
 */
export interface MentionAttachmentChipProps {
  /** Uploaded file information including data URL, MIME type, and filename. */
  attachedFile: AttachedFile
  /** Callback fired when the user removes the attached file chip. */
  onRemove: () => void
}

/**
 * Renders a selected attachment preview chip and delegates removal to its parent.
 */
export const MentionAttachmentChip = React.memo(function MentionAttachmentChip({
  attachedFile,
  onRemove,
}: MentionAttachmentChipProps) {
  return (
    <div className="flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs">
      {attachedFile.type === CHAT_MESSAGE_TYPE.IMAGE ? (
        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
      ) : (
        <Paperclip className="h-4 w-4 shrink-0 text-primary" />
      )}
      <span className="max-w-[200px] truncate">{attachedFile.fileName}</span>
      <Button
        type="button"
        variant={CHAT_BUTTON_VARIANT.GHOST}
        size={CHAT_BUTTON_SIZE.ICON_XS}
        aria-label="Xóa tệp đính kèm"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
})
