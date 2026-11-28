import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import type { RecruitmentPostingActivity } from "@/types/recruitment.types"

import { Archive } from "lucide-react"

interface JobPostingActivityResponse {
  id: string
  applicationId: string | null
  errorMessage: string | null
  responseData: Record<string, string> | null
}

interface JobPostingActivityTabProps {
  activities: RecruitmentPostingActivity[]
  invalidResponses: JobPostingActivityResponse[]
  onArchive: () => void
  isArchiving: boolean
}

/**
 * Formats underscore-delimited activity event names into title case.
 */
function formatActivity(type: string): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/**
 * Extracts descriptive text from JSON activity metadata.
 */
function getMetadataMessage(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || typeof metadata !== "object") return ""
  if (typeof metadata.message === "string") return metadata.message
  if (typeof metadata.name === "string") return metadata.name
  if (typeof metadata.code === "string") return metadata.code
  return ""
}

/**
 * Extracts candidate email identifier from response payload dictionaries.
 */
function getResponseEmail(data: Record<string, string> | null): string {
  if (!data) return "Không có email"
  return data.email || data.email_address || "Không có email"
}

/**
 * Pure UI presentational tab presenting activity logs, sync audit trails,
 * invalid external form submissions, and archive actions for a job posting.
 */
export function JobPostingActivityTab({
  activities,
  invalidResponses,
  onArchive,
  isArchiving,
}: JobPostingActivityTabProps) {
  return (
    <PageCard className="space-y-4">
      <div>
        <p className="font-semibold text-foreground">Hoạt động bài đăng</p>
        <p className="text-xs text-muted-foreground">
          Lịch sử pipeline, ứng viên và đồng bộ Google Form.
        </p>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const metaMsg = getMetadataMessage(activity.metadata as Record<string, unknown> | null)
          return (
            <div key={activity.id} className="border-b border-border pb-3 text-sm last:border-0">
              <p className="font-medium text-foreground">
                {activity.actor?.fullName ?? "Hệ thống"} · {formatActivity(activity.type)}
              </p>
              {metaMsg && <p className="mt-1 text-xs text-muted-foreground">{metaMsg}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          )
        })}
      </div>

      {invalidResponses.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="font-semibold text-foreground">Lỗi đồng bộ ({invalidResponses.length})</p>
          {invalidResponses.map((response) => (
            <div
              key={response.id}
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs"
            >
              <p className="font-medium text-destructive">
                {response.errorMessage ?? "Dữ liệu Form không hợp lệ"}
              </p>
              <p className="mt-1 text-muted-foreground">{getResponseEmail(response.responseData)}</p>
            </div>
          ))}
        </div>
      )}

      {activities.length === 0 && invalidResponses.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>
      )}

      <div className="pt-2">
        <Button
          variant="ghost"
          className="rounded-full text-destructive"
          disabled={isArchiving}
          onClick={onArchive}
        >
          <Archive className="mr-2 h-4 w-4" />
          Lưu trữ bài đăng
        </Button>
      </div>
    </PageCard>
  )
}
