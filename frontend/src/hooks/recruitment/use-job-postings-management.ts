import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import {
  useJobPostings,
  useRequisitions,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { JobPosting } from "@/types/recruitment.types"

import { useCallback, useMemo, useState } from "react"

import { useNavigate, useSearchParams } from "react-router-dom"

export const JOB_POSTINGS_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "open", label: "Đang mở" },
  { id: "closed", label: "Đã đóng" },
  { id: "draft", label: "Nháp" },
]

export const getPostingChannelLabel = (value: string) =>
  POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

/**
 * Custom hook to encapsulate JobPostingsPage state, search, tabs, permissions, and modals.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useJobPostingsManagement() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(SYSTEM_CONFIG.PAGINATION.MEDIUM_LIMIT)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [initialRequisitionId, setInitialRequisitionId] = useState<string | undefined>(
    params.get("reqId") ?? undefined,
  )

  const { hasPermission } = usePermission()
  const canManage = hasPermission("recruitment.posting.manage")

  const { data: requisitionsData } = useRequisitions({ status: "approved" })
  const requisitions = requisitionsData?.data ?? []
  const { data: postings = [], isLoading } = useJobPostings()

  const handleOpenWorkspace = useCallback(
    (posting: JobPosting) => {
      sessionStorage.setItem("activeJobPostingId", posting.id)
      navigate(`/recruitment/job-postings/${posting.id}/overview`)
    },
    [navigate],
  )

  const handleCreateNew = useCallback(() => {
    setInitialRequisitionId(undefined)
    setCreateModalOpen(true)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setKeyword(val)
    setPage(1)
  }, [])

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    setPage(1)
  }, [])

  const tabCounts = useMemo(() => {
    return {
      all: postings.length,
      open: postings.filter((p) => p.status === "open").length,
      closed: postings.filter((p) => p.status === "closed").length,
      draft: postings.filter((p) => p.status === "draft").length,
    }
  }, [postings])

  const filteredPostings = useMemo(() => {
    return postings.filter((item) => {
      const matchTab = activeTab === "all" || item.status === activeTab
      const matchSearch =
        !keyword ||
        item.requisition?.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        item.channel.toLowerCase().includes(keyword.toLowerCase()) ||
        item.sourceCode.toLowerCase().includes(keyword.toLowerCase())
      return matchTab && matchSearch
    })
  }, [postings, activeTab, keyword])

  const totalPages = Math.ceil(filteredPostings.length / pageSize) || 1

  const paginatedPostings = useMemo(() => {
    return filteredPostings.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredPostings, page, pageSize])

  return {
    postings: paginatedPostings,
    rawPostings: postings,
    requisitions,
    isLoading,
    canManage,
    totalItems: filteredPostings.length,
    totalPages,
    currentPage: page,
    setCurrentPage: setPage,
    pageSize,
    setPageSize,
    activeTab,
    tabCounts,
    createModalOpen,
    setCreateModalOpen,
    initialRequisitionId,
    handleOpenWorkspace,
    handleCreateNew,
    handleSearch,
    handleTabChange,
  }
}
