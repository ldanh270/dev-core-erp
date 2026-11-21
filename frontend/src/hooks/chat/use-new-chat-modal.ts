import {
  CHAT_CONFIG,
  CONVERSATION_TYPE,
  type IConversationType,
} from "@/config/entities/chat.config"
import { chatApi } from "@/lib/chat-api"
import type { MentionEmployeeItem } from "@/types/chat.types"

import { useCallback, useEffect, useState } from "react"

/** Active tab identifier for the new chat modal (direct 1-1 or group). */
export type NewChatTab = IConversationType

/**
 * Options configuration for {@link useNewChatModal}.
 */
interface UseNewChatModalOptions {
  /** Whether the modal is currently open and visible. */
  isOpen: boolean
  /** Callback to close the modal dialog. */
  onClose: () => void
  /** Callback fired to create a 1-1 direct conversation with a selected partner ID. */
  onCreateDirect: (partnerId: string) => Promise<void>
  /** Callback fired to create a new group conversation with title and participant IDs. */
  onCreateGroup: (data: { title: string; participantIds: string[] }) => Promise<void>
}

/**
 * Hook to manage modal tab selection, debounced employee search,
 * direct chat partner selection, and group creation form state.
 *
 * @param options - Dialog state and creation callbacks conforming to {@link UseNewChatModalOptions}.
 * @returns State and event handlers for the new chat dialog.
 * @example
 * ```tsx
 * const { tab, setTab, searchQuery, setSearchQuery, employees, createGroupFromClick } =
 *   useNewChatModal({ isOpen, onClose, onCreateDirect, onCreateGroup })
 * ```
 */
export function useNewChatModal({
  isOpen,
  onClose,
  onCreateDirect,
  onCreateGroup,
}: UseNewChatModalOptions) {
  const [tab, setTab] = useState<NewChatTab>(CONVERSATION_TYPE.DIRECT)
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState<MentionEmployeeItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [groupTitle, setGroupTitle] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<MentionEmployeeItem[]>([])

  useEffect(() => {
    if (!isOpen) return

    // Ignore debounced search responses after a query or modal state becomes stale.
    let isMounted = true
    setIsLoading(true)
    const timer = setTimeout(() => {
      chatApi
        .searchMentionEmployees(searchQuery, CHAT_CONFIG.NEW_CHAT_EMPLOYEE_SEARCH_LIMIT)
        .then((results) => {
          if (isMounted) setEmployees(results)
        })
        .catch((error: unknown) => {
          console.error("Failed to search employees:", error)
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    }, CHAT_CONFIG.MENTION_SEARCH_DEBOUNCE_MS)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, searchQuery])

  /**
   * Initiates direct conversation creation and closes the dialog on success.
   */
  const selectDirect = useCallback(
    async (employeeId: string) => {
      await onCreateDirect(employeeId)
      onClose()
    },
    [onClose, onCreateDirect],
  )

  /**
   * Toggles inclusion of an employee in the group member draft list.
   */
  const toggleMember = useCallback((employee: MentionEmployeeItem) => {
    setSelectedMembers((current) =>
      current.some((member) => member.id === employee.id)
        ? current.filter((member) => member.id !== employee.id)
        : [...current, employee],
    )
  }, [])

  /**
   * Persists a new group conversation with the draft title and selected participants.
   */
  const createGroup = useCallback(async () => {
    if (!groupTitle.trim() || selectedMembers.length < CHAT_CONFIG.MIN_GROUP_PARTICIPANTS) {
      return
    }
    await onCreateGroup({
      title: groupTitle.trim(),
      participantIds: selectedMembers.map((member) => member.id),
    })
    onClose()
  }, [groupTitle, onClose, onCreateGroup, selectedMembers])

  /**
   * Wrapper for direct partner selection with error logging.
   */
  const selectDirectFromClick = useCallback(
    (employeeId: string) => {
      void selectDirect(employeeId).catch((error: unknown) => {
        console.error("Failed to create direct conversation:", error)
      })
    },
    [selectDirect],
  )

  /**
   * Wrapper for group creation with error logging.
   */
  const createGroupFromClick = useCallback(() => {
    void createGroup().catch((error: unknown) => {
      console.error("Failed to create group conversation:", error)
    })
  }, [createGroup])

  /**
   * Handles click on an employee row depending on the active tab mode.
   */
  const handleEmployeeClick = useCallback(
    (employee: MentionEmployeeItem) => {
      if (tab === CONVERSATION_TYPE.DIRECT) {
        selectDirectFromClick(employee.id)
        return
      }
      toggleMember(employee)
    },
    [selectDirectFromClick, tab, toggleMember],
  )

  /**
   * Handles Radix UI dialog open state changes.
   */
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose()
    },
    [onClose],
  )

  return {
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    employees,
    isLoading,
    groupTitle,
    setGroupTitle,
    selectedMembers,
    toggleMember,
    handleEmployeeClick,
    handleDialogOpenChange,
    createGroupFromClick,
    canCreateGroup:
      Boolean(groupTitle.trim()) && selectedMembers.length >= CHAT_CONFIG.MIN_GROUP_PARTICIPANTS,
  }
}
