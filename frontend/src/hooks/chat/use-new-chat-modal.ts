import { chatApi } from "@/lib/chat-api"
import type { MentionEmployeeItem } from "@/types/chat.types"

import { useEffect, useState } from "react"

export type NewChatTab = "direct" | "group"

interface UseNewChatModalOptions {
  isOpen: boolean
  onClose: () => void
  onCreateDirect: (partnerId: string) => Promise<void>
  onCreateGroup: (data: { title: string; participantIds: string[] }) => Promise<void>
}

/** Owns modal tab state, employee search, direct selection, and group selection. */
export function useNewChatModal({
  isOpen,
  onClose,
  onCreateDirect,
  onCreateGroup,
}: UseNewChatModalOptions) {
  const [tab, setTab] = useState<NewChatTab>("direct")
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
        .searchMentionEmployees(searchQuery, 15)
        .then((results) => {
          if (isMounted) setEmployees(results)
        })
        .catch((error: unknown) => {
          console.error("Failed to search employees:", error)
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, searchQuery])

  const selectDirect = async (employeeId: string) => {
    // Close only after creation succeeds so a failed mutation leaves the modal usable.
    await onCreateDirect(employeeId)
    onClose()
  }

  const toggleMember = (employee: MentionEmployeeItem) => {
    setSelectedMembers((current) =>
      current.some((member) => member.id === employee.id)
        ? current.filter((member) => member.id !== employee.id)
        : [...current, employee],
    )
  }

  const createGroup = async () => {
    if (!groupTitle.trim() || selectedMembers.length < 2) return
    await onCreateGroup({
      title: groupTitle.trim(),
      participantIds: selectedMembers.map((member) => member.id),
    })
    onClose()
  }

  const selectDirectFromClick = (employeeId: string) => {
    void selectDirect(employeeId).catch((error: unknown) => {
      console.error("Failed to create direct conversation:", error)
    })
  }

  const createGroupFromClick = () => {
    void createGroup().catch((error: unknown) => {
      console.error("Failed to create group conversation:", error)
    })
  }

  const handleEmployeeClick = (employee: MentionEmployeeItem) => {
    if (tab === "direct") {
      selectDirectFromClick(employee.id)
      return
    }
    toggleMember(employee)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

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
    canCreateGroup: Boolean(groupTitle.trim()) && selectedMembers.length >= 2,
  }
}
