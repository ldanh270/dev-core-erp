import { CompanyWorkSchedulesView } from "@/components/features/attendance/company-work-schedules-view"
import { PageContainer, PageHeader } from "@/components/common"

export default function WorkSchedules() {
  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Lịch làm việc"
        description="Xem lịch làm việc theo tuần của toàn bộ nhân viên."
      />

      <CompanyWorkSchedulesView />
    </PageContainer>
  )
}
