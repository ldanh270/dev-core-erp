import { APPLICATION_STATUS } from "@/config/entities/attendance.config"
import {
  type IApplicationListItem,
  type IListApplicationsQuery,
  applicationApi,
} from "@/lib/api/application.api"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

export type StatusFilter = "all" | (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS]

interface UseManageApplicationsReturn {
  applications: IApplicationListItem[]
  isLoading: boolean
  isRefreshing: boolean
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  keyword: string
  setKeyword: (v: string) => void
  page: number
  setPage: (v: number) => void
  pageSize: number
  setPageSize: (v: number) => void
  totalPages: number
  total: number
  refetch: () => void
  stats: {
    pending: number
    approved: number
    rejected: number
    cancelled: number
    total: number
  }
  processingId: string | null
  handleApprove: (id: string) => Promise<void>
  handleReject: (id: string, reason: string) => Promise<void>
  handleSwapConfirm: (id: string) => Promise<void>
  handleSwapReject: (id: string, reason: string) => Promise<void>
}

/** Fetches and manages applications assigned to the current approver. */
export function useManageApplications(enabled: boolean = true): UseManageApplicationsReturn {
  const [applications, setApplications] = useState<IApplicationListItem[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [prevEnabled, setPrevEnabled] = useState(enabled)

  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled)
    setIsLoading(enabled)
  }

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending") // Default to pending for managers
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [keyword, setKeyword] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  })
  const activeRef = useRef(true)

  const fetchApplications = useCallback(
    async (isInitial = false) => {
      if (!isInitial) {
        setIsRefreshing(true)
      }

      try {
        const query: IListApplicationsQuery = {
          page,
          pageSize,
        }

        if (statusFilter !== "all") query.status = statusFilter
        if (typeFilter !== "all") query.type = typeFilter
        if (keyword.trim() !== "") query.keyword = keyword.trim()

        const { data, meta } = await applicationApi.listApprovals(query)

        if (!activeRef.current) return

        setApplications(data)
        if (meta) {
          setTotalPages(meta.totalPages ?? 1)
          setTotal(meta.total ?? data.length)
          setStats(meta.stats)
        }
      } catch (error) {
        const err = error as { response?: { data?: { error?: { message?: string } } } }
        toast.error(err.response?.data?.error?.message ?? "Lỗi khi tải danh sách đơn cần duyệt")
      } finally {
        if (activeRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [statusFilter, typeFilter, keyword, page, pageSize],
  )

  useEffect(() => {
    if (!enabled) return

    activeRef.current = true
    const timer = setTimeout(() => {
      if (activeRef.current) {
        void fetchApplications(false)
      }
    }, 0)
    return () => {
      activeRef.current = false
      clearTimeout(timer)
    }
  }, [fetchApplications, enabled])

  const refetch = useCallback(() => {
    fetchApplications(false)
  }, [fetchApplications])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await applicationApi.approve(id)
      toast.success("Đã phê duyệt đơn thành công")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi phê duyệt đơn")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    setProcessingId(id)
    try {
      await applicationApi.reject(id, reason)
      toast.success("Đã từ chối đơn thành công")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi từ chối đơn")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSwapConfirm = async (id: string) => {
    setProcessingId(id)
    try {
      await applicationApi.swapConfirm(id)
      toast.success("Đã xác nhận đổi ca. Đơn đang chờ người duyệt phê duyệt.")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi xác nhận đổi ca")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSwapReject = async (id: string, reason: string) => {
    setProcessingId(id)
    try {
      await applicationApi.swapReject(id, reason)
      toast.success("Đã từ chối đổi ca")
      refetch()
    } catch (error) {
      const err = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(err.response?.data?.error?.message ?? "Lỗi khi từ chối đổi ca")
    } finally {
      setProcessingId(null)
    }
  }

  return {
    applications,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    refetch,
    stats,
    processingId,
    handleApprove,
    handleReject,
    handleSwapConfirm,
    handleSwapReject,
  }
}
