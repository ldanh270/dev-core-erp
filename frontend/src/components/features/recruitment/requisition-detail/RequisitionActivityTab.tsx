import { PageCard } from "@/components/common"

interface ActivityItem {
  id: string
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: { fullName: string } | null
}

interface RequisitionActivityTabProps {
  activities: ActivityItem[]
}

/**
 * Parses dynamic JSON activity metadata safely into a human-readable log string.
 */
function getMetadataMessage(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || typeof metadata !== "object") return ""
  if (typeof metadata.message === "string") return metadata.message
  if (typeof metadata.name === "string") return metadata.name
  if (typeof metadata.code === "string") return metadata.code
  return ""
}

/**
 * Pure UI presentational tab rendering audit trail and lifecycle logs
 * for a specific job requisition across candidate moves, rounds, and postings.
 */
export function RequisitionActivityTab({ activities }: RequisitionActivityTabProps) {
  return (
    <PageCard>
      <h2 className="font-semibold text-foreground">Hoạt động yêu cầu tuyển dụng</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Lịch sử pipeline, ứng viên và đồng bộ từ tất cả bài đăng.
      </p>
      <div className="mt-5 space-y-3">
        {activities.map((activity) => {
          const metaMsg = getMetadataMessage(activity.metadata)
          return (
            <div key={activity.id} className="border-b border-border pb-3 text-sm last:border-0">
              <p className="font-medium text-foreground">
                {activity.actor?.fullName ?? "Hệ thống"} · {activity.type.replaceAll("_", " ")}
              </p>
              {metaMsg && <p className="mt-1 text-xs text-muted-foreground">{metaMsg}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          )
        })}
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>
        )}
      </div>
    </PageCard>
  )
}
