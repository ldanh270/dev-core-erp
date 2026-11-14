import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OFFER_RESPONSE_LABELS, OFFER_STATUS_LABELS } from "@/config/entities/recruitment.config"
import type { RecruitmentOffer } from "@/types/recruitment.types"

import { Calendar, DollarSign, FileCheck, Mail, User } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: RecruitmentOffer | null
}

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  sent: "info",
  accepted: "success",
  declined: "danger",
  rescinded: "danger",
  expired: "warning",
}

const responseVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  accept: "success",
  decline: "danger",
  negotiate: "warning",
}

const formatCurrency = (val: number | undefined, currency = "VND") => {
  if (!val) return "—"
  return `${val.toLocaleString()} ${currency}`
}

export function ViewOfferDialog({ open, onOpenChange, offer }: Props) {
  if (!offer) return null

  const candidateName =
    offer.application?.candidate.fullName ??
    offer.candidateName ??
    offer.candidate.fullName ??
    "Ứng viên"
  const candidateEmail =
    offer.application?.candidate.email ?? offer.candidateEmail ?? offer.candidate.email ?? ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              {offer.jobTitle} · {offer.department}
            </Badge>
            <StatusPill
              label={OFFER_STATUS_LABELS[offer.status] || offer.status}
              variant={statusVariantMap[offer.status as keyof typeof statusVariantMap] ?? "neutral"}
            />
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary shrink-0" />
            Chi tiết Thư mời nhận việc (Offer)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-3 text-sm">
          {/* Candidate Card */}
          <div className="rounded-lg bg-muted/30 p-4 border border-border space-y-2">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Ứng viên nhận Offer
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{candidateName}</span>
              </div>
            </div>
            {candidateEmail && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{candidateEmail}</span>
              </div>
            )}
          </div>

          {/* Salary & Date */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/20 p-3 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Mức lương đề nghị
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-primary mt-0.5">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>{formatCurrency(offer.offeredSalary, offer.currency)}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Ngày bắt đầu làm việc
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {offer.startDate
                    ? new Date(offer.startDate).toLocaleDateString("vi-VN")
                    : "Thỏa thuận"}
                </span>
              </div>
            </div>
          </div>

          {/* Response status */}
          <div className="flex items-center justify-between rounded-lg p-3 bg-muted/10 border border-border">
            <span className="text-xs font-medium text-muted-foreground">Phản hồi của ứng viên</span>
            {}
            {offer.response ? (
              <StatusPill
                label={OFFER_RESPONSE_LABELS[offer.response] || offer.response}

                variant={responseVariantMap[offer.response] ?? "neutral"}
              />
            ) : (
              <span className="text-xs text-muted-foreground font-medium">Chưa phản hồi</span>
            )}
          </div>

          {/* Expiration */}
          {offer.expirationDate && (
            <div className="text-xs text-muted-foreground">
              <span>Hạn phản hồi: </span>
              <span className="font-medium text-foreground">
                {new Date(offer.expirationDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}

          {/* Additional Notes */}
          {offer.notes && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">
                Ghi chú / Điều khoản phụ
              </span>
              <div className="rounded-lg bg-muted/20 p-3 border border-border text-xs text-foreground whitespace-pre-wrap">
                {offer.notes}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
