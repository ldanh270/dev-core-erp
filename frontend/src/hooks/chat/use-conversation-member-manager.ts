import { CHAT_CONFIG, CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useAddChatParticipants } from "@/hooks/chat/use-add-chat-participants"
import { chatApi } from "@/lib/chat-api"
import type { ConversationSummaryDto, MentionEmployeeItem } from "@/types/chat.types"

import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Manages participant filtering, asynchronous employee searching, and membership addition.
 *
 * @param conversation Target conversation whose participants are being managed
 * @returns State and event handlers for participant administration
 */
export function useConversationMemberManager(conversation: ConversationSummaryDto) {
  const [memberQuery, setMemberQuery] = useState("")
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const [employeeQuery, setEmployeeQuery] = useState("")
  const [employeeResults, setEmployeeResults] = useState<MentionEmployeeItem[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false)
  const [employeeSearchError, setEmployeeSearchError] = useState(false)
  const addParticipantsMutation = useAddChatParticipants()

  const existingEmployeeIds = useMemo(
    () => new Set(conversation.participants.map((participant) => participant.employeeId)),
    [conversation.participants],
  )

  const filteredParticipants = useMemo(() => {
    const query = memberQuery.trim().toLocaleLowerCase()
    if (!query) return conversation.participants
    return conversation.participants.filter(
      (participant) =>
        participant.fullName.toLocaleLowerCase().includes(query) ||
        participant.username.toLocaleLowerCase().includes(query),
    )
  }, [conversation.participants, memberQuery])

  useEffect(() => {
    const query = employeeQuery.trim()
    if (!isAddingMembers || query.length < CHAT_CONFIG.MIN_SEARCH_QUERY_LENGTH) {
      setEmployeeResults([])
      setIsSearchingEmployees(false)
      setEmployeeSearchError(false)
      return
    }

    let active = true
    const timer = setTimeout(() => {
      setIsSearchingEmployees(true)
      setEmployeeSearchError(false)
      chatApi
        .searchMentionEmployees(query, CHAT_CONFIG.GROUP_MEMBER_SEARCH_LIMIT)
        .then((employees) => {
          if (active) setEmployeeResults(employees)
        })
        .catch((error: unknown) => {
          console.error("Failed to search employees for group chat:", error)
          if (active) {
            setEmployeeResults([])
            setEmployeeSearchError(true)
          }
        })
        .finally(() => {
          if (active) setIsSearchingEmployees(false)
        })
    }, CHAT_CONFIG.GROUP_MEMBER_SEARCH_DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [employeeQuery, isAddingMembers])

  const availableEmployees = useMemo(
    () => employeeResults.filter((employee) => !existingEmployeeIds.has(employee.id)),
    [employeeResults, existingEmployeeIds],
  )

  /**
   * Toggles selection state for an employee candidate to add.
   */
  const toggleEmployee = useCallback((employeeId: string) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    )
  }, [])

  /**
   * Clears the current list of selected employee candidates.
   */
  const clearSelectedEmployees = useCallback(() => {
    setSelectedEmployeeIds([])
  }, [])

  /**
   * Triggers the mutation to add selected employees to the active conversation.
   */
  const addSelectedEmployees = useCallback(() => {
    if (!selectedEmployeeIds.length) return

    addParticipantsMutation.mutate(
      {
        conversationId: conversation.id,
        participantIds: selectedEmployeeIds,
      },
      {
        onSuccess: () => {
          setSelectedEmployeeIds([])
          setEmployeeQuery("")
          setIsAddingMembers(false)
        },
      },
    )
  }, [addParticipantsMutation, conversation.id, selectedEmployeeIds])

  return {
    memberQuery,
    setMemberQuery,
    isAddingMembers,
    setIsAddingMembers,
    employeeQuery,
    setEmployeeQuery,
    selectedEmployeeIds,
    isSearchingEmployees,
    employeeSearchError,
    isAddingSelectedEmployees: addParticipantsMutation.isPending,
    filteredParticipants,
    availableEmployees,
    toggleEmployee,
    clearSelectedEmployees,
    addSelectedEmployees,
    isGroupConversation: conversation.type === CONVERSATION_TYPE.GROUP,
  }
}
