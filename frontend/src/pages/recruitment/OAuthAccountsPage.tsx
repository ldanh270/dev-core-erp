import {
  DataTablePage,
  StatusPill,
  useConfirm,
  type DataTableColumn,
} from "@/components/common"
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
      if (
        activeTab === "other" &&
        ["google_form", "linkedin", "facebook"].includes(acc.channel)
      ) {
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

  const handleResetFilters = () => {
    setActiveTab("all")
    setChannelFilter("all")
    setKeyword("")
    setPage(1)
  }

  const hasActiveFilters = activeTab !== "all" || channelFilter !== "all" || keyword.trim() !== ""

  const handleOpenConnect = (channel?: string, accountId?: string) => {
    setSelectedChannel(channel || "google_form")
    setTargetAccountId(accountId || null)
    setAccountName("")
    setIsConnectModalOpen(true)
  }

  const handleStartOAuth = async () => {
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
          window.location.href = res.data.url
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
  }

  const handleDelete = async (id: string, name?: string) => {
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
  }

  const getChannelLabel = (channel: string) => {
    return POSTING_CHANNELS.find((ch) => ch.value === channel)?.label || channel
  }

  const columns: DataTableColumn<(typeof accounts)[0]>[] = useMemo(
    () => [
      {
        id: "account",
        header: "Tên tài khoản / Mã ID",
        minWidth: "260px",
        sticky: true,
        cell: (account) => (
          <div className="flex items-center gap-2.5">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-foreground text-sm truncate">
                {account.name || "Default Account"}
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-0.5 truncate">
                ID: {account.id}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "channel",
        header: "Kênh tuyển dụng",
        minWidth: "160px",
        cell: (account) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
            {getChannelLabel(account.channel)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        minWidth: "140px",
        cell: (account) => {
          const isConnected = account.hasRefreshToken
          return (
            <StatusPill
              label={isConnected ? "Đã kết nối" : "Chưa xác thực"}
              variant={isConnected ? "success" : "warning"}
            />
          )
        },
      },
      {
        id: "createdAt",
        header: "Ngày kết nối",
        minWidth: "160px",
        hideBelow: "md",
        cell: (account) => (
          <span className="text-xs text-muted-foreground">
            {new Date(account.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "140px",
        align: "right",
        cell: (account) => {
          const isConnected = account.hasRefreshToken
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => { e.stopPropagation(); }}
            >
              {!isConnected && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { handleOpenConnect(account.channel, account.id); }}
                      className="h-8 px-2.5 text-xs rounded-full gap-1 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Xác thực lại
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cấp lại quyền OAuth cho tài khoản này</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id, account.name)}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hủy liên kết tài khoản</TooltipContent>
              </Tooltip>
            </div>
          )
        },
      },
    ],
    [confirm, deleteMutation],
  )

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

  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredAccounts, page, pageSize])

  return (
    <>
      <DataTablePage<(typeof accounts)[0]>
        title="Tài khoản liên kết OAuth"
        description="Quản lý và cấp quyền các tài khoản mạng xã hội và Google để tự động hóa tuyển dụng"
        variant="viewport"
        data={paginatedAccounts}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(acc) => acc.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm theo tên tài khoản, loại kênh...",
        }}
        primaryAction={{
          label: "Kết nối tài khoản",
          icon: Plus,
          onClick: () => { handleOpenConnect(); },
        }}
        filters={
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <Select
              value={channelFilter}
              onValueChange={(val) => {
                setChannelFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[160px] text-sm font-semibold bg-background rounded-full">
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-10 px-4 text-sm font-semibold gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Xóa lọc
              </Button>
            )}
          </div>
        }
        emptyState={{
          icon: Link2,
          title: hasActiveFilters
            ? "Không tìm thấy tài khoản OAuth nào phù hợp với bộ lọc"
            : "Chưa có tài khoản OAuth nào được liên kết",
          description: hasActiveFilters
            ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc kênh khác."
            : "Nhấn nút 'Kết nối tài khoản' phía trên để bắt đầu liên kết.",
        }}
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filteredAccounts.length / pageSize)),
          totalItems: filteredAccounts.length,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (val) => {
            setPageSize(val)
            setPage(1)
          },
        }}
      />

      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Kết nối tài khoản kênh mới</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Đăng nhập ủy quyền qua OAuth2 để hệ thống tự động xuất bản tin hoặc đồng bộ hồ sơ ứng
              viên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kênh ứng tuyển</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-full h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Chọn kênh" />
                </SelectTrigger>
                <SelectContent>
                  {POSTING_CHANNELS.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value}>
                      {ch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Tên nhận diện tài khoản <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ví dụ: Google HR Team, LinkedIn Tuyển dụng..."
                value={accountName}
                onChange={(e) => { setAccountName(e.target.value); }}
                className="h-10 text-xs rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Đặt tên giúp bạn phân biệt nếu liên kết nhiều tài khoản trong cùng một kênh.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setIsConnectModalOpen(false); }}
              disabled={isConnecting}
              className="rounded-full h-9 text-xs"
            >
              Hủy
            </Button>
            <Button
              onClick={handleStartOAuth}
              disabled={isConnecting}
              className="rounded-full h-9 text-xs gap-1.5 font-semibold"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Đang chuyển hướng...
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Tiếp tục đăng nhập
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
