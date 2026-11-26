import { PageCard, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SPENT_TIME_STATUS, getSpentTimeStatusLabel } from "@/config/entities/project.config"
import { SPENT_TIME_UI, getSpentTimeStatusPillVariant } from "@/config/rules/spent-time.config"
import type { SpentTime } from "@/types/spent-time.types"

import { Check, Clock, Edit, History, Trash2, X } from "lucide-react"

interface TaskDetailSpentTimeCardProps {
  spentTimes?: SpentTime[]
  isLoadingSpent: boolean
  totalSpentHours: number
  currentUserId?: string
  isAdminOrGM: boolean
  canApproveSpentTime: boolean
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onEdit: (item: SpentTime) => void
  onDelete: (id: string) => void
}

function formatActivity(act: string) {
  if (act === "develop") return "Phát triển (Develop)"
  if (act === "design") return "Thiết kế (Design)"
  if (act === "test") return "Kiểm thử (Test)"
  if (act === "manage") return "Quản lý (Manage)"
  if (act === "other") return "Khác (Other)"
  return act
}

/** Summary card displaying logged hours, budget progress, and time logs for a task. */
export function TaskDetailSpentTimeCard({
  spentTimes,
  isLoadingSpent,
  totalSpentHours,
  currentUserId,
  isAdminOrGM,
  canApproveSpentTime,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: TaskDetailSpentTimeCardProps) {
  return (
    <PageCard className="p-6">
      <h3 className="mb-4 flex items-center justify-between border-b border-border pb-2 text-base font-bold text-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4 text-muted-foreground" />
          {SPENT_TIME_UI.TASK_SECTION_TITLE}
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
          {totalSpentHours.toFixed(1)} {SPENT_TIME_UI.TASK_HOURS_SUFFIX}
        </span>
      </h3>

      {isLoadingSpent ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : !spentTimes || spentTimes.length === 0 ? (
        <div className="py-8 text-center text-xs italic text-muted-foreground">
          {SPENT_TIME_UI.TASK_EMPTY_LIST}
        </div>
      ) : (
        <div className="max-h-[350px] space-y-3 overflow-y-auto pr-1">
          {spentTimes.map((st) => {
            const isLogOwner = st.employeeId === currentUserId
            const isPending = st.status === SPENT_TIME_STATUS.PENDING
            const canDeleteLog = (isAdminOrGM || isLogOwner) && isPending
            const canEditLog = canDeleteLog
            const statusVariant = getSpentTimeStatusPillVariant(st.status)

            return (
              <div
                key={st.id}
                className="relative space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {st.employee?.fullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(st.date).toLocaleDateString("vi-VN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill
                      variant={statusVariant}
                      className="px-2 py-0 text-[9px]"
                      label={getSpentTimeStatusLabel(st.status)}
                    />
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/10 bg-primary/5 text-[9px] font-black text-primary"
                    >
                      {st.hours} {SPENT_TIME_UI.TASK_HOURS_BADGE_SUFFIX}
                    </Badge>

                    {canApproveSpentTime && isPending && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-6 cursor-pointer rounded-full p-0 text-primary hover:bg-primary/10"
                          title={SPENT_TIME_UI.APPROVE_ACTION_TITLE}
                          onClick={() => onApprove(st.id)}
                          aria-label="Phê duyệt nhật ký thời gian"
                        >
                          <Check className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-6 cursor-pointer rounded-full p-0 text-destructive hover:bg-destructive/10"
                          aria-label="Từ chối nhật ký thời gian"
                          title={SPENT_TIME_UI.REJECT_ACTION_TITLE}
                          onClick={() => {
                            const reason = window.prompt(SPENT_TIME_UI.REJECT_REASON_PROMPT)
                            if (reason?.trim()) {
                              onReject(st.id, reason.trim())
                            }
                          }}
                        >
                          <X className="size-3" />
                        </Button>
                      </>
                    )}

                    {canEditLog && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-6 cursor-pointer rounded-full p-0 text-primary hover:bg-primary/10"
                        onClick={() => onEdit(st)}
                        aria-label="Chỉnh sửa nhật ký thời gian"
                      >
                        <Edit className="size-3" />
                      </Button>
                    )}
                    {canDeleteLog && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-6 cursor-pointer rounded-full p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm(SPENT_TIME_UI.TASK_DELETE_CONFIRM)) {
                            onDelete(st.id)
                          }
                        }}
                        aria-label="Xóa nhật ký thời gian"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <History className="size-3 text-muted-foreground" />
                  {formatActivity(st.activity)}
                  {st.workTimeType === "overtime" ? " · OT" : ""}
                </div>

                {st.rejectionReason && (
                  <div className="text-[10px] italic text-destructive">
                    Lý do từ chối: {st.rejectionReason}
                  </div>
                )}

                {st.comment && (
                  <div className="mt-1 rounded-lg border border-border/40 bg-background/50 p-2 text-xs italic text-muted-foreground">
                    &quot;{st.comment}&quot;
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageCard>
  )
}
