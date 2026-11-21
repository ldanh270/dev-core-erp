import {
  CHAT_CONFIG,
  type IChatMessageType,
  type IMentionTokenEntity,
  MENTION_PREFIX,
  MENTION_TOKEN_ENTITY,
} from "@/config/entities/chat.config"
import { chatApi } from "@/lib/chat-api"
import type {
  MentionEmployeeItem,
  MentionProjectItem,
  MentionTaskItem,
  SendMessageDto,
} from "@/types/chat.types"

import React, { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

/**
 * Trigger character representing a mention category: '@' (employee), '#' (project), or '!' (task).
 */
export type MentionTrigger = (typeof MENTION_PREFIX)[keyof typeof MENTION_PREFIX]

/**
 * File attachment upload payload.
 */
export interface AttachedFile {
  /** Remote URL where the attachment was uploaded. */
  fileUrl: string
  /** Original file name. */
  fileName: string
  /** Size in bytes. */
  fileSize: number
  /** Media type: image or document file. */
  type: IChatMessageType
}

/**
 * Configuration options for the useMentionInput hook.
 */
export interface UseMentionInputOptions {
  /** Callback submitting a validated message payload. */
  onSendMessage: (data: SendMessageDto) => Promise<void>
  /** Callback notifying typing activity. */
  onTypingChange: (isTyping: boolean) => void
  /** Whether the composer inputs and buttons are disabled. */
  disabled?: boolean
  /** Optional flag indicating an external upload is in progress. */
  isUploadingExternal?: boolean
}

/**
 * Owns the chat composer state, mention lookup, attachment upload, and send flow.
 * Memoizes event handlers with useCallback to prevent re-renders in consumer components.
 *
 * @param options Hook options including onSendMessage and onTypingChange callbacks
 * @returns State and event handlers for the chat input interface
 */
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
        if (activeTrigger === MENTION_PREFIX.EMPLOYEE) {
          const results = await chatApi.searchMentionEmployees(mentionQuery)
          if (isMounted) {
            setEmployees(results)
            setMentionIndex(0)
          }
        } else if (activeTrigger === MENTION_PREFIX.PROJECT) {
          const results = await chatApi.searchMentionProjects(mentionQuery)
          if (isMounted) {
            setProjects(results)
            setMentionIndex(0)
          }
        } else {
          const results = await chatApi.searchMentionTasks(mentionQuery)
          if (isMounted) {
            setTasks(results)
            setMentionIndex(0)
          }
        }
      } catch (error) {
        console.error("Failed to query mentions:", error)
      } finally {
        if (isMounted) setIsLoadingMentions(false)
      }
    }

    const timer = setTimeout(() => {
      void fetchMentions()
    }, CHAT_CONFIG.MENTION_SEARCH_DEBOUNCE_MS)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [activeTrigger, mentionQuery])

  /**
   * Handles text input changes, detects mention trigger characters, and debounces typing indicator.
   */
  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value
      setText(value)
      onTypingChange(true)

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        onTypingChange(false)
        typingTimerRef.current = null
      }, CHAT_CONFIG.TYPING_DEBOUNCE_MS)

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
    },
    [onTypingChange],
  )

  /**
   * Inserts structured mention tokens into the textarea at the active trigger position.
   */
  const insertMention = useCallback(
    (item: { id: string; label: string; prefix: MentionTrigger; type: IMentionTokenEntity }) => {
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
      }, CHAT_CONFIG.MENTION_FOCUS_DELAY_MS)
    },
    [text],
  )

  /**
   * Selects an employee from mention suggestions.
   */
  const handleSelectEmployee = useCallback(
    (employee: MentionEmployeeItem) => {
      insertMention({
        id: employee.id,
        label: employee.fullName,
        prefix: MENTION_PREFIX.EMPLOYEE,
        type: MENTION_TOKEN_ENTITY.EMPLOYEE,
      })
    },
    [insertMention],
  )

  /**
   * Selects a project from mention suggestions.
   */
  const handleSelectProject = useCallback(
    (project: MentionProjectItem) => {
      insertMention({
        id: project.id,
        label: project.name,
        prefix: MENTION_PREFIX.PROJECT,
        type: MENTION_TOKEN_ENTITY.PROJECT,
      })
    },
    [insertMention],
  )

  /**
   * Selects a task from mention suggestions.
   */
  const handleSelectTask = useCallback(
    (task: MentionTaskItem) => {
      insertMention({
        id: task.id,
        label: task.title,
        prefix: MENTION_PREFIX.TASK,
        type: MENTION_TOKEN_ENTITY.TASK,
      })
    },
    [insertMention],
  )

  /**
   * Removes the currently attached file chip.
   */
  const handleRemoveAttachment = useCallback(() => {
    setAttachedFile(null)
  }, [])

  /**
   * Dispatches message send to the parent handler.
   */
  const send = useCallback(async () => {
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
  }, [attachedFile, disabled, isUploading, onSendMessage, onTypingChange, text])

  /**
   * Handles send submission from click or Enter key.
   */
  const handleSendFromInput = useCallback(() => {
    void send().catch((error: unknown) => {
      console.error("Failed to send chat message:", error)
      toast.error("Không thể gửi tin nhắn")
    })
  }, [send])

  /**
   * Returns current active mention collection for navigation.
   */
  const getMentionItems = useCallback(() => {
    if (activeTrigger === MENTION_PREFIX.EMPLOYEE) return employees
    if (activeTrigger === MENTION_PREFIX.PROJECT) return projects
    return tasks
  }, [activeTrigger, employees, projects, tasks])

  /**
   * Handles keyboard navigation (ArrowUp, ArrowDown, Enter, Tab, Escape) for mention autocomplete.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (activeTrigger) {
        const items = getMentionItems()
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
            if (activeTrigger === MENTION_PREFIX.EMPLOYEE) {
              const employee = employees.find((_, index) => index === mentionIndex)
              if (employee) {
                insertMention({
                  id: employee.id,
                  label: employee.fullName,
                  prefix: MENTION_PREFIX.EMPLOYEE,
                  type: MENTION_TOKEN_ENTITY.EMPLOYEE,
                })
              }
            } else if (activeTrigger === MENTION_PREFIX.PROJECT) {
              const project = projects.find((_, index) => index === mentionIndex)
              if (project) {
                insertMention({
                  id: project.id,
                  label: project.name,
                  prefix: MENTION_PREFIX.PROJECT,
                  type: MENTION_TOKEN_ENTITY.PROJECT,
                })
              }
            } else {
              const task = tasks.find((_, index) => index === mentionIndex)
              if (task) {
                insertMention({
                  id: task.id,
                  label: task.title,
                  prefix: MENTION_PREFIX.TASK,
                  type: MENTION_TOKEN_ENTITY.TASK,
                })
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
    },
    [
      activeTrigger,
      employees,
      getMentionItems,
      handleSendFromInput,
      insertMention,
      mentionIndex,
      projects,
      tasks,
    ],
  )

  /**
   * Uploads selected attachment file to Cloudinary / server.
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > CHAT_CONFIG.MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error("Tệp đính kèm vượt quá giới hạn cho phép")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    try {
      setIsUploading(true)
      setAttachedFile(await chatApi.uploadAttachment(file))
    } catch (error) {
      console.error("Attachment upload failed:", error)
      toast.error("Không thể tải tệp đính kèm")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [])

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFileUpload(event)
    },
    [handleFileUpload],
  )

  /**
   * Appends trigger character and focuses textarea for rapid tagging.
   */
  const triggerMentionPrompt = useCallback((prefix: MentionTrigger) => {
    setText((current) => current + (current.endsWith(" ") || current === "" ? "" : " ") + prefix)
    setActiveTrigger(prefix)
    setMentionQuery("")
    textareaRef.current?.focus()
  }, [])

  const handleTriggerEmployeeMention = useCallback(() => {
    triggerMentionPrompt(MENTION_PREFIX.EMPLOYEE)
  }, [triggerMentionPrompt])

  const handleTriggerProjectMention = useCallback(() => {
    triggerMentionPrompt(MENTION_PREFIX.PROJECT)
  }, [triggerMentionPrompt])

  const handleTriggerTaskMention = useCallback(() => {
    triggerMentionPrompt(MENTION_PREFIX.TASK)
  }, [triggerMentionPrompt])

  return {
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
  }
}
