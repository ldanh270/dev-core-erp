import { DataTablePage } from "@/components/common"
import { ProjectCreateModal } from "@/components/features/project/ProjectCreateModal"
import { useProjectListColumns } from "@/components/features/project/use-project-list-columns"
import {
  PROJECT_STATUS_TABS,
  useProjectListManagement,
} from "@/hooks/project/use-project-list-management"
import { routerNavigate } from "@/lib/router-navigator"
import type { Project } from "@/types/project.types"

import { Plus } from "lucide-react"

/**
 * Standardized Project List dashboard.
 * Thin declarative composition shell powered by DataTablePage and useProjectListManagement hook.
 */
export default function ProjectList() {
  const {
    projects,
    employees,
    trackersList,
    isLoading,
    isManager,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    isOpenCreateModal,
    setIsOpenCreateModal,
    handleTabChange,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  } = useProjectListManagement()

  const columns = useProjectListColumns()

  return (
    <>
      <DataTablePage<Project>
        title="Quản lý dự án"
        description="Tổng quan danh sách dự án phần mềm và tiến độ thực thi"
        density="compact"
        primaryAction={
          isManager
            ? {
                label: "Tạo dự án mới",
                icon: Plus,
                onClick: () => setIsOpenCreateModal(true),
              }
            : undefined
        }
        tabs={{
          items: PROJECT_STATUS_TABS.map((tab) => ({ id: tab.id, label: tab.label })),
          activeTab: statusFilter,
          onTabChange: handleTabChange,
        }}
        search={{
          placeholder: "Tìm kiếm dự án theo tên hoặc mã...",
          value: searchTerm,
          onSearch: handleSearch,
        }}
        columns={columns}
        data={projects}
        keyExtractor={(project) => project.id}
        isLoading={isLoading}
        onRowClick={(project) => routerNavigate(`/project/${project.id}`)}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: handlePageChange,
          onItemsPerPageChange: handleLimitChange,
        }}
      />

      <ProjectCreateModal
        isOpen={isOpenCreateModal}
        onClose={() => setIsOpenCreateModal(false)}
        employees={employees}
        trackersList={trackersList}
      />
    </>
  )
}
