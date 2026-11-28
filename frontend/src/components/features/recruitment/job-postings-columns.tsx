import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { getPostingChannelLabel } from "@/hooks/recruitment/use-job-postings-management"
import type { JobPosting } from "@/types/recruitment.types"

import { ConnectorStatus, PostingActions } from "./JobPostingTableCells"

/**
 * Factory function defining data table column schema for job postings.
 */
export function getJobPostingsColumns(
  onOpenWorkspace: (posting: JobPosting) => void,
): DataTableColumn<JobPosting>[] {
  return [
    {
      id: "requisition",
      header: "Vị trí tuyển dụng",
      width: getTableColWidthPx("TITLE"),
      minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
      sticky: true,
      cell: (posting) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground text-sm">
            {posting.requisition?.title ?? "Chưa liên kết YCTD"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {posting.requisition?.code ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Kênh đăng tin",
      width: getTableColWidthPx("TYPE"),
      minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
      cell: (posting) => (
        <span className="font-medium text-sm text-foreground">
          {getPostingChannelLabel(posting.channel)}
        </span>
      ),
    },
    {
      id: "connector",
      header: "Kết nối Form",
      width: getTableColWidthPx("STATUS"),
      minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
      align: "center",
      cell: (posting) => <ConnectorStatus posting={posting} />,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: getTableColWidthPx("STATUS"),
      minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
      align: "center",
      cell: (posting) => (
        <StatusPill
          label={
            posting.status === "open" ? "Đang mở" : posting.status === "closed" ? "Đã đóng" : "Nháp"
          }
          variant={
            posting.status === "open"
              ? "success"
              : posting.status === "closed"
                ? "neutral"
                : "warning"
          }
        />
      ),
    },
    {
      id: "dates",
      header: "Thời gian đăng",
      width: getTableColWidthPx("DATE"),
      minWidth: `${TABLE_COL_WIDTH.DATE}px`,
      cell: (posting) => {
        if (!posting.publishedAt) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <div className="text-xs flex flex-col gap-0.5">
            <span>{new Date(posting.publishedAt).toLocaleDateString("vi-VN")}</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      width: getTableColWidthPx("TITLE"),
      minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
      align: "right",
      sticky: true,
      cell: (posting) => (
        <PostingActions
          posting={posting}
          onOpenWorkspace={() => {
            onOpenWorkspace(posting)
          }}
        />
      ),
    },
  ]
}
