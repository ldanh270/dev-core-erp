import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateOfferDialog } from "@/components/features/recruitment/create-offer-dialog"
import { ScheduleInterviewDialog } from "@/components/features/recruitment/schedule-interview-dialog"
import { Button } from "@/components/ui/button"
import type { KanbanApplication } from "@/types/recruitment.types"

import { useState } from "react"

import { Plus } from "lucide-react"

interface WorkspaceTabProps {
  applications: KanbanApplication[]
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  })

const formatMoney = (value: number | string, currency: string) =>
  `${Number(value).toLocaleString("vi-VN")} ${currency}`

export function RequisitionInterviewsTab({
  applications,
  canSchedule,
  onCreated,
}: WorkspaceTabProps & { canSchedule: boolean; onCreated: () => void }) {
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

export function RequisitionOffersTab({
  applications,
  canCreate,
  onCreated,
}: WorkspaceTabProps & { canCreate: boolean; onCreated: () => void }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const offers = applications.flatMap((application) =>
    (application.offers ?? []).map((offer) => ({ application, offer })),
  )

  return (
    <PageCard padding="sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <WorkspaceHeader
          title="Offer"
          description="Offer của ứng viên trong yêu cầu tuyển dụng này."
          count={offers.length}
        />
        {canCreate && (
          <Button
            className="rounded-full"
            onClick={() => {
              setIsCreateOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" />
            Tạo offer
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Ứng viên</th>
              <th className="p-3">Vị trí</th>
              <th className="p-3">Mức offer</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(({ application, offer }) => (
              <tr key={offer.id} className="border-b last:border-0">
                <td className="p-3">
                  <p className="font-medium">{application.candidate.fullName}</p>
                  <p className="text-xs text-muted-foreground">{application.candidate.email}</p>
                </td>
                <td className="p-3">{offer.jobTitle ?? application.requisition.title}</td>
                <td className="p-3 font-medium">
                  {formatMoney(offer.offeredSalary, offer.currency)}
                </td>
                <td className="p-3">
                  <StatusPill label={offer.status} variant="info" />
                </td>
              </tr>
            ))}
            <EmptyRow visible={offers.length === 0} message="Chưa có offer trong yêu cầu này." />
          </tbody>
        </table>
      </div>
      <CreateOfferDialog
        applications={applications}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={onCreated}
      />
    </PageCard>
  )
}

export function RequisitionBackgroundChecksTab({ applications }: WorkspaceTabProps) {
  const checks = applications.flatMap((application) =>
    (application.offers ?? [])
      .filter((offer) => offer.backgroundCheck)
      .map((offer) => ({
        application,
        check: offer.backgroundCheck as Exclude<typeof offer.backgroundCheck, null | undefined>,
      })),
  )

  return (
    <PageCard padding="sm">
      <WorkspaceHeader
        title="Background Check"
        description="Kiểm tra thông tin của ứng viên trong yêu cầu tuyển dụng này."
        count={checks.length}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Ứng viên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Nhóm kiểm tra</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(({ application, check }) => (
              <tr key={check.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{application.candidate.fullName}</td>
                <td className="p-3 text-muted-foreground">{application.candidate.email}</td>
                <td className="p-3">{check.group}</td>
                <td className="p-3">
                  <StatusPill label={check.status} variant="info" />
                </td>
              </tr>
            ))}
            <EmptyRow
              visible={checks.length === 0}
              message="Chưa có background check trong yêu cầu này."
            />
          </tbody>
        </table>
      </div>
    </PageCard>
  )
}

function WorkspaceHeader({
  title,
  description,
  count,
}: {
  title: string
  description: string
  count: number
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{count} mục</span>
    </div>
  )
}

function EmptyRow({ visible, message }: { visible: boolean; message: string }) {
  return visible ? (
    <tr>
      <td colSpan={4} className="p-10 text-center text-muted-foreground">
        {message}
      </td>
    </tr>
  ) : null
}
