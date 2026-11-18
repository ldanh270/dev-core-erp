import { chatApi } from "@/lib/chat-api"
import type {
  ChatMessageMention,
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
} from "@/types/chat.types"

import React, { useEffect, useRef, useState } from "react"

import { Briefcase, CheckSquare, Image as ImageIcon, Paperclip, Send, User, X } from "lucide-react"

interface MentionInputProps {
  /** Sends the encoded message text and any uploaded attachment to the active conversation. */
  onSendMessage: (data: {
    content: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    type?: "text" | "image" | "file"
    mentions?: ChatMessageMention[]
  }) => Promise<void>
  onTypingChange: (isTyping: boolean) => void
  disabled?: boolean
}

/** Trigger symbols map to distinct autocomplete endpoints and token entity prefixes. */
type TriggerType = "@" | "#" | "!"

/**
 * Message composer with debounced employee/project/task autocomplete and attachment upload.
 * Selecting a result replaces the current trigger query with a stable token containing its ID;
 * sending is disabled while uploading so attachment metadata cannot be submitted prematurely.
 */
export const MentionInput: React.FC<MentionInputProps> = ({
  onSendMessage,
  onTypingChange,
  disabled,
}) => {
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{
    fileUrl: string
    fileName: string
    fileSize: number
    type: "image" | "file"
  } | null>(null)

  // Mentions autocomplete state
  const [activeTrigger, setActiveTrigger] = useState<TriggerType | null>(null)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [employees, setEmployees] = useState<MentionEmployeeItem[]>([])
  const [projects, setProjects] = useState<MentionProjectItem[]>([])
  const [tasks, setTasks] = useState<MentionTaskItem[]>([])
  const [isLoadingMentions, setIsLoadingMentions] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect trigger symbol when typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    onTypingChange(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      onTypingChange(false)
      typingTimerRef.current = null
    }, 1500)

    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = val.slice(0, cursorPos)

    // Match a trigger at the start of the message or after whitespace, using only text before the cursor.
    const match = /(?:^|\s)([@#!])([^\s]*)$/.exec(textBeforeCursor)
    if (match) {
      setActiveTrigger(match[1] as TriggerType)
      setMentionQuery(match[2])
      setMentionIndex(0)
    } else {
      setActiveTrigger(null)
      setMentionQuery("")
    }
  }

  // Debounce remote lookups and ignore responses from an earlier query or an unmounted component.
  useEffect(() => {
    if (!activeTrigger) return

    let isMounted = true
    setIsLoadingMentions(true)

    const fetchMentions = async () => {
      try {
        if (activeTrigger === "@") {
          const res = await chatApi.searchMentionEmployees(mentionQuery)
          if (isMounted) setEmployees(res)
        } else if (activeTrigger === "#") {
          const res = await chatApi.searchMentionProjects(mentionQuery)
          if (isMounted) setProjects(res)
        } else {
          // TriggerType is limited to @, #, and !; after @ and #, the remaining case is a task.
          const res = await chatApi.searchMentionTasks(mentionQuery)
          if (isMounted) setTasks(res)
        }
      } catch (err) {
        console.error("Failed to query mentions:", err)
      } finally {
        if (isMounted) setIsLoadingMentions(false)
      }
    }

    const timer = setTimeout(() => {
      void fetchMentions()
    }, 150)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [activeTrigger, mentionQuery])

  // Replace only the active trigger/query span; keep both the preceding and following draft text intact.
  const insertMention = (item: {
    id: string
    label: string
    prefix: TriggerType
    type: "emp" | "proj" | "task"
  }) => {
    const cursorPos = textareaRef.current?.selectionStart || text.length
    const textBeforeCursor = text.slice(0, cursorPos)
    const textAfterCursor = text.slice(cursorPos)

    // Stable entity IDs in the token let navigation/rendering work even if display labels later change.
    const newBeforeCursor = textBeforeCursor.replace(
      /(?:^|\s)[@#!][^\s]*$/,
      (m) =>
        (m.startsWith(" ") ? " " : "") + `${item.prefix}[${item.label}](${item.type}:${item.id}) `,
    )

    setText(newBeforeCursor + textAfterCursor)
    setActiveTrigger(null)
    setMentionQuery("")

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = newBeforeCursor.length
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 10)
  }

  // While autocomplete is open, consume navigation/selection keys before the normal send shortcut.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeTrigger) {
      const itemsCount =
        activeTrigger === "@"
          ? employees.length
          : activeTrigger === "#"
            ? projects.length
            : tasks.length

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % Math.max(itemsCount, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + itemsCount) % Math.max(itemsCount, 1))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (itemsCount > 0) {
          e.preventDefault()
          if (activeTrigger === "@") {
            // Resolve the current index from the latest results; it may be stale after a new search response.
            const employee = employees.find((_, index) => index === mentionIndex)
            if (employee) {
              insertMention({ id: employee.id, label: employee.fullName, prefix: "@", type: "emp" })
            }
          } else if (activeTrigger === "#") {
            const project = projects.find((_, index) => index === mentionIndex)
            if (project) {
              insertMention({ id: project.id, label: project.name, prefix: "#", type: "proj" })
            }
          } else {
            const task = tasks.find((_, index) => index === mentionIndex)
            if (task) {
              insertMention({ id: task.id, label: task.title, prefix: "!", type: "task" })
            }
          }
          return
        }
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setActiveTrigger(null)
        return
      }
    }

    // Submit message on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendFromInput()
    }
  }

  /**
   * Snapshot and clear the draft before awaiting the mutation.
   * The caller owns user-facing error feedback for failed sends.
   */
  const handleSend = async () => {
    if ((!text.trim() && !attachedFile) || disabled || isUploading) return

    const trimmedContent = text.trim()
    const file = attachedFile

    setText("")
    setAttachedFile(null)
    setActiveTrigger(null)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = null
    onTypingChange(false)

    await onSendMessage({
      content: trimmedContent,
      fileUrl: file?.fileUrl,
      fileName: file?.fileName,
      fileSize: file?.fileSize,
      type: file?.type,
    })

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  // The mutation hook reports send failures to the user; catch rejected event-handler promises and keep diagnostics.
  const handleSendFromInput = () => {
    void handleSend().catch((error: unknown) => {
      console.error("Failed to send chat message:", error)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const uploaded = await chatApi.uploadAttachment(file)
      setAttachedFile(uploaded)
    } catch (err) {
      console.error("Attachment upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Quick insertion helpers for users who want to click instead of typing symbol
  const triggerMentionPrompt = (prefix: TriggerType) => {
    setText((prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + prefix)
    setActiveTrigger(prefix)
    setMentionQuery("")
    textareaRef.current?.focus()
  }

  return (
    <div className="relative flex flex-col gap-2 p-3 bg-card border-t border-border">
      {/* Mention Autocomplete Dropdown Popup */}
      {activeTrigger && (
        <div className="absolute bottom-full left-4 mb-2 w-80 max-h-64 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-xl shadow-lg z-50 p-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {activeTrigger === "@" && <User className="w-3.5 h-3.5 text-primary" />}
              {activeTrigger === "#" && <Briefcase className="w-3.5 h-3.5 text-blue-500" />}
              {activeTrigger === "!" && <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />}
              <span>
                {activeTrigger === "@" && "Nhắc đến Nhân viên (@)"}
                {activeTrigger === "#" && "Gắn thẻ Dự án (#)"}
                {activeTrigger === "!" && "Gắn thẻ Công việc (!)"}
              </span>
            </span>
            {isLoadingMentions && <span className="animate-spin text-xs">...</span>}
          </div>

          <div className="py-1">
            {activeTrigger === "@" && (
              <>
                {employees.length === 0 && !isLoadingMentions ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                    Không tìm thấy nhân viên
                  </p>
                ) : (
                  employees.map((emp, idx) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        insertMention({ id: emp.id, label: emp.fullName, prefix: "@", type: "emp" })
                      }}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                        idx === mentionIndex
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{emp.fullName}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          @{emp.username}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}

            {activeTrigger === "#" && (
              <>
                {projects.length === 0 && !isLoadingMentions ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                    Không tìm thấy dự án
                  </p>
                ) : (
                  projects.map((proj, idx) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        insertMention({ id: proj.id, label: proj.name, prefix: "#", type: "proj" })
                      }}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                        idx === mentionIndex
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{proj.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {proj.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}

            {activeTrigger === "!" && (
              <>
                {tasks.length === 0 && !isLoadingMentions ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                    Không tìm thấy công việc
                  </p>
                ) : (
                  tasks.map((task, idx) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        insertMention({ id: task.id, label: task.title, prefix: "!", type: "task" })
                      }}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                        idx === mentionIndex
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{task.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {task.projectName ? `${task.projectName} • ` : ""}
                          {task.priority}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Attached file preview chip */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full w-fit max-w-full text-xs border border-border">
          {attachedFile.type === "image" ? (
            <ImageIcon className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Paperclip className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className="truncate max-w-[200px]">{attachedFile.fileName}</span>
          <button
            type="button"
            onClick={() => {
              setAttachedFile(null)
            }}
            className="p-0.5 rounded-full hover:bg-background/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Mentions quick helper pills */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-[11px] font-medium mr-1">Gõ hoặc bấm:</span>
        <button
          type="button"
          onClick={() => {
            triggerMentionPrompt("@")
          }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-medium border border-primary/20 cursor-pointer"
        >
          <User className="w-3 h-3" />
          <span>@ Người</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerMentionPrompt("#")
          }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors text-[11px] font-medium border border-blue-500/20 cursor-pointer"
        >
          <Briefcase className="w-3 h-3" />
          <span># Dự án</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerMentionPrompt("!")
          }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[11px] font-medium border border-emerald-500/20 cursor-pointer"
        >
          <CheckSquare className="w-3 h-3" />
          <span>! Task</span>
        </button>
      </div>

      {/* Textarea + Action buttons */}
      <div className="flex items-end gap-2 bg-muted/40 rounded-xl p-2 border border-border focus-within:border-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Gõ @ người, # dự án, ! task)"
          rows={1}
          disabled={disabled || isUploading}
          className="flex-1 bg-transparent border-0 resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground max-h-32 min-h-[36px] py-1 px-1"
        />

        <div className="flex items-center gap-1 shrink-0 pb-0.5">
          {/* File attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(event) => {
              void handleFileUpload(event)
            }}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click()
            }}
            disabled={disabled || isUploading}
            title="Đính kèm file hoặc hình ảnh"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSendFromInput}
            disabled={(!text.trim() && !attachedFile) || disabled || isUploading}
            title="Gửi tin nhắn (Enter)"
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
