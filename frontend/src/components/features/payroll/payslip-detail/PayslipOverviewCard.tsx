import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PAYROLL_STATUS_BADGE,
  PAYROLL_STATUS_LABELS,
  PAYSLIP_RECEIPT_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { MessageSquare } from "lucide-react"

interface PayslipOverviewCardProps {
  payslip: IPayslip
  onOpenFeedback: () => void
}

/**
 * Hero card summarizing net pay, gross salary, total deductions, and current payslip status.
 */
export function PayslipOverviewCard({ payslip, onOpenFeedback }: PayslipOverviewCardProps) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none p-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Thực Lãnh
          </span>
          <div className="text-5xl font-bold text-primary">{formatCurrency(payslip.netSalary)}</div>
          <div className="flex flex-wrap items-center gap-2">
            {payslip.status ? (
              <Badge
                variant={PAYROLL_STATUS_BADGE[payslip.status]}
                className="rounded-full shadow-none"
              >
                {PAYROLL_STATUS_LABELS[payslip.status]}
              </Badge>
            ) : null}
            <Badge variant="outline" className="rounded-full shadow-none">
              {payslip.receiptStatus
                ? PAYSLIP_RECEIPT_STATUS_LABELS[payslip.receiptStatus]
                : "Chưa nhận"}
            </Badge>
            {payslip.isPreview ? (
              <Badge variant="secondary" className="rounded-full shadow-none">
                Phiếu xem trước
              </Badge>
            ) : null}
          </div>
        </div>
        {payslip.canFeedback ? (
          <Button type="button" className="rounded-full" onClick={onOpenFeedback}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </Button>
        ) : null}
      </div>
    </div>
  )
}
