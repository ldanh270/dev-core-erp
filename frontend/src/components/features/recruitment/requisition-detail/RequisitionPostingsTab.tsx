import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import type { JobPosting } from "@/types/recruitment.types"

import { ExternalLink, FileSpreadsheet, RefreshCw } from "lucide-react"

interface RequisitionPostingsTabProps {
  postings: JobPosting[]
  onPublish: (id: string) => void
  publishing: boolean
  canPublish: boolean
  onSync: (id: string) => void
  syncing: boolean
  canSync: boolean
  onOpen: (id: string) => void
}

export function RequisitionPostingsTab({
  postings,
  onPublish,
  publishing,
  canPublish,
  onSync,
  syncing,
  canSync,
  onOpen,
}: RequisitionPostingsTabProps) {
  return (
    <PageCard padding="sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Các bài đăng thuộc yêu cầu</h2>
          <p className="text-xs text-muted-foreground">
            Mỗi bài đăng là một nguồn tiếp nhận ứng viên.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{postings.length} bài đăng</span>
      </div>
      <div className="space-y-3">
        {postings.map((posting) => {
          const statusLabel =
            posting.status === "open"
              ? "Đang mở"
              : posting.status === "archived"
                ? "Đã lưu trữ"
                : "Nháp"
          const statusVariant = posting.status === "open" ? "success" : "neutral"

          return (
            <div
              key={posting.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {posting.source === "google_form" ? "Google Form" : posting.source}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{posting.sourceCode}</p>
                <StatusPill label={statusLabel} variant={statusVariant} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onOpen(posting.id)}
                >
                  <ExternalLink className="mr-2 size-4" />
                  Chi tiết
                </Button>
                {posting.status === "draft" && posting.channel === "google_form" && canPublish && (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onPublish(posting.id)}
                    disabled={publishing}
                  >
                    <FileSpreadsheet className="mr-2 size-4" />
                    {publishing ? "Đang xuất bản" : "Xuất bản Form"}
                  </Button>
                )}
                {posting.postingUrl && (
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={posting.postingUrl} target="_blank" rel="noreferrer">
                      Mở form
                    </a>
                  </Button>
                )}
                {posting.status === "open" && posting.connectorStatus === "ready" && canSync && (
                  <Button
                    className="rounded-full"
                    onClick={() => onSync(posting.id)}
                    disabled={syncing}
                  >
                    <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
                    Đồng bộ
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        {postings.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Chưa có bài đăng. Tạo bài đăng để bắt đầu nhận ứng viên.
          </p>
        )}
      </div>
    </PageCard>
  )
}
