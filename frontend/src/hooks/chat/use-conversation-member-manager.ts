import { CONVERSATION_TYPE } from "@/config/entities/chat.config"
import { useAddChatParticipants } from "@/hooks/chat/use-add-chat-participants"
import { chatApi } from "@/lib/chat-api"
import type { ConversationSummaryDto, MentionEmployeeItem } from "@/types/chat.types"

import { useEffect, useMemo, useState } from "react"

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
    if (!isAddingMembers || query.length < 2) {
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
        .searchMentionEmployees(query, 20)
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
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [employeeQuery, isAddingMembers])

  const availableEmployees = employeeResults.filter(
    (employee) => !existingEmployeeIds.has(employee.id),
  )

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    )
  }

  const clearSelectedEmployees = () => {
    setSelectedEmployeeIds([])
  }

  const addSelectedEmployees = () => {
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
  }

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
