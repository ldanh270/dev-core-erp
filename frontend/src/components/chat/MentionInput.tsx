import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MENTION_PREFIX } from "@/config/entities/chat.config"
import { useMentionInput } from "@/hooks/chat/use-mention-input"
import type { SendMessageDto } from "@/types/chat.types"

import { Briefcase, CheckSquare, Image as ImageIcon, Paperclip, Send, User, X } from "lucide-react"

interface MentionInputProps {
  onSendMessage: (data: SendMessageDto) => Promise<void>
  onTypingChange: (isTyping: boolean) => void
  disabled?: boolean
}

export function MentionInput({ onSendMessage, onTypingChange, disabled }: MentionInputProps) {
  const {
    text,
    isUploading,
    attachedFile,
    setAttachedFile,
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
    handleFileUpload,
    insertMention,
    triggerMentionPrompt,
  } = useMentionInput({ onSendMessage, onTypingChange, disabled })

  return (
    <div className="relative flex flex-col gap-2 border-t border-border bg-card p-3">
      {activeTrigger && (
        <div className="absolute bottom-full left-4 z-50 mb-2 max-h-64 w-80 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {activeTrigger === MENTION_PREFIX.EMPLOYEE && (
                <User className="h-3.5 w-3.5 text-primary" />
              )}
              {activeTrigger === MENTION_PREFIX.PROJECT && (
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
              )}
              {activeTrigger === MENTION_PREFIX.TASK && (
                <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {activeTrigger === MENTION_PREFIX.EMPLOYEE && "Nhắc đến Nhân viên (@)"}
              {activeTrigger === MENTION_PREFIX.PROJECT && "Gắn thẻ Dự án (#)"}
              {activeTrigger === MENTION_PREFIX.TASK && "Gắn thẻ Công việc (!)"}
            </span>
            {isLoadingMentions && <span className="animate-spin text-xs">...</span>}
          </div>

          <div className="py-1">
            {activeTrigger === MENTION_PREFIX.EMPLOYEE &&
              (employees.length === 0 && !isLoadingMentions ? (
                <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                  Không tìm thấy nhân viên
                </p>
              ) : (
                employees.map((employee, index) => (
                  <Button
                    key={employee.id}
                    type="button"
                    variant={index === mentionIndex ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      insertMention({
                        id: employee.id,
                        label: employee.fullName,
                        prefix: MENTION_PREFIX.EMPLOYEE,
                        type: "emp",
                      })
                    }}
                    className="w-full justify-start gap-2 text-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {employee.fullName.charAt(0)}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate">{employee.fullName}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        @{employee.username}
                      </span>
                    </span>
                  </Button>
                ))
              ))}

            {activeTrigger === MENTION_PREFIX.PROJECT &&
              (projects.length === 0 && !isLoadingMentions ? (
                <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                  Không tìm thấy dự án
                </p>
              ) : (
                projects.map((project, index) => (
                  <Button
                    key={project.id}
                    type="button"
                    variant={index === mentionIndex ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      insertMention({
                        id: project.id,
                        label: project.name,
                        prefix: MENTION_PREFIX.PROJECT,
                        type: "proj",
                      })
                    }}
                    className="w-full justify-start gap-2 text-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                      <Briefcase className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate">{project.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {project.status}
                      </span>
                    </span>
                  </Button>
                ))
              ))}

            {activeTrigger === MENTION_PREFIX.TASK &&
              (tasks.length === 0 && !isLoadingMentions ? (
                <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                  Không tìm thấy công việc
                </p>
              ) : (
                tasks.map((task, index) => (
                  <Button
                    key={task.id}
                    type="button"
                    variant={index === mentionIndex ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      insertMention({
                        id: task.id,
                        label: task.title,
                        prefix: MENTION_PREFIX.TASK,
                        type: "task",
                      })
                    }}
                    className="w-full justify-start gap-2 text-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                      <CheckSquare className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate">{task.title}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {task.projectName ? `${task.projectName} • ` : ""}
                        {task.priority}
                      </span>
                    </span>
                  </Button>
                ))
              ))}
          </div>
        </div>
      )}

      {attachedFile && (
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
            onClick={() => {
              setAttachedFile(null)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="mr-1 text-[11px] font-medium">Gõ hoặc bấm:</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            triggerMentionPrompt(MENTION_PREFIX.EMPLOYEE)
          }}
          className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <User className="h-3 w-3" />@ Người
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            triggerMentionPrompt(MENTION_PREFIX.PROJECT)
          }}
          className="border border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
        >
          <Briefcase className="h-3 w-3" /># Dự án
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            triggerMentionPrompt(MENTION_PREFIX.TASK)
          }}
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
            onChange={(event) => {
              void handleFileUpload(event)
            }}
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
