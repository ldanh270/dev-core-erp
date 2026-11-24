import {
  REQUISITION_STATUS,
  REQUISITION_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { usePersonalEmployeeId } from "@/hooks/attendance/use-personal-employee-id"
import { useRequisitions } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { JobRequisition } from "@/types/recruitment.types"
import { useCallback, useMemo, useState } from "react"

export const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: REQUISITION_STATUS.DRAFT, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.DRAFT] },
  {
    id: REQUISITION_STATUS.PENDING_APPROVAL,
    label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.PENDING_APPROVAL],
  },
  {
    id: REQUISITION_STATUS.APPROVED,
    label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.APPROVED],
  },
  {
    id: REQUISITION_STATUS.REJECTED,
    label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.REJECTED],
  },
  { id: REQUISITION_STATUS.CLOSED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.CLOSED] },
  { id: REQUISITION_STATUS.FILLED, label: REQUISITION_STATUS_LABELS[REQUISITION_STATUS.FILLED] },
]

export function useRequisitionsManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<JobRequisition | null>(null)
  const [viewingRequisitionId, setViewingRequisitionId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { hasPermission } = usePermission()
  const employeeId = usePersonalEmployeeId()

  const { data, isLoading } = useRequisitions({ page: 1, pageSize: 100 })
  const allRequisitions = useMemo(() => data?.data ?? [], [data?.data])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allRequisitions.length }
    for (const req of allRequisitions) {
      counts[req.status] = (counts[req.status] || 0) + 1
    }
    return counts
  }, [allRequisitions])

  const filteredRequisitions = useMemo(() => {
    return allRequisitions.filter((req) => {
      if (activeTab !== "all" && req.status !== activeTab) return false
      if (priorityFilter !== "all" && req.priority !== priorityFilter) return false

      const normalizedKeyword = keyword.trim().toLowerCase()
      if (normalizedKeyword) {
        const matches = [req.code, req.title, req.department, req.approver?.fullName]
          .filter(Boolean)
          .some((val) => val?.toLowerCase().includes(normalizedKeyword))
        if (!matches) return false
      }
      return true
    })
  }, [allRequisitions, activeTab, priorityFilter, keyword])

  const totalItems = filteredRequisitions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedRequisitions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRequisitions.slice(start, start + pageSize)
  }, [filteredRequisitions, page, pageSize])

  const hasActiveFilters = activeTab !== "all" || priorityFilter !== "all" || keyword.trim() !== ""

  const handleResetFilters = useCallback(() => {
    setActiveTab("all")
    setPriorityFilter("all")
    setKeyword("")
    setPage(1)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setKeyword(val)
    setPage(1)
  }, [])

  const handlePriorityChange = useCallback((val: string) => {
    setPriorityFilter(val)
    setPage(1)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleOpenEdit = useCallback((req: JobRequisition) => {
    setSelectedRequisition(req)
    setIsEditOpen(true)
  }, [])

  const handleCloseModal = useCallback((open: boolean) => {
    if (!open) {
      setIsCreateOpen(false)
      setIsEditOpen(false)
      setSelectedRequisition(null)
    }
  }, [])

  const handleViewDetails = useCallback((id: string) => {
    setViewingRequisitionId(id)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setViewingRequisitionId(null)
  }, [])

  const tabsConfig = useMemo(
    () => ({
      items: TAB_DEFINITIONS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tabCounts[tab.id] || 0,
      })),
      activeTab,
      onTabChange: (id: string) => {
        setActiveTab(id)
        setPage(1)
      },
    }),
    [activeTab, tabCounts],
  )

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    keyword,
    priorityFilter,
    hasActiveFilters,
    isLoading,
    totalItems,
    totalPages,
    paginatedRequisitions,
    tabsConfig,
    hasPermission,
    employeeId,
    isCreateOpen,
    isEditOpen,
    selectedRequisition,
    viewingRequisitionId,
    handleSearch,
    handlePriorityChange,
    handleResetFilters,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleViewDetails,
    handleCloseDrawer,
  }
}
