import { type DataTableColumn, DataTablePage, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/config/entities/project.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { usePermission } from "@/hooks/use-permission"
import { employeeApi } from "@/lib/api/employee.api"
import { projectApi } from "@/lib/api/project.api"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import { ProjectCreateModal } from "@/pages/project/components/project-create-modal"
import { useProjectTrackers } from "@/pages/project/hooks/use-project-tracker"
import type { Project } from "@/types/project.types"

import { useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { Plus, Users } from "lucide-react"
import { useSearchParams } from "react-router-dom"

const STATUS_TABS = [
  { id: "all", label: "Tất cả" },
  { id: PROJECT_STATUS.PLANNING, label: PROJECT_STATUS_LABELS.planning },
  { id: PROJECT_STATUS.ACTIVE, label: PROJECT_STATUS_LABELS.active },
  { id: PROJECT_STATUS.ON_HOLD, label: PROJECT_STATUS_LABELS.on_hold },
  { id: PROJECT_STATUS.COMPLETED, label: PROJECT_STATUS_LABELS.completed },
  { id: PROJECT_STATUS.CANCELLED, label: PROJECT_STATUS_LABELS.cancelled },
] as const

/**
 * Standardized Project List dashboard.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * 400ms search debouncing, status tabs, and separate ProjectCreateModal.
 */
export default function ProjectList() {
  // ==========================================
  // URL Query State & Permission
  // ==========================================
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const searchTerm = searchParams.get("search") || ""
  const statusFilter = searchParams.get("status") || "all"

  const { hasPermission } = usePermission()
  const isManager = hasPermission("project.create")
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false)

  // ==========================================
  // Data Fetching Queries
  // ==========================================
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectApi.list({ limit: 100 }),
  })
  const projects = useMemo(() => projectsData?.data || [], [projectsData?.data])

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeeApi.list({ limit: 200 }),
    enabled: isOpenCreateModal,
  })
  const employees = useMemo(() => employeesData?.data || [], [employeesData?.data])

  const firstProjectId = projects[0]?.id || ""
  const { data: dbTrackers = [] } = useProjectTrackers(firstProjectId)
  const trackersList = useMemo(() => {
    if (dbTrackers.length > 0) {
      return dbTrackers.map((t) => ({ key: t.code, label: `${t.name} (${t.code})` }))
    }
    return [
      { key: "feature", label: "Tính năng (feature)" },
      { key: "bug", label: "Lỗi (bug)" },
      { key: "support", label: "Hỗ trợ (support)" },
      { key: "task", label: "Công việc (task)" },
      { key: "meeting", label: "Cuộc họp (meeting)" },
      { key: "test", label: "Kiểm thử (test)" },
      { key: "subtask", label: "Công việc con (subtask)" },
      { key: "management", label: "Quản lý (management)" },
    ]
  }, [dbTrackers])

  // ==========================================
  // Client Filtering & Pagination
  // ==========================================
  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return projects.filter((proj) => {
      const matchesSearch =
        !term ||
        proj.name.toLowerCase().includes(term) ||
        (proj.description && proj.description.toLowerCase().includes(term)) ||
        proj.techStack.some((tech) => tech.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || proj.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  const pagedProjects = useMemo(
    () => filteredProjects.slice((page - 1) * limit, page * limit),
    [filteredProjects, page, limit],
  )
  const totalPages = Math.ceil(filteredProjects.length / limit)

  const getTabCount = (tabId: string) => {
    if (tabId === "all") return projects.length
    return projects.filter((p) => p.status === tabId).length
  }

  // ==========================================
  // Columns Configuration
  // ==========================================
  const columns: DataTableColumn<Project>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Tên dự án",
        width: getTableColWidthPx("TITLE"),
        minWidth: "240px",
        sticky: true,
        cell: (proj) => (
          <div className="flex flex-col justify-center min-w-0">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("activeProjectId", proj.id)
                routerNavigate(`/project/${proj.id}/overview`)
              }}
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "text-primary hover:underline font-bold text-left truncate cursor-pointer focus:outline-none",
              )}
              title={proj.name}
            >
              {proj.name}
            </button>
            {proj.description && (
              <p
                className={cn(TYPOGRAPHY.CELL_SECONDARY, "line-clamp-1 truncate max-w-[260px]")}
                title={proj.description}
              >
                {proj.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "teamLeader",
        header: "Trưởng nhóm (TL)",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: "180px",
        cell: (proj) =>
          proj.teamLeader ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground border border-border">
                <Users className="size-3.5" />
              </div>
              <span
                className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold truncate")}
                title={proj.teamLeader.fullName}
              >
                {proj.teamLeader.fullName}
              </span>
            </div>
          ) : (
            <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "italic")}>Chưa phân công</span>
          ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: "140px",
        cell: (proj) => (
          <StatusPill
            label={getProjectStatusLabel(proj.status)}
            variant={getProjectStatusVariant(proj.status)}
          />
        ),
      },
      {
        id: "techStack",
        header: "Công nghệ (Tech Stack)",
        width: getTableColWidthPx("TYPE"),
        minWidth: "180px",
        cell: (proj) => (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {proj.techStack.length > 0 ? (
              proj.techStack.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {tech}
                </Badge>
              ))
            ) : (
              <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "italic")}>—</span>
            )}
          </div>
        ),
      },
      {
        id: "startDate",
        header: "Ngày bắt đầu",
        width: getTableColWidthPx("DATE"),
        minWidth: "130px",
        cell: (proj) => (
          <span className={cn(TYPOGRAPHY.CELL_DATE, "whitespace-nowrap")}>
            {proj.startDate ? new Date(proj.startDate).toLocaleDateString("vi-VN") : "—"}
          </span>
        ),
      },
      {
        id: "expectedEndDate",
        header: "Dự kiến kết thúc",
        width: getTableColWidthPx("DATE"),
        minWidth: "130px",
        cell: (proj) => (
          <span className={cn(TYPOGRAPHY.CELL_DATE, "whitespace-nowrap")}>
            {proj.expectedEndDate
              ? new Date(proj.expectedEndDate).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        ),
      },
    ],
    [],
  )

  // ==========================================
  // Render Master DataTablePage
  // ==========================================
  return (
    <DataTablePage<Project>
      title="Danh sách dự án"
      description="Quản lý các dự án đang phát triển trong công ty"
      primaryAction={
        isManager
          ? {
              label: "Tạo dự án mới",
              icon: Plus,
              onClick: () => {
                setIsOpenCreateModal(true)
              },
            }
          : undefined
      }
      tabs={{
        items: STATUS_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: getTabCount(tab.id),
        })),
        activeTab: statusFilter,
        onTabChange: (id) => {
          const params = new URLSearchParams(searchParams)
          params.set("status", id)
          params.set("page", "1")
          setSearchParams(params)
        },
      }}
      search={{
        placeholder: "Tìm theo tên, mô tả, công nghệ...",
        value: searchTerm,
        onSearch: (value) => {
          const params = new URLSearchParams(searchParams)
          if (value.trim()) {
            params.set("search", value.trim())
          } else {
            params.delete("search")
          }
          params.set("page", "1")
          setSearchParams(params)
        },
      }}
      columns={columns}
      data={pagedProjects}
      isLoading={isLoading}
      emptyState={{
        title: "Chưa có dự án nào",
        description: "Chưa có dự án nào trong hệ thống. Hãy bấm 'Tạo dự án mới' để bắt đầu.",
      }}
      onResetFilters={() => {
        setSearchParams(new URLSearchParams())
      }}
      pagination={
        filteredProjects.length > 0
          ? {
              currentPage: page,
              totalPages: totalPages || 1,
              totalItems: filteredProjects.length,
              itemsPerPage: limit,
              onPageChange: (newPage) => {
                const params = new URLSearchParams(searchParams)
                params.set("page", newPage.toString())
                setSearchParams(params)
              },
              onItemsPerPageChange: (newLimit) => {
                const params = new URLSearchParams(searchParams)
                params.set("limit", newLimit.toString())
                params.set("page", "1")
                setSearchParams(params)
              },
              pageSizeOptions: [10, 20, 50, 100],
            }
          : undefined
      }
      extraContent={
        <ProjectCreateModal
          isOpen={isOpenCreateModal}
          onClose={() => {
            setIsOpenCreateModal(false)
          }}
          trackersList={trackersList}
          employees={employees}
        />
      }
    />
  )
}
