import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateOfferDialog } from "@/components/features/recruitment/create-offer-dialog"
import { Button } from "@/components/ui/button"
import type { KanbanApplication } from "@/types/recruitment.types"

import { useState } from "react"

import { Plus } from "lucide-react"

import { EmptyRow, WorkspaceHeader } from "./WorkspaceShared"

interface RequisitionOffersTabProps {
  applications: KanbanApplication[]
  canCreate: boolean
  onCreated: () => void
}

const formatMoney = (value: number | string, currency: string) =>
  `${Number(value).toLocaleString("vi-VN")} ${currency}`

export function RequisitionOffersTab({
  applications,
  canCreate,
  onCreated,
}: RequisitionOffersTabProps) {
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
