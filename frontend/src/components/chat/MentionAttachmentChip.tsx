import { Button } from "@/components/ui/button"
import type { AttachedFile } from "@/hooks/chat/use-mention-input"

import { Image as ImageIcon, Paperclip, X } from "lucide-react"

interface MentionAttachmentChipProps {
  attachedFile: AttachedFile
  onRemove: () => void
}

/** Renders a selected attachment preview and delegates removal to its parent. */
export function MentionAttachmentChip({ attachedFile, onRemove }: MentionAttachmentChipProps) {
  return (
    <div className="flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs">
      {attachedFile.type === "image" ? (
        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
      ) : (
        <Paperclip className="h-4 w-4 shrink-0 text-primary" />
      )}
      <span className="max-w-[200px] truncate">{attachedFile.fileName}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Xóa tệp đính kèm"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
