import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
} from "@/config/entities/project.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { usePermission } from "@/hooks/use-permission"
import { employeeApi } from "@/lib/api/employee.api"
import { projectApi } from "@/lib/api/project.api"
import { useProjectTrackers } from "@/hooks/project/use-project-tracker"
import type { Project } from "@/types/project.types"

import { useCallback, useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

/**
 * Predefined status tabs for project list filtering.
 */
export const PROJECT_STATUS_TABS = [
  { id: "all", label: "Tất cả" },
  { id: PROJECT_STATUS.PLANNING, label: PROJECT_STATUS_LABELS.planning },
  { id: PROJECT_STATUS.ACTIVE, label: PROJECT_STATUS_LABELS.active },
  { id: PROJECT_STATUS.ON_HOLD, label: PROJECT_STATUS_LABELS.on_hold },
  { id: PROJECT_STATUS.COMPLETED, label: PROJECT_STATUS_LABELS.completed },
  { id: PROJECT_STATUS.CANCELLED, label: PROJECT_STATUS_LABELS.cancelled },
] as const

/**
 * Custom hook to encapsulate ProjectList state, pagination, tabs, and data querying.
 * Adheres strictly to Single Responsibility Principle (SRP) and Dependency Inversion (DIP).
 */
export function useProjectListManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const searchTerm = searchParams.get("search") || ""
  const statusFilter = searchParams.get("status") || "all"

  const { hasPermission } = usePermission()
  const isManager = hasPermission("project.create")
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false)

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
    ]
  }, [dbTrackers])

  const handleTabChange = useCallback(
    (tabId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (tabId === "all") {
          next.delete("status")
        } else {
          next.set("status", tabId)
        }
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (keyword.trim()) {
          next.set("search", keyword.trim())
        } else {
          next.delete("search")
        }
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(nextPage))
        return next
      })
    },
    [setSearchParams],
  )

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("limit", String(nextLimit))
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const filteredProjects = useMemo(() => {
    return projects.filter((p: Project) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredProjects.length / limit) || 1

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * limit
    return filteredProjects.slice(start, start + limit)
  }, [filteredProjects, page, limit])

  return {
    projects: paginatedProjects,
    rawProjects: projects,
    employees,
    trackersList,
    isLoading,
    isManager,
    totalItems: filteredProjects.length,
    totalPages,
    currentPage: page,
    pageSize: limit,
    searchTerm,
    statusFilter,
    isOpenCreateModal,
    setIsOpenCreateModal,
    handleTabChange,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  }
}

