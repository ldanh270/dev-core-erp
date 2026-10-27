import { PageCard, PageHeader } from "@/components/common"
import { GeneratePayrollModal } from "@/components/payroll/GeneratePayrollModal"
import { PayrollHistoryTable } from "@/components/payroll/PayrollHistoryTable"
import { Button } from "@/components/ui/button"
import { usePayrolls } from "@/hooks/payroll/use-payrolls"
import { exportPayrollsToCSV } from "@/utils/export.util"

import { useState } from "react"

import { Download } from "lucide-react"

export default function PayrollManagement() {
  // We can add state for filters if needed later
  const [filters] = useState<{ status?: string; year?: number }>({})

  const { data: payrolls, isLoading } = usePayrolls(filters)

  const handleExport = () => {
    if (payrolls) {
      exportPayrollsToCSV(payrolls, `payroll_export_${new Date().getTime()}.csv`)
    }
  }

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      <PageHeader
        title="Quản lý bảng lương"
        description="Quản lý chu kỳ lương của tổ chức, xem lịch sử và tạo bảng lương mới."
        actions={
          <div className="flex max-sm:items-start items-center gap-2 max-sm:flex-col flex-row">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!payrolls || payrolls.length === 0}
              className="rounded-full font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </Button>
            <GeneratePayrollModal />
          </div>
        }
      />

      <PageCard className="p-0 overflow-hidden" noBorder={false}>
        <PayrollHistoryTable payrolls={payrolls || []} isLoading={isLoading} />
      </PageCard>
    </div>
  )
}
