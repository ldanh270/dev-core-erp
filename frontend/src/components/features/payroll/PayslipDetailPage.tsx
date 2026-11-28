import { EntityFormPage } from "@/components/common/entity-form-page"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COMPONENT_TYPE } from "@/config/entities/payroll.config"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useState } from "react"

import { Activity, Clock, DollarSign, MessageSquare } from "lucide-react"

import { PayslipAttendanceSummary } from "./payslip-detail/PayslipAttendanceSummary"
import { PayslipComponentsTab } from "./payslip-detail/PayslipComponentsTab"
import { PayslipDailyWorkTab } from "./payslip-detail/PayslipDailyWorkTab"
import { PayslipFeedbackDialog } from "./payslip-detail/PayslipFeedbackDialog"
import { PayslipOverviewCard } from "./payslip-detail/PayslipOverviewCard"

interface PayslipDetailPageProps {
  payslip: IPayslip | null
  onClose: () => void
}

/**
 * Full-page detail view rendering breakdown of an individual payslip with attendance and earnings.
 */
export function PayslipDetailPage({ payslip, onClose }: PayslipDetailPageProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackDate, setFeedbackDate] = useState("")

  if (!payslip) {
    return (
      <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
        <div className="flex h-40 items-center justify-center text-destructive bg-background border border-border rounded-xl shadow-none">
          <p>Không thể tải thông tin phiếu lương.</p>
        </div>
      </EntityFormPage>
    )
  }

  const openFeedback = (date?: string) => {
    setFeedbackDate(date ?? payslip.dailyWorkLogs?.[0]?.date ?? "")
    setFeedbackOpen(true)
  }

  const dailyWorkLogs = payslip.dailyWorkLogs ?? []

  return (
    <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
      <div className="space-y-6">
        <PayslipOverviewCard payslip={payslip} onOpenFeedback={() => openFeedback()} />

        <PayslipAttendanceSummary
          workingDays={payslip.workingDays}
          absentDays={payslip.absentDays}
          overtimeMinutes={payslip.overtimeMinutes}
        />

        <Tabs
          defaultValue="daily-work"
          className="bg-background border border-border rounded-xl overflow-hidden shadow-none gap-0"
        >
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="w-full sm:w-auto justify-start">
              <TabsTrigger value="daily-work" className="gap-2">
                <Clock className="h-4 w-4" />
                Công theo ngày
              </TabsTrigger>
              <TabsTrigger value="additions" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Thu nhập
                <span className="hidden md:inline text-success">
                  +{formatCurrency(payslip.totalAdditions)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="deductions" className="gap-2">
                <Activity className="h-4 w-4" />
                Khấu trừ
                <span className="hidden md:inline text-destructive">
                  -{formatCurrency(payslip.totalDeductions)}
                </span>
              </TabsTrigger>
            </TabsList>
            {payslip.canFeedback ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => openFeedback()}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Báo sai lệch
              </Button>
            ) : null}
          </div>

          <TabsContent value="daily-work" className="m-0">
            <PayslipDailyWorkTab
              dailyWorkLogs={dailyWorkLogs}
              canFeedback={payslip.canFeedback}
              onOpenFeedback={openFeedback}
            />
          </TabsContent>

          <TabsContent value="additions" className="m-0">
            <PayslipComponentsTab details={payslip.details} type={COMPONENT_TYPE.ADDITION} />
          </TabsContent>

          <TabsContent value="deductions" className="m-0">
            <PayslipComponentsTab details={payslip.details} type={COMPONENT_TYPE.DEDUCTION} />
          </TabsContent>
        </Tabs>
      </div>

      <PayslipFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        payslipId={payslip.id}
        initialDate={feedbackDate}
      />
    </EntityFormPage>
  )
}
