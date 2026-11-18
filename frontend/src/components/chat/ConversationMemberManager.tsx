import { useAddChatParticipants } from "@/hooks/chat/use-add-chat-participants"
import { chatApi } from "@/lib/chat-api"
import type { ConversationSummaryDto, MentionEmployeeItem } from "@/types/chat.types"

import { useEffect, useMemo, useState } from "react"

import { Search, UserPlus } from "lucide-react"

interface ConversationMemberManagerProps {
  conversation: ConversationSummaryDto
}

/**
 * Filters current members and lets group admins add employees to a conversation.
 */
export function ConversationMemberManager({ conversation }: ConversationMemberManagerProps) {
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

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-foreground">
          Thành viên ({conversation.participants.length})
        </h4>
        {conversation.type === "group" && !isAddingMembers && (
          <button
            type="button"
            onClick={() => {
              setIsAddingMembers(true)
            }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm người
          </button>
        )}
      </div>

      {isAddingMembers && (
        <div className="mb-3 space-y-2 rounded-lg border border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={employeeQuery}
              onChange={(event) => {
                setEmployeeQuery(event.target.value)
              }}
              placeholder="Tìm người để thêm..."
              className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>
          {employeeQuery.trim().length < 2 ? (
            <p className="p-2 text-xs text-muted-foreground">
              Nhập ít nhất 2 ký tự để tìm nhân viên.
            </p>
          ) : isSearchingEmployees ? (
            <p className="p-2 text-xs text-muted-foreground">Đang tìm nhân viên...</p>
          ) : employeeSearchError ? (
            <p className="p-2 text-xs text-destructive">
              Không thể tìm nhân viên. Vui lòng thử lại.
            </p>
          ) : availableEmployees.length ? (
            <div className="max-h-36 overflow-y-auto">
              {availableEmployees.map((employee) => {
                const selected = selectedEmployeeIds.includes(employee.id)
                return (
                  <label
                    key={employee.id}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        toggleEmployee(employee.id)
                      }}
                      className="accent-primary"
                    />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {employee.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {employee.fullName}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        @{employee.username}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className="p-2 text-xs text-muted-foreground">Không tìm thấy nhân viên phù hợp.</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingMembers(false)
                setSelectedEmployeeIds([])
              }}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={addSelectedEmployees}
              disabled={!selectedEmployeeIds.length || addParticipantsMutation.isPending}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addParticipantsMutation.isPending
                ? "Đang thêm..."
                : `Thêm${selectedEmployeeIds.length ? ` (${selectedEmployeeIds.length})` : ""}`}
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={memberQuery}
          onChange={(event) => {
            setMemberQuery(event.target.value)
          }}
          placeholder="Tìm thành viên..."
          className="w-full rounded-full border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        {filteredParticipants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-2 rounded-lg p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                participant.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{participant.fullName}</p>
              <p className="truncate text-[10px] text-muted-foreground">@{participant.username}</p>
            </div>
          </div>
        ))}
        {!filteredParticipants.length && (
          <p className="p-2 text-xs text-muted-foreground">Không tìm thấy thành viên phù hợp.</p>
        )}
      </div>
    </div>
  )
}
