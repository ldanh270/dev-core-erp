import { useConfirm } from "@/components/common"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import {
  useDeleteOAuthAccount,
  useOAuthAccounts,
} from "@/hooks/recruitment/use-recruitment-queries"
import apiClient from "@/lib/api-client"
import type { OAuthAccount } from "@/lib/api/recruitment.api"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

export const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "google_form", label: "Google Form" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "other", label: "Kênh khác" },
]

export function useOAuthAccountsManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: accounts = [], isLoading } = useOAuthAccounts()
  const deleteMutation = useDeleteOAuthAccount()
  const confirm = useConfirm()

  const [activeTab, setActiveTab] = useState<string>("all")
  const [keyword, setKeyword] = useState<string>("")
  const [channelFilter, setChannelFilter] = useState<string>("all")

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>("google_form")
  const [accountName, setAccountName] = useState<string>("")
  const [targetAccountId, setTargetAccountId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")
    if (error) {
      toast.error(`Kết nối thất bại: ${error}`)
      setSearchParams({})
    } else if (success === "connected") {
      toast.success("Kết nối tài khoản Google thành công!")
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeTab === "google_form" && acc.channel !== "google_form") return false
      if (activeTab === "linkedin" && acc.channel !== "linkedin") return false
      if (activeTab === "facebook" && acc.channel !== "facebook") return false
      if (activeTab === "other" && ["google_form", "linkedin", "facebook"].includes(acc.channel)) {
        return false
      }

      if (channelFilter !== "all" && acc.channel !== channelFilter) return false

      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      const name = (acc.name || "").toLowerCase()
      const channel = acc.channel.toLowerCase()
      const id = acc.id.toLowerCase()

      return name.includes(searchStr) || channel.includes(searchStr) || id.includes(searchStr)
    })
  }, [accounts, activeTab, channelFilter, keyword])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: accounts.length,
      google_form: 0,
      linkedin: 0,
      facebook: 0,
      other: 0,
    }

    for (const acc of accounts) {
      if (acc.channel === "google_form") counts.google_form++
      else if (acc.channel === "linkedin") counts.linkedin++
      else if (acc.channel === "facebook") counts.facebook++
      else counts.other++
    }

    return counts
  }, [accounts])

  const handleResetFilters = useCallback(() => {
    setActiveTab("all")
    setChannelFilter("all")
    setKeyword("")
    setPage(1)
  }, [])

  const hasActiveFilters = activeTab !== "all" || channelFilter !== "all" || keyword.trim() !== ""

  const handleOpenConnect = useCallback((channel?: string, accountId?: string) => {
    setSelectedChannel(channel || "google_form")
    setTargetAccountId(accountId || null)
    setAccountName("")
    setIsConnectModalOpen(true)
  }, [])

  const handleStartOAuth = useCallback(async () => {
    if (!accountName.trim()) {
      toast.error("Vui lòng nhập tên nhận diện cho tài khoản này")
      return
    }

    if (selectedChannel === "google_form") {
      setIsConnecting(true)
      try {
        const queryParams = new URLSearchParams({
          name: accountName.trim(),
          ...(targetAccountId ? { accountId: targetAccountId } : {}),
        })
        const res = await apiClient.get<{ url: string }>(
          `/recruitment/oauth/google/auth-url?${queryParams.toString()}`,
        )
        if (res.data?.url) {
          const authUrl = encodeURI(res.data.url)
          const parsed = new URL(authUrl)
          if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            window.location.assign(authUrl)
          } else {
            toast.error("Đường dẫn đăng nhập Google không hợp lệ")
            setIsConnecting(false)
          }
        } else {
          toast.error("Không lấy được đường dẫn đăng nhập Google")
          setIsConnecting(false)
        }
      } catch {
        toast.error("Lỗi khi kết nối dịch vụ Google OAuth")
        setIsConnecting(false)
      }
    } else {
      toast.info(
        `Kênh ${POSTING_CHANNELS.find((c) => c.value === selectedChannel)?.label || selectedChannel} hiện chưa hỗ trợ OAuth tự động`,
      )
      setIsConnectModalOpen(false)
    }
  }, [accountName, selectedChannel, targetAccountId])

  const handleDelete = useCallback(
    async (id: string, name?: string) => {
      const isConfirmed = await confirm({
        title: "Hủy liên kết tài khoản",
        description: `Bạn có chắc muốn hủy liên kết tài khoản "${name || id}"? Các biểu mẫu hay tác vụ đồng bộ liên quan có thể bị ảnh hưởng.`,
        confirmText: "Hủy liên kết",
        cancelText: "Giữ lại",
        variant: "destructive",
      })

      if (isConfirmed) {
        deleteMutation.mutate(id)
      }
    },
    [confirm, deleteMutation],
  )

  const handleSearch = useCallback((val: string) => {
    setKeyword(val)
    setPage(1)
  }, [])

  const handleChannelFilterChange = useCallback((val: string) => {
    setChannelFilter(val)
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
        count: tabCounts[tab.id] ?? 0,
      })),
      activeTab,
      onTabChange: (id: string) => {
        setActiveTab(id)
        setPage(1)
      },
    }),
    [activeTab, tabCounts],
  )

  const paginatedAccounts: OAuthAccount[] = useMemo(() => {
    return filteredAccounts.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredAccounts, page, pageSize])

  return {
    accounts: paginatedAccounts,
    totalAccounts: filteredAccounts.length,
    isLoading,
    activeTab,
    keyword,
    channelFilter,
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    handleSearch,
    handleChannelFilterChange,
    handleResetFilters,
    hasActiveFilters,
    tabsConfig,
    isConnectModalOpen,
    setIsConnectModalOpen,
    selectedChannel,
    setSelectedChannel,
    accountName,
    setAccountName,
    isConnecting,
    handleOpenConnect,
    handleStartOAuth,
    handleDelete,
  }
}
