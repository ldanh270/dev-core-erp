import { useCandidates } from "@/hooks/recruitment/use-recruitment-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import type { Candidate } from "@/types/recruitment.types"

import { useCallback, useState } from "react"

/**
 * Manages candidates directory state, query debouncing, pagination,
 * and view navigation to preserve Tier 1 separation of concerns.
 */
export function useCandidatesManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const debouncedKeyword = useDebounce(keyword, 400)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [viewCandidateOpen, setViewCandidateOpen] = useState(false)
  const { hasPermission } = usePermission()

  const { data, isLoading } = useCandidates({
    keyword: debouncedKeyword || undefined,
    page,
    pageSize,
  })

  const candidates = data?.data ?? []
  const meta = data?.meta

  const handleViewDetails = useCallback((candidate: Candidate) => {
    const appId = (candidate as { applications?: Array<{ id: string }> }).applications?.[0]?.id
    if (appId) {
      routerNavigate(`/recruitment/applications/${appId}`)
    } else {
      setSelectedCandidate(candidate)
      setViewCandidateOpen(true)
    }
  }, [])

  const handleSearch = useCallback((val: string) => {
    setKeyword(val)
    setPage(1)
  }, [])

  const handlePageSizeChange = useCallback((val: number) => {
    setPageSize(val)
    setPage(1)
  }, [])

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1
  const totalItems = meta?.total ?? candidates.length

  return {
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    keyword,
    handleSearch,
    candidates,
    isLoading,
    totalItems,
    totalPages,
    selectedCandidate,
    viewCandidateOpen,
    setViewCandidateOpen,
    hasPermission,
    handleViewDetails,
  }
}
