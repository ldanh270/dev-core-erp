import { Edit, MoreHorizontal, RotateCcw, Trash2, Unlock, User } from "lucide-react"
import { useMemo } from "react"
import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  EMPLOYEE_STATUS,
  getEmployeeStatusLabel,
  getEmployeeStatusVariant,
  getEmployeeTypeLabel,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import type { Employee } from "@/types/employee.types"

interface EmployeeTableActionsCellProps {
  employee: Employee
  isAdminOrManager: boolean
  onDelete: (id: string) => void
  onReinstate: (id: string) => void
  onUnlock: (id: string) => void
  onEdit: (employee: Employee) => void
}

function EmployeeTableActionsCell({
  employee,
  isAdminOrManager,
  onDelete,
  onReinstate,
  onUnlock,
  onEdit,
}: EmployeeTableActionsCellProps) {
  const isLocked = employee.lockedUntil && new Date(employee.lockedUntil) > new Date()

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Mở menu thao tác"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          {isAdminOrManager && (
            <>
              {isLocked && (
                <>
                  <DropdownMenuItem
                    onClick={() => onUnlock(employee.id)}
                    className="cursor-pointer gap-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50 dark:text-amber-400 dark:focus:text-amber-300 dark:focus:bg-amber-950/30"
                  >
                    <Unlock className="size-3.5" />
                    Mở khóa tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {employee.status !== EMPLOYEE_STATUS.TERMINATED && (
                <>
                  <DropdownMenuItem
                    onClick={() => onEdit(employee)}
                    className="cursor-pointer gap-2"
                  >
                    <Edit className="size-3.5 text-blue-500" />
                    Sửa thông tin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(employee.id)}
                    className="cursor-pointer gap-2"
                  >
                    <Trash2 className="size-3.5" />
                    Cho nghỉ việc
                  </DropdownMenuItem>
                </>
              )}

              {employee.status === EMPLOYEE_STATUS.TERMINATED && (
                <DropdownMenuItem
                  onClick={() => onReinstate(employee.id)}
                  className="cursor-pointer gap-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:text-emerald-400 dark:focus:text-emerald-300 dark:focus:bg-emerald-950/30"
                >
                  <RotateCcw className="size-3.5" />
                  Đi làm lại
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export interface UseEmployeeListColumnsProps {
  isAdminOrManager: boolean
  onDelete: (id: string) => void
  onReinstate: (id: string) => void
  onUnlock: (id: string) => void
  onEdit: (employee: Employee) => void
  onView: (id: string) => void
}

/**
 * Generates table column definitions and action handlers for the employee master list.
 */
export function useEmployeeListColumns({
  isAdminOrManager,
  onDelete,
  onReinstate,
  onUnlock,
  onEdit,
  onView,
}: UseEmployeeListColumnsProps): DataTableColumn<Employee>[] {
  return useMemo(
    () => [
      {
        id: "employee",
        header: "Nhân sự",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        sticky: true,
        cell: (employee) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p
                onClick={() => onView(employee.id)}
                className="font-medium text-sm leading-5 text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                title={employee.fullName}
              >
                {employee.fullName}
              </p>
              <p className="text-xs leading-4 text-muted-foreground truncate" title={employee.username}>
                {employee.username}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "code",
        header: "Mã NV",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        sticky: true,
        cell: (employee) => (
          <span
            className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground inline-block truncate"
            title={employee.id ? employee.id.slice(-6).toUpperCase() : "—"}
          >
            {employee.id ? employee.id.slice(-6).toUpperCase() : "—"}
          </span>
        ),
      },
      {
        id: "position",
        header: "Vị trí",
        width: getTableColWidthPx("POSITION"),
        minWidth: `${TABLE_COL_WIDTH.POSITION}px`,
        cell: (employee) => (
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium leading-5 text-foreground truncate" title={employee.position || ""}>
              {employee.position || "—"}
            </p>
            <p className="text-xs leading-4 text-muted-foreground truncate" title={employee.role || ""}>
              {employee.role || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Liên hệ",
        width: getTableColWidthPx("CONTACT"),
        minWidth: `${TABLE_COL_WIDTH.CONTACT}px`,
        cell: (employee) => (
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium leading-5 text-foreground truncate" title={employee.phone || "—"}>
              {employee.phone || "—"}
            </p>
            <p className="text-xs leading-4 text-muted-foreground truncate" title={employee.email}>
              {employee.email}
            </p>
          </div>
        ),
      },
      {
        id: "startDate",
        header: "Ngày vào làm",
        width: getTableColWidthPx("DATE"),
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        hideBelow: "lg",
        cell: (employee) => {
          const dateStr = employee.startDate
            ? new Date(employee.startDate).toLocaleDateString("vi-VN")
            : "—"
          return (
            <span
              className="text-sm text-muted-foreground font-medium whitespace-nowrap"
              title={dateStr}
            >
              {dateStr}
            </span>
          )
        },
      },
      {
        id: "contract",
        header: "Hợp đồng",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        hideBelow: "lg",
        cell: (employee) => {
          const typeLabel = getEmployeeTypeLabel(employee.employeeType)
          const scheduleLabel = getWorkScheduleTypeLabel(employee.workScheduleType)
          return (
            <div className="min-w-0 flex flex-col justify-center">
              <p
                className="text-sm font-medium leading-5 text-foreground truncate"
                title={typeLabel}
              >
                {typeLabel}
              </p>
              <p className="text-xs leading-4 text-muted-foreground truncate" title={scheduleLabel}>
                {scheduleLabel}
              </p>
            </div>
          )
        },
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        cell: (employee) => (
          <StatusPill
            label={getEmployeeStatusLabel(employee.status)}
            variant={getEmployeeStatusVariant(employee.status)}
          />
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        align: "center",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        cell: (employee) => (
          <EmployeeTableActionsCell
            employee={employee}
            isAdminOrManager={isAdminOrManager}
            onDelete={onDelete}
            onReinstate={onReinstate}
            onUnlock={onUnlock}
            onEdit={onEdit}
          />
        ),
      },
    ],
    [isAdminOrManager, onDelete, onReinstate, onUnlock, onEdit, onView],
  )
}
