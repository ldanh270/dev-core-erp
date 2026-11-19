import { chatApi } from "@/lib/chat-api"
import type {
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
  SendMessageDto,
} from "@/types/chat.types"

import { useEffect, useRef, useState } from "react"

export type MentionTrigger = "@" | "#" | "!"

export interface AttachedFile {
  fileUrl: string
  fileName: string
  fileSize: number
  type: "image" | "file"
}

interface UseMentionInputOptions {
  onSendMessage: (data: SendMessageDto) => Promise<void>
  onTypingChange: (isTyping: boolean) => void
  disabled?: boolean
  isUploadingExternal?: boolean
}

/** Owns the chat composer state, mention lookup, attachment upload, and send flow. */
export function useMentionInput({
  onSendMessage,
  onTypingChange,
  disabled,
}: UseMentionInputOptions) {
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const [activeTrigger, setActiveTrigger] = useState<MentionTrigger | null>(null)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [employees, setEmployees] = useState<MentionEmployeeItem[]>([])
  const [projects, setProjects] = useState<MentionProjectItem[]>([])
  const [tasks, setTasks] = useState<MentionTaskItem[]>([])
  const [isLoadingMentions, setIsLoadingMentions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!activeTrigger) return

    // Ignore stale results after the trigger/query changes or the composer unmounts.
    let isMounted = true
    setIsLoadingMentions(true)

    const fetchMentions = async () => {
      try {
        if (activeTrigger === "@") {
          const results = await chatApi.searchMentionEmployees(mentionQuery)
          if (isMounted) setEmployees(results)
        } else if (activeTrigger === "#") {
          const results = await chatApi.searchMentionProjects(mentionQuery)
          if (isMounted) setProjects(results)
        } else {
          const results = await chatApi.searchMentionTasks(mentionQuery)
          if (isMounted) setTasks(results)
        }
      } catch (error) {
        console.error("Failed to query mentions:", error)
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

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setText(value)
    onTypingChange(true)

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      onTypingChange(false)
      typingTimerRef.current = null
    }, 1500)

    const cursorPosition = event.target.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPosition)
    // Autocomplete is active only when a trigger is at the start or after whitespace.
    const match = /(?:^|\s)([@#!])([^\s]*)$/.exec(textBeforeCursor)

    if (match) {
      setActiveTrigger(match[1] as MentionTrigger)
      setMentionQuery(match[2])
      setMentionIndex(0)
    } else {
      setActiveTrigger(null)
      setMentionQuery("")
    }
  }

  const insertMention = (item: {
    id: string
    label: string
    prefix: MentionTrigger
    type: "emp" | "proj" | "task"
  }) => {
    const cursorPosition = textareaRef.current?.selectionStart || text.length
    const textBeforeCursor = text.slice(0, cursorPosition)
    const textAfterCursor = text.slice(cursorPosition)
    // Preserve text after the cursor and replace only the active trigger/query span.
    const newBeforeCursor = textBeforeCursor.replace(
      /(?:^|\s)[@#!][^\s]*$/,
      (match) =>
        (match.startsWith(" ") ? " " : "") +
        `${item.prefix}[${item.label}](${item.type}:${item.id}) `,
    )

    setText(newBeforeCursor + textAfterCursor)
    setActiveTrigger(null)
    setMentionQuery("")

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newBeforeCursor.length, newBeforeCursor.length)
      }
    }, 10)
  }

  const send = async () => {
    if ((!text.trim() && !attachedFile) || disabled || isUploading) return

    // Clear only after validating the draft, so retries remain safe for failed sends.
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

    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  const handleSendFromInput = () => {
    void send().catch((error: unknown) => {
      console.error("Failed to send chat message:", error)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (activeTrigger) {
      const items = activeTrigger === "@" ? employees : activeTrigger === "#" ? projects : tasks
      const itemCount = items.length

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setMentionIndex((current) => (current + 1) % Math.max(itemCount, 1))
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setMentionIndex((current) => (current - 1 + itemCount) % Math.max(itemCount, 1))
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        if (itemCount > 0) {
          event.preventDefault()
          if (activeTrigger === "@") {
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
      if (event.key === "Escape") {
        event.preventDefault()
        setActiveTrigger(null)
        return
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendFromInput()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setAttachedFile(await chatApi.uploadAttachment(file))
    } catch (error) {
      console.error("Attachment upload failed:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const triggerMentionPrompt = (prefix: MentionTrigger) => {
    setText((current) => current + (current.endsWith(" ") || current === "" ? "" : " ") + prefix)
    setActiveTrigger(prefix)
    setMentionQuery("")
    textareaRef.current?.focus()
  }

  return {
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
  }
}
