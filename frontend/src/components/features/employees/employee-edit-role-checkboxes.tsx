import { getRoleLabel } from "@/config/entities/employee.config"
import type { Role } from "@/types/security.types"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

export interface EmployeeEditRoleCheckboxesProps {
  allRoles: Role[] | undefined
  initialRoleIds: string[]
  isLoadingRoles: boolean
  onSelectionChange: (roleIds: string[]) => void
}

/** Dynamic RBAC role picker — syncs parent ref on seed load and on each toggle. */
export function EmployeeEditRoleCheckboxes({
  allRoles,
  initialRoleIds,
  isLoadingRoles,
  onSelectionChange,
}: EmployeeEditRoleCheckboxesProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialRoleIds)

  useEffect(() => {
 
    setSelectedRoleIds(initialRoleIds)
    onSelectionChange(initialRoleIds)
  }, [initialRoleIds, onSelectionChange])

  useEffect(() => {
    onSelectionChange(selectedRoleIds)
  }, [onSelectionChange, selectedRoleIds])

  if (isLoadingRoles) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Đang tải vai trò...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 pt-1">
      {allRoles?.map((role) => {
        const isChecked = selectedRoleIds.includes(role.id)
        return (
          <label
            key={role.id}
            className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => {
                setSelectedRoleIds((previous) =>
                  event.target.checked
                    ? [...previous, role.id]
                    : previous.filter((id) => id !== role.id),
                )
              }}
              className="h-3.5 w-3.5 rounded border-border text-primary"
            />
            <span>{getRoleLabel(role.name)}</span>
          </label>
        )
      })}
    </div>
  )
}
