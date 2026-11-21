import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CHAT_BUTTON_SIZE, CHAT_BUTTON_VARIANT, CHAT_CONFIG } from "@/config/entities/chat.config"
import { useConversationMemberManager } from "@/hooks/chat/use-conversation-member-manager"
import type { ConversationSummaryDto } from "@/types/chat.types"

import React from "react"

import { Search, UserPlus } from "lucide-react"

/**
 * Props for the ConversationMemberManager component.
 */
export interface ConversationMemberManagerProps {
  /** Target conversation whose membership is being managed. */
  conversation: ConversationSummaryDto
}

/**
 * Renders current members and controls for adding employees to a group conversation.
 */
export const ConversationMemberManager = React.memo(function ConversationMemberManager({
  conversation,
}: ConversationMemberManagerProps) {
  const {
    memberQuery,
    setMemberQuery,
    isAddingMembers,
    setIsAddingMembers,
    employeeQuery,
    setEmployeeQuery,
    selectedEmployeeIds,
    isSearchingEmployees,
    employeeSearchError,
    isAddingSelectedEmployees,
    filteredParticipants,
    availableEmployees,
    toggleEmployee,
    clearSelectedEmployees,
    addSelectedEmployees,
    isGroupConversation,
  } = useConversationMemberManager(conversation)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-foreground">
          Thành viên ({conversation.participants.length})
        </h4>
        {isGroupConversation && !isAddingMembers && (
          <Button
            type="button"
            variant={CHAT_BUTTON_VARIANT.GHOST}
            size={CHAT_BUTTON_SIZE.XS}
            onClick={() => {
              setIsAddingMembers(true)
            }}
            className="gap-1 px-2 py-1 text-primary hover:bg-primary/10"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm người
          </Button>
        )}
      </div>

      {isAddingMembers && (
        <div className="mb-3 space-y-2 rounded-lg border border-border p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={employeeQuery}
              onChange={(event) => {
                setEmployeeQuery(event.target.value)
              }}
              placeholder="Tìm người để thêm..."
              className="rounded-full border-border bg-muted/50 py-2 pl-9 pr-3 text-xs"
            />
          </div>
          {employeeQuery.trim().length < CHAT_CONFIG.MIN_SEARCH_QUERY_LENGTH ? (
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
            <Button
              type="button"
              variant={CHAT_BUTTON_VARIANT.GHOST}
              size={CHAT_BUTTON_SIZE.SM}
              onClick={() => {
                setIsAddingMembers(false)
                clearSelectedEmployees()
              }}
              className="text-muted-foreground"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size={CHAT_BUTTON_SIZE.SM}
              onClick={addSelectedEmployees}
              disabled={!selectedEmployeeIds.length || isAddingSelectedEmployees}
            >
              {isAddingSelectedEmployees
                ? "Đang thêm..."
                : `Thêm${selectedEmployeeIds.length ? ` (${selectedEmployeeIds.length})` : ""}`}
            </Button>
          </div>
        </div>
      )}

      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={memberQuery}
          onChange={(event) => {
            setMemberQuery(event.target.value)
          }}
          placeholder="Tìm thành viên..."
          className="rounded-full border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs"
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
})
