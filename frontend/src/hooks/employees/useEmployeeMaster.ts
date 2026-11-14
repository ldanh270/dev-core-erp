import { useConfirm } from "@/components/common"
import {
  EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME,
  EMPLOYEE_STATUS,
} from "@/config/entities/employee.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useUnlockAccount } from "@/hooks/security/queries/use-security-query"
import { usePermission } from "@/hooks/use-permission"
import type { Employee, EmployeeListQuery, EmployeeType } from "@/types/employee.types"

import { useState } from "react"

import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { useEmployees, useUpdateEmployeeStatus } from "./queries/useEmployeeQuery"

/**
 * Custom React hook that encapsulates state and methods for the Employee Master view.
 * Handles filters, query state, action menus, modals, and mutation calls for employees.
 *
 * @returns Object containing all employee state values and handle handlers.
 */
export const useEmployeeMaster = () => {
  const confirm = useConfirm()

  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const search = searchParams.get("search") || ""
  const activeTab = searchParams.get("tab") || "all"

  const query: EmployeeListQuery = {
    page,
    limit,
    search: search || undefined,
  }

  if (activeTab === "locked") {
    query.status = "locked" as unknown as typeof query.status
  } else if (activeTab === "terminated") {
    query.status = "terminated" as unknown as typeof query.status
  } else if (activeTab === EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME) {
    query.type = "part_time" as EmployeeType
  } else if (activeTab !== "all") {
    query.type = activeTab as EmployeeType
  }

  const setQuery = (
    updater: EmployeeListQuery | ((prev: EmployeeListQuery) => EmployeeListQuery),
  ) => {
    const params = new URLSearchParams(searchParams)
    const prevQuery: EmployeeListQuery = {
      page,
      limit,
      search,
    }
    const nextQuery = typeof updater === "function" ? updater(prevQuery) : updater

    if (nextQuery.page) params.set("page", nextQuery.page.toString())
    if (nextQuery.limit) params.set("limit", nextQuery.limit.toString())
    if (nextQuery.search !== undefined) {
      if (nextQuery.search) {
        params.set("search", nextQuery.search)
      } else {
        params.delete("search")
      }
    }
    setSearchParams(params)
  }

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)
  // Auth context to check permission roles
  const { hasAnyPermission } = usePermission()
  const isAdminOrManager = hasAnyPermission([
    "employee.create",
    "employee.update",
    "employee.delete",
  ])
  const navigate = useNavigate()

  // Queries and mutations from React Query hooks
  const { data, isLoading, isFetching } = useEmployees(query)
  const updateStatusMutation = useUpdateEmployeeStatus()
  const unlockMutation = useUnlockAccount()

  /**
   * Event handler for searching employees by text input.
   * Resets pagination page to 1.
   * @param e Change event from the text input.
   */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams)
    if (val) {
      params.set("search", val)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    setSearchParams(params)
  }

  const handleTabChange = (
    tab:
      | "all"
      | EmployeeType
      | typeof EMPLOYEE_LIST_TAB_SCHEDULE_PART_TIME
      | typeof EMPLOYEE_STATUS.TERMINATED
      | "locked",
  ) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", tab)
    params.set("page", "1")
    setSearchParams(params)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams)
    if (val === "all") {
      params.delete("status")
    } else {
      params.set("status", val)
    }
    params.set("page", "1")
    setSearchParams(params)
  }

  /**
   * Triggers a status change to terminated for a given employee.
   * Prompts the user with a confirmation dialog.
   * @param id The ID of the employee to terminate.
   */
  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Cho nhân sự nghỉ việc",
      description:
        "Bạn có chắc chắn muốn cho nhân sự này nghỉ việc? Trạng thái tài khoản sẽ được chuyển thành thôi việc.",
      confirmText: "Đồng ý",
      cancelText: "Hủy bỏ",
      variant: "destructive",
    })

    if (isConfirmed) {
      try {
        await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.TERMINATED } })
        toast.success("Đã cho nhân sự nghỉ việc thành công.")
      } catch {
        toast.error("Có lỗi xảy ra khi cập nhật trạng thái nhân sự.")
      }
    }
  }

  /**
   * Re-activates a terminated employee's contract back to ACTIVE status.
   * Prompts the user with a confirmation dialog.
   * @param id The ID of the employee.
   */
  const handleReinstate = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Kích hoạt lại nhân sự",
      description:
        "Bạn có chắc chắn muốn cho nhân sự này đi làm lại? Trạng thái tài khoản sẽ được chuyển thành đang làm việc.",
      confirmText: "Đồng ý",
      cancelText: "Hủy bỏ",
      variant: "default",
    })

    if (isConfirmed) {
      try {
        await updateStatusMutation.mutateAsync({ id, data: { status: EMPLOYEE_STATUS.ACTIVE } })
        toast.success("Đã kích hoạt lại nhân sự thành công.")
      } catch {
        toast.error("Có lỗi xảy ra khi kích hoạt lại nhân sự.")
      }
    }
  }

  /**
   * Unlocks a locked employee account manually.
   * @param id The employee ID.
   */
  const handleUnlock = async (id: string) => {
    try {
      await unlockMutation.mutateAsync(id)
      toast.success("Đã mở khóa tài khoản thành công.")
    } catch {
      toast.error("Có lỗi xảy ra khi mở khóa tài khoản.")
    }
  }

  return {
    // State
    query,
    setQuery,
    activeTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editEmployee,
    setEditEmployee,
    viewingEmployeeId,
    setViewingEmployeeId,
    // Data
    data,
    isLoading,
    isFetching,
    // Handlers
    handleSearch,
    handleTabChange,
    handleStatusChange,
    handleDelete,
    handleReinstate,
    handleUnlock,
    // Auth & Nav
    isAdminOrManager,
    navigate,
  }
}
