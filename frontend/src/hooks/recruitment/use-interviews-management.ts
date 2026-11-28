import { INTERVIEW_RESULT } from "@/config/entities/recruitment.config"
import { useUpcomingInterviews } from "@/hooks/recruitment/use-recruitment-queries"
import type { InterviewRound } from "@/types/recruitment.types"

import { useCallback, useMemo, useState } from "react"

export const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: INTERVIEW_RESULT.PENDING, label: "Chờ kết quả" },
  { id: INTERVIEW_RESULT.PASS, label: "Đạt" },
  { id: INTERVIEW_RESULT.FAIL, label: "Không đạt" },
  { id: INTERVIEW_RESULT.NO_SHOW, label: "Vắng mặt" },
]

/**
 * Handles interview round queries, view modes (table vs card grid),
 * tab-based status filtering, and search filtering without presentation logic.
 */
export function useInterviewsManagement() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedInterview, setSelectedInterview] = useState<InterviewRound | null>(null)
  const [viewInterviewOpen, setViewInterviewOpen] = useState(false)

  const { data: upcomingData, isLoading } = useUpcomingInterviews(14)
  const interviews = useMemo(() => upcomingData ?? [], [upcomingData])

  const tabCounts = useMemo(() => {
    const counts = new Map<string, number>()
    counts.set("all", interviews.length)
    for (const item of interviews) {
      const key = item.result || INTERVIEW_RESULT.PENDING
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return Object.fromEntries(counts)
  }, [interviews])

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemResult = item.result || INTERVIEW_RESULT.PENDING
      if (activeTab !== "all" && itemResult !== activeTab) return false

      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      return (
        item.candidateName?.toLowerCase().includes(searchStr) ||
        item.positionTitle?.toLowerCase().includes(searchStr) ||
        (item.interviewType && item.interviewType.toLowerCase().includes(searchStr))
      )
    })
  }, [interviews, activeTab, keyword])

  const paginatedInterviews = useMemo(() => {
    return filteredInterviews.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredInterviews, page, pageSize])

  const handleViewDetails = useCallback((interview: InterviewRound) => {
    setSelectedInterview(interview)
    setViewInterviewOpen(true)
  }, [])

  const handleCloseModal = useCallback((open: boolean) => {
    setViewInterviewOpen(open)
    if (!open) {
      setSelectedInterview(null)
    }
  }, [])

  const handleSearch = useCallback((val: string) => {
    setKeyword(val)
    setPage(1)
  }, [])

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id)
    setPage(1)
  }, [])

  const handlePageSizeChange = useCallback((val: number) => {
    setPageSize(val)
    setPage(1)
  }, [])

  const tabsConfig = useMemo(
    () => ({
      items: TAB_DEFINITIONS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tabCounts[tab.id] || 0,
      })),
      activeTab,
      onTabChange: handleTabChange,
    }),
    [activeTab, tabCounts, handleTabChange],
  )

  return {
    viewMode,
    setViewMode,
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    keyword,
    handleSearch,
    filteredInterviews,
    paginatedInterviews,
    isLoading,
    selectedInterview,
    viewInterviewOpen,
    handleCloseModal,
    tabsConfig,
    handleViewDetails,
  }
}
