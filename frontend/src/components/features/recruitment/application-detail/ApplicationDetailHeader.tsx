import { BackButton, StatusPill } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { APPLICATION_STATUS_LABELS } from "@/config/entities/recruitment.config"
import type { RecruitmentApplication } from "@/types/recruitment.types"

import { MessageSquare, Plus } from "lucide-react"
import { Link } from "react-router-dom"

interface ApplicationDetailHeaderProps {
  application: RecruitmentApplication
  canManage: boolean
  onScheduleInterview: () => void
  onAddNote: () => void
}

/**
 * Pure UI presentational header for candidate application details,
 * displaying breadcrumbs, candidate identity, stage pill, and primary action buttons.
 */
export function ApplicationDetailHeader({
  application,
  canManage,
  onScheduleInterview,
  onAddNote,
}: ApplicationDetailHeaderProps) {
  const stageName =
    application.pipelineStage?.name ??
    APPLICATION_STATUS_LABELS[application.status] ??
    application.status

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BackButton fallbackHref={`/recruitment/requisitions/${application.requisitionId}`} />
          <Link to="/recruitment/requisitions" className="transition-colors hover:text-primary">
            Tuyển dụng
          </Link>
          <span>/</span>
          <Link
            to={`/recruitment/requisitions/${application.requisitionId}`}
            className="font-medium hover:text-primary"
          >
            {application.requisition?.title ?? "Yêu cầu"}
          </Link>
          <span>/</span>
          <span className="font-mono">#{application.id.substring(0, 8)}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{application.candidate.fullName}</h1>
          <StatusPill label={stageName} variant="info" />
          <Badge variant="outline" className="rounded-full bg-secondary/50 font-mono text-xs">
            {application.source}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Button onClick={onScheduleInterview} className="gap-1.5 rounded-full shadow-sm">
            <Plus className="size-4" />
            Lên lịch phỏng vấn
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onAddNote}
          className="gap-1.5 rounded-full border-border"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          Thêm ghi chú
        </Button>
      </div>
    </div>
  )
}
