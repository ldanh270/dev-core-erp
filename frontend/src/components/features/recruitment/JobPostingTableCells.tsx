import { StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  usePublishJobPosting,
  useSyncJobPosting,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { JobPosting } from "@/types/recruitment.types"

import { ExternalLink, Eye, FileSpreadsheet, RefreshCw } from "lucide-react"

/**
 * Pure UI presenter rendering connector health pills for third-party recruitment channels.
 */
export function ConnectorStatus({ posting }: { posting: JobPosting }) {
  const isGoogleForm = posting.channel === "google_form"
  if (!isGoogleForm) return <span className="text-sm text-muted-foreground">—</span>

  if (posting.connectorStatus === "ready") {
    return <StatusPill label="Sẵn sàng" variant="success" />
  } else if (posting.connectorStatus === "error") {
    return <StatusPill label="Lỗi kết nối" variant="danger" />
  }
  return <StatusPill label="Chưa cấu hình" variant="warning" />
}

/**
 * Presentational action buttons in table rows for publishing, syncing, and opening job postings.
 */
export function PostingActions({
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
            className="rounded-full h-8 w-8 p-0 hover:bg-muted cursor-pointer"
          >
            <Eye className="size-3.5" />
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
              <ExternalLink className="size-3.5" />
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
          className="rounded-full h-8 text-xs gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="size-3.5" />
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
              className="rounded-full h-8 w-8 p-0 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đồng bộ dữ liệu ứng viên</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
