import { DataTablePage } from "@/components/common"
import { EmployeeCreateModal } from "@/components/features/employees/EmployeeCreateModal"
import { EmployeeDetailsDrawer } from "@/components/features/employees/EmployeeDetailsDrawer"
import { EmployeeEditDrawer } from "@/components/features/employees/EmployeeEditDrawer"
import { EmployeeExportButton } from "@/components/features/employees/EmployeeExportButton"
import { useEmployeeListColumns } from "@/components/features/employees/employee-list-columns"
import { ROUTES } from "@/config/routes.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployeeMaster } from "@/hooks/employees/useEmployeeMaster"
import { routerNavigate } from "@/lib/router-navigator"

import { useCallback } from "react"
import { Plus } from "lucide-react"

/**
 * Standardized Employee List view powered by DataTablePage master component.
 * Thin declarative composition shell connecting useEmployeeMaster with presentation layouts.
 */
export default function EmployeeList() {
  const {
    query,
    setQuery,
    tabsConfig,
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

  const currentPage = query.page ?? 1
  const pageSize = query.limit ?? SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const totalPages = data?.meta.totalPages ?? 0

  const handleSearch = useCallback(
    (keyword: string) => {
      setQuery((prev) => ({ ...prev, search: keyword, page: 1 }))
    },
    [setQuery],
  )

  const columns = useEmployeeListColumns({
    isAdminOrManager,
    onDelete: handleDelete,
    onReinstate: handleReinstate,
    onUnlock: handleUnlock,
    onEdit: setEditEmployee,
    onView: setViewingEmployeeId,
  })

  return (
    <DataTablePage
      title="Nhân sự"
      description="Quản lý hồ sơ toàn bộ nhân sự công ty."
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
      toolbarActions={<EmployeeExportButton />}
      tabs={tabsConfig}
      search={{
        placeholder: "Tìm kiếm họ tên, email...",
        value: query.search || "",
        onSearch: handleSearch,
      }}
      columns={columns}
      data={data?.data || []}
      isLoading={isLoading || isFetching}
      emptyState={{
        title: "Chưa có nhân sự nào",
        description: "Bắt đầu tạo hồ sơ nhân sự mới cho công ty.",
      }}
      onResetFilters={() => {
        setQuery((prev) => ({ ...prev, page: 1, search: "" }))
        handleTabChange("all")
      }}
      pagination={{
        currentPage,
        totalPages: totalPages || 1,
        totalItems: data?.meta.total ?? 0,
        itemsPerPage: pageSize,
        onPageChange: (page) => {
          setQuery((prev) => ({ ...prev, page }))
        },
        onItemsPerPageChange: (limit) => {
          setQuery((prev) => ({ ...prev, limit, page: 1 }))
        },
        pageSizeOptions: [10, 20, 50, 100],
      }}
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
