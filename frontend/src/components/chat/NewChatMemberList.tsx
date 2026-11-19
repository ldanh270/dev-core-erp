import { Button } from "@/components/ui/button"
import type { MentionEmployeeItem } from "@/types/chat.types"

import { Check } from "lucide-react"

interface NewChatMemberListProps {
  employees: MentionEmployeeItem[]
  selectedMembers: MentionEmployeeItem[]
  isLoading: boolean
  isGroup: boolean
  onEmployeeClick: (employee: MentionEmployeeItem) => void
}

/** Renders employee search results and group selection indicators. */
export function NewChatMemberList({
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
            variant="ghost"
            onClick={() => onEmployeeClick(employee)}
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
}
