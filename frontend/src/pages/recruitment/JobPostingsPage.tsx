import { type DataTableColumn, DataTablePage, StatusPill } from "@/components/common"
import { CreateJobPostingDialog } from "@/components/features/recruitment/create-job-posting-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import {
  useJobPostings,
  usePublishJobPosting,
  useRequisitions,
  useSyncJobPosting,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { JobPosting } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { ExternalLink, Eye, FileSpreadsheet, Plus, RefreshCw, Share2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

const channelLabel = (value: string) =>
  POSTING_CHANNELS.find((item) => item.value === value)?.label ?? value

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "open", label: "Đang mở" },
  { id: "closed", label: "Đã đóng" },
  { id: "draft", label: "Nháp" },
]

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

function PostingActions({
  posting,
  onOpenWorkspace,
}: {
  posting: JobPosting
  onOpenWorkspace: () => void
}) {
  const publish = usePublishJobPosting()
  const sync = useSyncJobPosting()
  const { hasPermission } = usePermission()
  const isGoogleForm = posting.channel === "google_form"

  const canPublish =
    hasPermission("recruitment.posting.manage") &&
    isGoogleForm &&
    posting.status === "draft" &&
    !posting.postingUrl
  const canSync =
    hasPermission("recruitment.intake.manage") &&
    isGoogleForm &&
    posting.connectorStatus === "ready" &&
    posting.status === "open"

  return (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
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
          onClick={() => {
            publish.mutate({ id: posting.id, mode: "connector" })
          }}
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
              onClick={() => {
                sync.mutate(posting.id)
              }}
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

export default function JobPostingsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [initialRequisitionId, setInitialRequisitionId] = useState<string | undefined>(
    params.get("reqId") ?? undefined,
  )

  const handleOpenWorkspace = (posting: JobPosting) => {
    sessionStorage.setItem("activeJobPostingId", posting.id)
    navigate(`/recruitment/job-postings/${posting.id}/overview`)
  }

  const { hasPermission } = usePermission()
  const { data: requisitionsData } = useRequisitions({ status: "approved" })
  const requisitions = requisitionsData?.data ?? []
  const { data: postings = [], isLoading } = useJobPostings()

  const tabCounts = useMemo(() => {
    const counts: Record<string, number | undefined> = { all: postings.length }
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

  const columns: DataTableColumn<JobPosting>[] = useMemo(
    () => [
      {
        id: "requisition",
        header: "Bài đăng / Vị trí",
        minWidth: "260px",
        sticky: true,
        cell: (posting) => (
          <div
            className="cursor-pointer group"
            onClick={() => {
              handleOpenWorkspace(posting)
            }}
          >
            <p className="font-medium text-foreground group-hover:text-primary group-hover:underline transition-colors truncate">
              {posting.requisition?.title ?? "N/A"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="font-mono text-primary font-medium">
                {posting.requisition?.code ?? "—"}
              </span>
              {" · "}
              {posting.requisition?.department || "Chưa có phòng ban"}
            </p>
          </div>
        ),
      },
      {
        id: "channel",
        header: "Kênh",
        minWidth: "180px",
        cell: (posting) => (
          <div>
            <span className="text-sm font-medium text-foreground">
              {channelLabel(posting.channel)}
            </span>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{posting.sourceCode}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        minWidth: "120px",
        cell: (posting) => (
          <StatusPill
            label={
              posting.status === "open"
                ? "Đang mở"
                : posting.status === "closed"
                  ? "Đã đóng"
                  : "Nháp"
            }
            variant={
              posting.status === "open"
                ? "success"
                : posting.status === "closed"
                  ? "danger"
                  : "neutral"
            }
          />
        ),
      },
      {
        id: "connector",
        header: "Kết nối",
        minWidth: "140px",
        cell: (posting) => <ConnectorStatus posting={posting} />,
      },
      {
        id: "actions",
        header: "",
        width: "120px",
        align: "right",
        cell: (posting) => (
          <PostingActions
            posting={posting}
            onOpenWorkspace={() => {
              handleOpenWorkspace(posting)
            }}
          />
        ),
      },
    ],
    [navigate],
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

  return (
    <>
      <DataTablePage<JobPosting>
        title="Bài đăng tuyển dụng"
        description="Tạo và quản lý bài đăng tuyển dụng trên các kênh (Google Form, LinkedIn, Facebook, v.v.)"
        variant="viewport"
        data={visible}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(posting) => posting.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm kiếm theo tiêu đề, mã yêu cầu, phòng ban...",
        }}
        primaryAction={
          hasPermission("recruitment.posting.manage") ? (
            <Button
              className="rounded-full font-semibold gap-1.5"
              onClick={() => {
                handleOpenCreate()
              }}
            >
              <Plus className="h-4 w-4" />
              Tạo bài đăng
            </Button>
          ) : undefined
        }
        emptyState={{
          icon: Share2,
          title:
            keyword || activeTab !== "all"
              ? "Không tìm thấy bài đăng"
              : "Chưa có bài đăng tuyển dụng",
          description:
            keyword || activeTab !== "all"
              ? "Không có bài đăng tuyển dụng nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm."
              : "Hiện tại chưa có bài đăng tuyển dụng nào được tạo. Hãy bấm 'Tạo bài đăng' để bắt đầu.",
        }}
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
          totalItems: filtered.length,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (value) => {
            setPageSize(value)
            setPage(1)
          },
        }}
      />

      <CreateJobPostingDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialRequisitionId={initialRequisitionId}
        jobRequisitions={requisitions}
      />
    </>
  )
}
