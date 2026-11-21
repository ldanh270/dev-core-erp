import { Button } from "@/components/ui/button"
import { CHAT_BUTTON_VARIANT } from "@/config/entities/chat.config"
import type { MentionEmployeeItem } from "@/types/chat.types"

import React from "react"
import { Check } from "lucide-react"

/**
 * Props for the NewChatMemberList component.
 */
export interface NewChatMemberListProps {
  /** Filtered or searched employee candidates eligible for chat. */
  employees: MentionEmployeeItem[]
  /** Members currently selected in group creation mode. */
  selectedMembers: MentionEmployeeItem[]
  /** Whether employee search is currently fetching results. */
  isLoading: boolean
  /** Whether the modal is currently in group conversation mode. */
  isGroup: boolean
  /** Callback fired when an employee candidate row is clicked. */
  onEmployeeClick: (employee: MentionEmployeeItem) => void
}

/**
 * Renders employee search results and group selection check indicators.
 */
export const NewChatMemberList = React.memo(function NewChatMemberList({
  employees,
  selectedMembers,
  isLoading,
  isGroup,
  onEmployeeClick,
}: NewChatMemberListProps) {
  if (isLoading) {
    return <div className="p-4 text-center text-xs text-muted-foreground">Đang tìm...</div>
  }
  if (employees.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        Không tìm thấy nhân viên phù hợp
      </div>
    )
  }

  return (
    <>
      {employees.map((employee) => {
        const isSelected = selectedMembers.some((member) => member.id === employee.id)
        return (
          <Button
            key={employee.id}
            type="button"
            variant={CHAT_BUTTON_VARIANT.GHOST}
            onClick={() => {
              onEmployeeClick(employee)
            }}
            className="h-auto w-full justify-between rounded-lg px-3 py-2.5 text-left"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {employee.fullName.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-medium text-foreground">
                  {employee.fullName}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  @{employee.username} {employee.position ? `• ${employee.position}` : ""}
                </span>
              </span>
            </span>
            {isGroup && (
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
            )}
          </Button>
        )
      })}
    </>
  )
})
