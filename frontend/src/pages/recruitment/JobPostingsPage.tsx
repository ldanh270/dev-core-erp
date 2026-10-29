import { useMemo, useState } from "react"
import { ExternalLink, Eye, FileSpreadsheet, Plus, RefreshCw, Share2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AppPagination, DataTableToolbar, EmptyState, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateJobPostingDialog } from "@/components/features/recruitment/create-job-posting-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useJobPostings, usePublishJobPosting, useRequisitions, useSyncJobPosting } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import type { JobPosting } from "@/types/recruitment.types"

const channelLabel = (value: string) => POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "open", label: "Đang mở" },
  { id: "closed", label: "Đã đóng" },
  { id: "draft", label: "Nháp" },
]

export default function JobPostingsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [initialRequisitionId, setInitialRequisitionId] = useState<string | undefined>(params.get("reqId") ?? undefined)

  const handleOpenWorkspace = (posting: JobPosting) => {
    sessionStorage.setItem("activeJobPostingId", posting.id)
    navigate(`/recruitment/job-postings/${posting.id}/overview`)
  }

  const { hasPermission } = usePermission()
  const { data: requisitionsData } = useRequisitions({ status: "approved" })
  const requisitions = requisitionsData?.data ?? []
  const { data: postings = [], isLoading } = useJobPostings()

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: postings.length }
    for (const p of postings) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  }, [postings])

  const filtered = useMemo(() => {
    return postings.filter((posting) => {
      if (activeTab !== "all" && posting.status !== activeTab) return false

      const searchStr = keyword.toLowerCase()
      const title = posting.requisition?.title?.toLowerCase() ?? ""
      const code = posting.requisition?.code?.toLowerCase() ?? ""
      const dept = posting.requisition?.department?.toLowerCase() ?? ""

      return title.includes(searchStr) || code.includes(searchStr) || dept.includes(searchStr)
    })
  }, [postings, activeTab, keyword])

  const visible = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize)
  }, [filtered, page, pageSize])

  const handleOpenCreate = (reqId?: string) => {
    setInitialRequisitionId(reqId)
    setCreateModalOpen(true)
  }

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Bài đăng tuyển dụng"
        description="Tạo và quản lý bài đăng tuyển dụng trên các kênh (Google Form, LinkedIn, Facebook, v.v.)"
        actions={
          hasPermission("recruitment.posting.manage") ? (
            <Button className="rounded-full font-semibold gap-1.5" onClick={() => { handleOpenCreate(); }}>
              <Plus className="h-4 w-4" />
              Tạo bài đăng
            </Button>
          ) : undefined
        }
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <div className="flex border-b border-border bg-card px-4 pt-3 gap-1 overflow-x-auto">
          {TAB_DEFINITIONS.map((tab) => {
            const count = tabCounts[tab.id] ?? 0
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    isActive ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(val) => {
            setKeyword(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm theo vị trí, mã yêu cầu, phòng ban..."
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-64 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Bài đăng / Vị trí</TableHead>
                <TableHead className="w-48 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kênh</TableHead>
                <TableHead className="w-32 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kết nối</TableHead>
                <TableHead className="w-44 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <EmptyState
                      icon={Share2}
                      title={keyword || activeTab !== "all" ? "Không tìm thấy bài đăng" : "Chưa có bài đăng tuyển dụng"}
                      description={
                        keyword || activeTab !== "all"
                          ? "Không có bài đăng tuyển dụng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm."
                          : "Hiện tại chưa có bài đăng tuyển dụng nào được tạo. Hãy bấm 'Tạo bài đăng' để bắt đầu."
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((posting) => {
                  return (
                    <TableRow
                      key={posting.id}
                      tabIndex={0}
                      aria-label={`Mở bài đăng ${posting.requisition?.title ?? posting.sourceCode}`}
                      onClick={() => { handleOpenWorkspace(posting); }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          handleOpenWorkspace(posting)
                        }
                      }}
                      className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
                    >
                      <TableCell className="px-4 py-3">
                        <p className="font-medium text-foreground">{posting.requisition?.title ?? "N/A"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono text-primary font-medium">{posting.requisition?.code ?? "—"}</span>
                          {" · "}
                          {posting.requisition?.department || "Chưa có phòng ban"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-medium">{channelLabel(posting.channel)}</span>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{posting.sourceCode}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusPill
                          label={posting.status === "open" ? "Đang mở" : posting.status === "closed" ? "Đã đóng" : "Nháp"}
                          variant={posting.status === "open" ? "success" : posting.status === "closed" ? "danger" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <ConnectorStatus posting={posting} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <PostingActions posting={posting} onOpenWorkspace={() => { handleOpenWorkspace(posting); }} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <AppPagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
          onPageChange={setPage}
          totalItems={filtered.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(value) => { setPageSize(value); setPage(1) }}
        />
      </PageCard>

      <CreateJobPostingDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialRequisitionId={initialRequisitionId}
        jobRequisitions={requisitions}
      />
    </div>
  )
}

function ConnectorStatus({ posting }: { posting: JobPosting }) {
  const isGoogleForm = posting.channel === "google_form"
  if (!isGoogleForm) return <span className="text-sm text-muted-foreground">—</span>

  if (posting.connectorStatus === "ready") {
    return <StatusPill label="Sẵn sàng" variant="success" />
  } else if (posting.connectorStatus === "error") {
    return <StatusPill label="Lỗi kết nối" variant="danger" />
  }
  return <StatusPill label="Chưa cấu hình" variant="warning" />
}

function PostingActions({ posting, onOpenWorkspace }: { posting: JobPosting; onOpenWorkspace: () => void }) {
  const publish = usePublishJobPosting()
  const sync = useSyncJobPosting()
  const { hasPermission } = usePermission()
  const isGoogleForm = posting.channel === "google_form"

  const canPublish = hasPermission("recruitment.posting.manage") && isGoogleForm && posting.status === "draft" && !posting.postingUrl
  const canSync = hasPermission("recruitment.intake.manage") && isGoogleForm && posting.connectorStatus === "ready" && posting.status === "open"

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Mở workspace ${posting.requisition?.title ?? posting.sourceCode}`}
            onClick={onOpenWorkspace}
            className="rounded-full h-8 w-8 p-0 hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xem chi tiết bài đăng</TooltipContent>
      </Tooltip>
      {posting.postingUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={posting.postingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 h-8 text-xs font-medium text-primary border border-border rounded-full hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Mở form
            </a>
          </TooltipTrigger>
          <TooltipContent>Xem form ứng tuyển công khai</TooltipContent>
        </Tooltip>
      )}
      {canPublish && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => publish.mutate({ id: posting.id, mode: "connector" })}
          disabled={publish.isPending}
          className="rounded-full h-8 text-xs gap-1.5"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Public
        </Button>
      )}
      {canSync && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => sync.mutate(posting.id)}
              disabled={sync.isPending}
              className="rounded-full h-8 w-8 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đồng bộ dữ liệu ứng viên</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
