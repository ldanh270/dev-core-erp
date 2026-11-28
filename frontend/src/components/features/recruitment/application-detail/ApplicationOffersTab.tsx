import { PageCard, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import type { RecruitmentOffer } from "@/types/recruitment.types"

import { format } from "date-fns"
import { Plus } from "lucide-react"

interface ApplicationOffersTabProps {
  offers?: RecruitmentOffer[]
  canManage: boolean
  onCreateOffer: () => void
}

/**
 * Pure UI presentational tab presenting offer letters, compensation packages,
 * candidate responses, and background check results.
 */
export function ApplicationOffersTab({
  offers,
  canManage,
  onCreateOffer,
}: ApplicationOffersTabProps) {
  return (
    <PageCard className="border border-border/60 p-6">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-base font-bold text-foreground">Thông tin Offer & Lời mời làm việc</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={onCreateOffer}
            className="rounded-full text-xs font-semibold shadow-xs"
          >
            <Plus className="mr-1.5 size-3.5" />
            Tạo Offer
          </Button>
        )}
      </div>

      {offers && offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="space-y-2 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">{offer.jobTitle ?? "Offer"}</span>
                <StatusPill
                  label={offer.status}
                  variant={offer.status === "accepted" ? "success" : "neutral"}
                />
              </div>
              <p className="text-sm font-semibold text-primary">
                Lương: {Number(offer.offeredSalary).toLocaleString()} {offer.currency}
              </p>
              <p className="text-xs text-muted-foreground">
                Ngày bắt đầu dự kiến:{" "}
                {offer.startDate ? format(new Date(offer.startDate), "dd/MM/yyyy") : "—"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có offer nào được tạo cho ứng viên này.
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateOffer}
              className="rounded-full text-xs font-semibold"
            >
              <Plus className="mr-1.5 size-3.5" />
              Tạo Offer ngay
            </Button>
          )}
        </div>
      )}
    </PageCard>
  )
}
