import { AppPagination, DataTableToolbar, PageCard, PageContainer, PageHeader, useConfirm } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import {
  useDeleteOAuthAccount,
  useOAuthAccounts,
} from "@/hooks/recruitment/use-recruitment-queries"
import apiClient from "@/lib/api-client"

import { useEffect, useMemo, useState } from "react"

import { Filter, Link2, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "google_form", label: "Google Form" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "other", label: "Kênh khác" },
]

export default function OAuthAccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: accounts = [], isLoading } = useOAuthAccounts()
  const deleteMutation = useDeleteOAuthAccount()
  const confirm = useConfirm()

  // State filtering & toolbar
  const [activeTab, setActiveTab] = useState<string>("all")
  const [keyword, setKeyword] = useState<string>("")
  const [channelFilter, setChannelFilter] = useState<string>("all")

  // State pagination
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // State connect modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>("google_form")
  const [accountName, setAccountName] = useState<string>("")
  const [targetAccountId, setTargetAccountId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Handle OAuth callback searchParams
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

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Tab filter
      if (activeTab === "google_form" && acc.channel !== "google_form") return false
      if (activeTab === "linkedin" && acc.channel !== "linkedin") return false
      if (activeTab === "facebook" && acc.channel !== "facebook") return false
      if (
        activeTab === "other" &&
        ["google_form", "linkedin", "facebook"].includes(acc.channel)
      ) {
        return false
      }

      // Dropdown channel filter
      if (channelFilter !== "all" && acc.channel !== channelFilter) return false

      // Keyword search
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const channelObj = POSTING_CHANNELS.find((c) => c.value === acc.channel)
        const channelLabel = channelObj?.label.toLowerCase() || ""
        const matchName = acc.name.toLowerCase().includes(q)
        const matchChannel = channelLabel.includes(q)
        if (!matchName && !matchChannel) return false
      }

      return true
    })
  }, [accounts, activeTab, channelFilter, keyword])

  // Tab counts
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

  // Pagination slice
  const totalItems = filteredAccounts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedAccounts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, page, pageSize])

  const hasActiveFilters = keyword.trim() !== "" || channelFilter !== "all"

  const handleResetFilters = () => {
    setKeyword("")
    setChannelFilter("all")
    setPage(1)
  }

  const handleStartOAuthConnect = async () => {
    if (selectedChannel !== "google_form") {
      toast.info("Hiện tại hệ thống chỉ mới hỗ trợ kết nối qua Google Form.")
      return
    }

    const nameToUse = accountName.trim() || "Google Form Account"
    setIsConnecting(true)

    try {
      const response = await apiClient.get<{ data: { authUrl: string } }>(
        "/recruitment/oauth/google/connect",
        {
          params: {
            channel: selectedChannel,
            name: nameToUse,
            accountId: targetAccountId || undefined,
          },
        },
      )
      window.location.assign(response.data.data.authUrl)
    } catch {
      toast.error("Không thể khởi tạo OAuth. Vui lòng kiểm tra lại cấu hình hệ thống.")
      setIsConnecting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Ngắt kết nối tài khoản?",
      description: `Tài khoản "${name}" sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.`,
      confirmText: "Xóa tài khoản",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (isConfirmed) {
      deleteMutation.mutate(id)
    }
  }

  const getChannelLabel = (channelValue: string) => {
    const found = POSTING_CHANNELS.find((c) => c.value === channelValue)
    return found ? found.label : channelValue
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      {/* Page Header with Action Button */}
      <PageHeader
        title="Tài khoản OAuth"
        description="Quản lý danh sách các tài khoản OAuth đã liên kết để đăng bài tuyển dụng tự động lên các kênh."
        actions={
          <Button
            size="sm"
            className="rounded-full px-4 h-9 gap-1.5 text-xs font-medium shadow-xs"
            onClick={() => {
              setTargetAccountId(null)
              setAccountName("")
              setSelectedChannel("google_form")
              setIsConnectModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Kết nối tài khoản
          </Button>
        }
      />

      {/* Main Card Container */}
      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <nav
          aria-label="Lọc theo kênh tuyển dụng"
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id] || 0
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Toolbar */}
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(value) => {
            setKeyword(value)
            setPage(1)
          }}
          searchPlaceholder="Tìm theo tên tài khoản, loại kênh..."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                <Select
                  value={channelFilter}
                  onValueChange={(val) => {
                    setChannelFilter(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="w-[170px] h-9 text-xs bg-background rounded-full">
                    <SelectValue placeholder="Lọc theo kênh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả kênh</SelectItem>
                    {POSTING_CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-9 px-3 text-xs gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Xóa lọc
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Đặt lại tất cả bộ lọc</TooltipContent>
                </Tooltip>
              )}
            </div>
          }
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-56 px-4 py-2">
                  Tên tài khoản / Mã ID
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-44 px-4 py-2">
                  Kênh tuyển dụng
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-36 px-4 py-2">
                  Trạng thái
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell w-44 px-4 py-2">
                  Ngày kết nối
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-36 px-4 py-2 text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                      <div className="rounded-full bg-muted/60 p-3">
                        <Link2 className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {hasActiveFilters
                          ? "Không tìm thấy tài khoản OAuth nào phù hợp với bộ lọc"
                          : "Chưa có tài khoản OAuth nào được liên kết"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc kênh khác."
                          : "Nhấn nút \"Kết nối tài khoản\" phía trên để bắt đầu liên kết."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAccounts.map((account) => {
                  const isConnected = account.hasRefreshToken
                  return (
                    <TableRow
                      key={account.id}
                      className="transition-colors duration-100 hover:bg-muted/25"
                    >
                      {/* Name & Subtext */}
                      <TableCell className="h-[60px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <div className="font-medium text-foreground text-sm">
                              {account.name || "Default Account"}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground mt-0.5">
                              ID: {account.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Channel Badge */}
                      <TableCell className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                          {getChannelLabel(account.channel)}
                        </span>
                      </TableCell>

                      {/* Status Pill */}
                      <TableCell className="h-[60px] px-4 py-3">
                        <StatusPill
                          label={isConnected ? "Đã kết nối" : "Chưa xác thực"}
                          variant={isConnected ? "success" : "warning"}
                        />
                      </TableCell>

                      {/* Created At */}
                      <TableCell className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground">
                        {new Date(account.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="h-[60px] px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {account.channel === "google_form" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full hover:bg-muted"
                                  onClick={() => {
                                    setTargetAccountId(account.id)
                                    setAccountName(account.name)
                                    setSelectedChannel(account.channel)
                                    setIsConnectModalOpen(true)
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xác thực / Kết nối lại</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                onClick={() => handleDelete(account.id, account.name)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ngắt kết nối & Xóa</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination */}
        <AppPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>


      {/* Modal / Dialog Connect OAuth Account */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Kết nối tài khoản OAuth</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Chọn kênh đăng tin tuyển dụng và nhập tên gợi nhớ cho tài khoản OAuth mới.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="account-name" className="text-xs font-medium">
                Tên gợi nhớ tài khoản <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-name"
                placeholder="VD: Google Form - Tuyển Dụng Công Nghệ"
                value={accountName}
                onChange={(e) => { setAccountName(e.target.value); }}
                className="rounded-full text-xs h-9"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="posting-channel" className="text-xs font-medium">
                Kênh kết nối <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger id="posting-channel" className="rounded-full text-xs h-9">
                  <SelectValue placeholder="Chọn kênh" />
                </SelectTrigger>
                <SelectContent>
                  {POSTING_CHANNELS.map((ch) => (
                    <SelectItem
                      key={ch.value}
                      value={ch.value}
                      disabled={ch.value !== "google_form"}
                    >
                      {ch.label} {ch.value !== "google_form" && "(Sắp hỗ trợ)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => { setIsConnectModalOpen(false); }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full text-xs font-medium"
              onClick={handleStartOAuthConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Đang chuyển hướng..." : "Xác thực & Kết nối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
