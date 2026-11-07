import { DataTablePage, type DataTableColumn, StatusPill, TABLE_COL_WIDTH } from "@/components/common"
import { EmployeeCreateModal } from "@/components/features/employees/EmployeeCreateModal"
import { EmployeeDetailsDrawer } from "@/components/features/employees/EmployeeDetailsDrawer"
import { EmployeeEditDrawer } from "@/components/features/employees/EmployeeEditDrawer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME,
  EMPLOYEE_STATUS,
  EMPLOYEE_TYPES,
  getEmployeeStatusLabel,
  getEmployeeStatusVariant,
  getEmployeeTypeLabel,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployeeMaster } from "@/hooks/employees/useEmployeeMaster"
import { routerNavigate } from "@/lib/router-navigator"
import type { Employee, EmployeeType } from "@/types/employee.types"

import { useCallback, useMemo } from "react"
import {
  Edit,
  FileDown,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  Unlock,
  User,
  UserX,
} from "lucide-react"

type ActiveTab =
  | "all"
  | EmployeeType
  | typeof EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME
  | typeof EMPLOYEE_STATUS.TERMINATED
  | "locked"

interface TabDefinition {
  id: ActiveTab
  label: string
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "all", label: "Tất cả" },
  { id: EMPLOYEE_TYPES[0], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[0]) },
  { id: EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME, label: getWorkScheduleTypeLabel("part_time") },
  { id: EMPLOYEE_TYPES[2], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[2]) },
  { id: EMPLOYEE_TYPES[3], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[3]) },
  { id: "locked", label: "Bị khóa" },
  { id: EMPLOYEE_STATUS.TERMINATED, label: "Đã nghỉ việc" },
]

const COL_WIDTH = {
  employee: TABLE_COL_WIDTH.EMPLOYEE,
  code: TABLE_COL_WIDTH.CODE,
  position: TABLE_COL_WIDTH.POSITION,
  contact: TABLE_COL_WIDTH.CONTACT,
  startDate: TABLE_COL_WIDTH.DATE,
  contract: TABLE_COL_WIDTH.TYPE,
  status: TABLE_COL_WIDTH.STATUS,
  actions: TABLE_COL_WIDTH.ACTIONS,
} as const

/**
 * Standardized Employee List view powered by DataTablePage master component.
 * Integrates viewport-locked internal scrolling, 400ms search debouncing, and tabs.
 */
export default function EmployeeList() {
  const {
    query,
    setQuery,
    activeTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editEmployee,
    setEditEmployee,
    viewingEmployeeId,
    setViewingEmployeeId,
    data,
    isLoading,
    isFetching,
    handleTabChange,
    handleDelete,
    handleReinstate,
    handleUnlock,
    isAdminOrManager,
  } = useEmployeeMaster()

  // Pagination & URL query state
  const currentPage = query.page ?? 1
  const pageSize = query.limit ?? SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const totalPages = data?.meta.totalPages ?? 0

  // Debounced search callback
  const handleSearch = useCallback(
    (keyword: string) => {
      setQuery((prev) => ({ ...prev, search: keyword, page: 1 }))
    },
    [setQuery],
  )

  // Tab counter helper
  const getTabCount = (tabId: ActiveTab) => {
    if (!data?.stats) return 0
    const stats = data.stats
    switch (tabId) {
      case "all": return stats.total
      case "full_time": return stats.full_time
      case EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME: return stats.part_time
      case "intern": return stats.intern
      case "contractor": return stats.contractor
      case "locked": return stats.locked
      case EMPLOYEE_STATUS.TERMINATED: return stats.terminated
      default: return 0
    }
  }

  // Data table column definitions
  const columns: DataTableColumn<Employee>[] = useMemo(
    () => [
      {
        id: "employee",
        header: "Nhân sự",
        width: `${COL_WIDTH.employee}px`,
        minWidth: `${COL_WIDTH.employee}px`,
        sticky: true,
        cell: (employee) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p
                onClick={() => {
                  setViewingEmployeeId(employee.id)
                }}
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
        width: `${COL_WIDTH.code}px`,
        minWidth: `${COL_WIDTH.code}px`,
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
        width: `${COL_WIDTH.position}px`,
        minWidth: `${COL_WIDTH.position}px`,
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
        width: `${COL_WIDTH.contact}px`,
        minWidth: `${COL_WIDTH.contact}px`,
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
        width: `${COL_WIDTH.startDate}px`,
        minWidth: `${COL_WIDTH.startDate}px`,
        hideBelow: "lg",
        cell: (employee) => {
          const dateStr = employee.startDate ? new Date(employee.startDate).toLocaleDateString("vi-VN") : "—"
          return (
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap" title={dateStr}>
              {dateStr}
            </span>
          )
        },
      },
      {
        id: "contract",
        header: "Hợp đồng",
        width: `${COL_WIDTH.contract}px`,
        minWidth: `${COL_WIDTH.contract}px`,
        hideBelow: "lg",
        cell: (employee) => {
          const typeLabel = getEmployeeTypeLabel(employee.employeeType)
          const scheduleLabel = getWorkScheduleTypeLabel(employee.workScheduleType)
          return (
            <div className="min-w-0 flex flex-col justify-center">
              <p className="text-sm font-medium leading-5 text-foreground truncate" title={typeLabel}>
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
        width: `${COL_WIDTH.status}px`,
        minWidth: `${COL_WIDTH.status}px`,
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
        width: `${COL_WIDTH.actions}px`,
        minWidth: `${COL_WIDTH.actions}px`,
        cell: (employee) => (
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
                    {employee.lockedUntil && new Date(employee.lockedUntil) > new Date() && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            handleUnlock(employee.id)
                          }}
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
                          onClick={() => {
                            setEditEmployee(employee)
                          }}
                          className="cursor-pointer gap-2"
                        >
                          <Edit className="size-3.5 text-blue-500" />
                          Sửa thông tin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            handleDelete(employee.id)
                          }}
                          className="cursor-pointer gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          Cho nghỉ việc
                        </DropdownMenuItem>
                      </>
                    )}

                    {employee.status === EMPLOYEE_STATUS.TERMINATED && (
                      <DropdownMenuItem
                        onClick={() => {
                          handleReinstate(employee.id)
                        }}
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
        ),
      },
    ],
    [isAdminOrManager, handleDelete, handleReinstate, handleUnlock, setEditEmployee, setViewingEmployeeId],
  )

  return (
    <DataTablePage
      title="Nhân sự"
      description="Quản lý hồ sơ toàn bộ nhân sự công ty."
      /* Primary Header Action: Create employee navigation button (40px) */
      primaryAction={
        isAdminOrManager
          ? {
              label: "Thêm nhân sự",
              icon: Plus,
              onClick: () => {
                routerNavigate(ROUTES.HRM.CREATE_EMPLOYEE)
              },
            }
          : undefined
      }
      /* Toolbar Action: Secondary Export button (40px) */
      toolbarActions={
        <Button
          type="button"
          variant="outline"
          className="rounded-full gap-2"
        >
          <FileDown className="size-4" />
          Xuất Excel
        </Button>
      }
      /* Category Tabs: Employee status and schedule filters with live counters */
      tabs={{
        items: TAB_DEFINITIONS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: getTabCount(tab.id),
        })),
        activeTab,
        onTabChange: (id) => {
          handleTabChange(id as ActiveTab)
        },
      }}
      /* Search Configuration: 400ms debounced search bar */
      search={{
        placeholder: "Tìm kiếm họ tên, email...",
        value: query.search || "",
        onSearch: handleSearch,
      }}
      columns={columns}
      data={data?.data || []}
      isLoading={isLoading || isFetching}
      emptyState={{
        icon: UserX,
        title: "Chưa có nhân sự nào",
        description: "Bắt đầu tạo hồ sơ nhân sự mới cho công ty.",
      }}
      onResetFilters={() => {
        setQuery((prev) => ({ ...prev, page: 1, search: "" }))
        handleTabChange("all")
      }}
      /* Bottom Pagination Footer: 32px pagination controls */
      pagination={
        data && data.data.length > 0
          ? {
              currentPage,
              totalPages,
              totalItems: data.meta.total,
              itemsPerPage: pageSize,
              onPageChange: (page) => {
                setQuery((prev) => ({ ...prev, page }))
              },
              onItemsPerPageChange: (limit) => {
                setQuery((prev) => ({ ...prev, limit, page: 1 }))
              },
              pageSizeOptions: [10, 20, 50, 100],
            }
          : undefined
      }
      /* Drawer & Modal Overlays: Create Modal, Edit Drawer, Details Drawer */
      extraContent={
        <>
          <EmployeeCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false)
            }}
          />
          <EmployeeEditDrawer
            isOpen={Boolean(editEmployee)}
            onClose={() => {
              setEditEmployee(null)
            }}
            employee={editEmployee}
          />
          <EmployeeDetailsDrawer
            employeeId={viewingEmployeeId}
            onClose={() => {
              setViewingEmployeeId(null)
            }}
            onEdit={(emp) => {
              setEditEmployee(emp)
            }}
          />
        </>
      }
    />
  )
}
