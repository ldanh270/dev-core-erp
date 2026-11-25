import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { ScheduleInterviewDialog } from "../ScheduleInterviewDialog"
import { Button } from "@/components/ui/button"
import type { KanbanApplication } from "@/types/recruitment.types"

import { useState } from "react"

import { Plus } from "lucide-react"

import { EmptyRow, WorkspaceHeader } from "./WorkspaceShared"

interface RequisitionInterviewsTabProps {
  applications: KanbanApplication[]
  canSchedule: boolean
  onCreated: () => void
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  })

export function RequisitionInterviewsTab({
  applications,
  canSchedule,
  onCreated,
}: RequisitionInterviewsTabProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const interviews = applications.flatMap((application) =>
    (application.interviewRounds ?? []).map((interview) => ({ application, interview })),
  )

  return (
    <PageCard padding="sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <WorkspaceHeader
          title="Lịch phỏng vấn"
          description="Các vòng phỏng vấn của ứng viên trong yêu cầu tuyển dụng này."
          count={interviews.length}
        />
        {canSchedule && (
          <Button
            className="rounded-full"
            onClick={() => {
              setIsScheduleOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" />
            Tạo lịch phỏng vấn
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Ứng viên</th>
              <th className="p-3">Vòng</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map(({ application, interview }) => (
              <tr key={interview.id} className="border-b last:border-0">
                <td className="p-3">
                  <p className="font-medium">{application.candidate.fullName}</p>
                  <p className="text-xs text-muted-foreground">{application.candidate.email}</p>
                </td>
                <td className="p-3">
                  <p className="font-medium">{interview.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Vòng {interview.roundNumber} · {interview.durationMinutes} phút
                  </p>
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatDateTime(interview.scheduledAt)}
                </td>
                <td className="p-3">
                  <StatusPill label={interview.status} variant="info" />
                </td>
              </tr>
            ))}
            <EmptyRow
              visible={interviews.length === 0}
              message="Chưa có lịch phỏng vấn trong yêu cầu này."
            />
          </tbody>
        </table>
      </div>
      <ScheduleInterviewDialog
        applications={applications}
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onCreated={onCreated}
      />
    </PageCard>
  )
}
