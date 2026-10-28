import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"

import { PageCard, PageHeader, StatusPill, AppPagination, EmptyState } from "@/components/common"
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
import { Input } from "@/components/ui/input"
import {
  EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME,
  EMPLOYEE_STATUS,
  EMPLOYEE_TYPES,
  getEmployeeStatusLabel,
  getEmployeeStatusVariant,
  getEmployeeTypeLabel,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployeeMaster } from "@/hooks/employees/useEmployeeMaster"
import type { EmployeeType } from "@/types/employee.types"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, Fragment } from "react"

import {
  Edit,
  FileDown,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  User,
  UserX,
  Unlock,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Valid identifiers for active filter tabs on the dashboard page.
 */
type ActiveTab =
  | "all"
  | EmployeeType
  | typeof EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME
  | typeof EMPLOYEE_STATUS.TERMINATED
  | "locked"

/**
 * Tab definition model representing dashboard filter criteria.
 */
interface TabDefinition {
  id: ActiveTab
  label: string
  separator?: boolean
}

// ─── Static constants (defined outside component — zero re-alloc) ─────────────

/**
 * List of tab filters to select from.
 */
const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "all", label: "Tất cả" },
  { id: EMPLOYEE_TYPES[0], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[0]) }, // "full_time"
  { id: EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME, label: getWorkScheduleTypeLabel("part_time") }, // "part_time"
  { id: EMPLOYEE_TYPES[2], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[2]) }, // "contractor"
  { id: EMPLOYEE_TYPES[3], label: getEmployeeTypeLabel(EMPLOYEE_TYPES[3]) }, // "intern"
  { id: "locked", label: "Bị khóa", separator: true },
  { id: EMPLOYEE_STATUS.TERMINATED, label: "Đã nghỉ việc", separator: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmployeeList Component.
 * Renders the employee master table, page header, search filters, tab switcher, pagination controls,
 * and handles interactions for viewing detail drawer, editing, creating, and terminating.
 */
export default function EmployeeList() {
  // Extract state & handlers from master hook (decouples UI from business state logic)
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

  const [localKeyword, setLocalKeyword] = useState(query.search || "")
  const [isTransitionLoading, setIsTransitionLoading] = useState(true)
  const showLoading = isLoading || isFetching || isTransitionLoading

  useEffect(() => {
    setLocalKeyword(query.search || "")
  }, [query.search])

  useEffect(() => {
    if (!isLoading && !isFetching) {
      const frame = requestAnimationFrame(() => {
        setIsTransitionLoading(false)
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }
  }, [isLoading, isFetching])

  const beginTransition = () => {
    setIsTransitionLoading(true)
  }

  // Derived pagination calculations
  const currentPage = query.page ?? 1
  const pageSize = query.limit ?? SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const totalPages = data?.meta.totalPages ?? 0

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

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      {/* ── Page header ───────────────────────────────────────────── */}
      <PageHeader
        title="Nhân sự"
        description="Quản lý hồ sơ toàn bộ nhân sự công ty."
        actions={
          isAdminOrManager && (
            <Button
              size="sm"
              onClick={() => {
                routerNavigate(ROUTES.HRM.CREATE_EMPLOYEE)
              }}
              className="gap-1.5 h-8 px-3 text-xs rounded-full font-semibold"
            >
              <Plus size={13} strokeWidth={2.5} />
              Thêm nhân sự
            </Button>
          )
        }
      />

      <PageCard className="p-0 overflow-hidden" noBorder={false}>
        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <nav
          aria-label="Lọc nhân sự"
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Fragment key={tab.id}>
                {tab.separator && (
                  <div className="w-px h-4 bg-border self-center shrink-0" />
                )}
                <button
                  onClick={() => {
                    beginTransition()
                    handleTabChange(tab.id)
                  }}
                  className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {getTabCount(tab.id)}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                  )}
                </button>
              </Fragment>
            )
          })}
        </nav>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center justify-between bg-muted/20">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                size="sm"
                type="text"
                value={localKeyword}
                onChange={(e) => {
                  const val = e.target.value
                  setLocalKeyword(val)
                  if (val === "") {
                    beginTransition()
                    setQuery((prev) => ({ ...prev, search: "", page: 1 }))
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    beginTransition()
                    setQuery((prev) => ({ ...prev, search: localKeyword, page: 1 }))
                  }
                }}
                name="employeeSearch"
                autoComplete="off"
                placeholder="Tìm kiếm họ tên, email..."
                aria-label="Tìm kiếm nhân sự"
                className="pl-9 pr-4 bg-background shadow-none border-border"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                beginTransition()
                setQuery((prev) => ({ ...prev, search: localKeyword, page: 1 }))
              }}
              className="px-4 font-semibold"
            >
              Tìm kiếm
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground bg-background border-border hover:bg-accent">
            <FileDown size={13.5} />
            Xuất Excel
          </Button>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Nhân sự
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Mã NV
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Liên hệ
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Vị trí
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Hợp đồng
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {showLoading ? (
                <tr>
                  <td colSpan={7} className="p-5">
                    <div className="space-y-3" aria-label="Đang tải dữ liệu">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={UserX}
                      title="Không tìm thấy nhân sự"
                      description="Không có nhân sự nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                    />
                  </td>
                </tr>
              ) : (
                data?.data.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors duration-100"
                  >
                    {/* Nhân sự */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 border border-border">
                          {employee.avatar?.url ? (
                            <img
                              src={employee.avatar.url}
                              alt={employee.fullName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User size={14} strokeWidth={1.5} />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setViewingEmployeeId(employee.id)
                            }}
                            className="text-[13px] font-medium text-foreground leading-tight hover:text-primary hover:underline focus-visible:outline-none focus-visible:text-primary text-left transition-colors"
                          >
                            {employee.fullName}
                          </button>
                          <div className="text-[11px] text-muted-foreground leading-tight">
                            {employee.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mã NV */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {employee?.id ? employee.id.slice(-6).toUpperCase() : "—"}
                      </span>
                    </td>

                    {/* Liên hệ */}
                    <td className="px-5 py-3">
                      <div className="text-[13px] text-foreground">{employee.phone || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{employee.email}</div>
                    </td>

                    {/* Vị trí */}
                    <td className="px-5 py-3">
                      <div className="text-[13px] text-foreground">{employee.position || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{employee.role}</div>
                    </td>

                    {/* Hợp đồng */}
                    <td className="px-5 py-3 text-[13px] text-foreground">
                      <div>
                        {getEmployeeTypeLabel(employee.employeeType)}
                      </div>
                      {/* Secondary line: schedule model (full-time shift vs part-time availability). */}
                      <div className="text-[11px] text-muted-foreground">
                        {getWorkScheduleTypeLabel(employee.workScheduleType)}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-3">
                      <StatusPill
                        label={getEmployeeStatusLabel(employee.status)}
                        variant={getEmployeeStatusVariant(employee.status)}
                      />
                    </td>

                    {/* Thao tác */}
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none cursor-pointer"
                            aria-label="Mở menu thao tác"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {isAdminOrManager && (
                            <>
                              {employee.lockedUntil && new Date(employee.lockedUntil) > new Date() && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleUnlock(employee.id)}
                                    className="cursor-pointer gap-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50 dark:text-amber-400 dark:focus:text-amber-300 dark:focus:bg-amber-950/30"
                                  >
                                    <Unlock size={13} />
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
                                    <Edit size={13} className="text-blue-500" />
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
                                    <Trash2 size={13} />
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
                                  <RotateCcw size={13} />
                                  Đi làm lại
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>



        {/* ── Pagination ───────────────────────────────────────────── */}
        {data && data.data.length > 0 && (
          <AppPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => {
              beginTransition()
              setQuery((prev) => ({ ...prev, page: p }))
            }}
            totalItems={data.meta.total}
            itemsPerPage={pageSize}
            onItemsPerPageChange={(limit) => {
              beginTransition()
              setQuery((prev) => ({ ...prev, limit, page: 1 }))
            }}
          />
        )}
      </PageCard>

      {/* Creation Modal */}
      <EmployeeCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
        }}
      />

      {/* Editing Drawer */}
      <EmployeeEditDrawer
        isOpen={!!editEmployee}
        onClose={() => {
          setEditEmployee(null)
        }}
        employee={editEmployee}
      />

      {/* Detail Drawer */}
      <EmployeeDetailsDrawer
        employeeId={viewingEmployeeId}
        onClose={() => {
          setViewingEmployeeId(null)
        }}
        onEdit={(emp) => setEditEmployee(emp)}
      />
    </div>
  )
}
