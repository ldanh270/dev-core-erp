import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMentionInput } from "@/hooks/chat/use-mention-input"
import type { SendMessageDto } from "@/types/chat.types"

import { Briefcase, CheckSquare, Paperclip, Send, User } from "lucide-react"

import { MentionAttachmentChip } from "./MentionAttachmentChip"
import { MentionAutocompleteList } from "./MentionAutocompleteList"

interface MentionInputProps {
  onSendMessage: (data: SendMessageDto) => Promise<void>
  onTypingChange: (isTyping: boolean) => void
  disabled?: boolean
}

/** Coordinates the composer hook with popup, attachment, and action subcomponents. */
export function MentionInput({ onSendMessage, onTypingChange, disabled }: MentionInputProps) {
  const {
    text,
    isUploading,
    attachedFile,
    activeTrigger,
    mentionIndex,
    employees,
    projects,
    tasks,
    isLoadingMentions,
    textareaRef,
    fileInputRef,
    handleTextChange,
    handleKeyDown,
    handleSendFromInput,
    handleFileInputChange,
    handleRemoveAttachment,
    handleSelectEmployee,
    handleSelectProject,
    handleSelectTask,
    handleTriggerEmployeeMention,
    handleTriggerProjectMention,
    handleTriggerTaskMention,
  } = useMentionInput({ onSendMessage, onTypingChange, disabled })

  return (
    <div className="relative flex flex-col gap-2 border-t border-border bg-card p-3">
      {activeTrigger && (
        <MentionAutocompleteList
          activeTrigger={activeTrigger}
          mentionIndex={mentionIndex}
          employees={employees}
          projects={projects}
          tasks={tasks}
          isLoading={isLoadingMentions}
          onSelectEmployee={handleSelectEmployee}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
        />
      )}

      {attachedFile && (
        <MentionAttachmentChip attachedFile={attachedFile} onRemove={handleRemoveAttachment} />
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="mr-1 text-[11px] font-medium">Gõ hoặc bấm:</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleTriggerEmployeeMention}
          className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <User className="h-3 w-3" />@ Người
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleTriggerProjectMention}
          className="border border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
        >
          <Briefcase className="h-3 w-3" /># Dự án
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleTriggerTaskMention}
          className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
        >
          <CheckSquare className="h-3 w-3" />! Task
        </Button>
      </div>

      <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 p-2 focus-within:border-primary/50">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Gõ @ người, # dự án, ! task)"
          rows={1}
          disabled={disabled || isUploading}
          className="min-h-9 max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm"
        />

        <div className="flex shrink-0 items-center gap-1 pb-0.5">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              fileInputRef.current?.click()
            }}
            disabled={disabled || isUploading}
            title="Đính kèm file hoặc hình ảnh"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            onClick={handleSendFromInput}
            disabled={(!text.trim() && !attachedFile) || Boolean(disabled) || isUploading}
            title="Gửi tin nhắn (Enter)"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
