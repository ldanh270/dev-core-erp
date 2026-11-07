import { CompanyWorkSchedulesView } from "@/components/features/attendance/company-work-schedules-view"
import { PageContainer, PageHeader } from "@/components/common"

/**
 * Standardized Company Work Schedules page.
 * Uses PageContainer variant="table" to lock viewport height and support internal scrolling.
 */
export default function WorkSchedules() {
  return (
    <PageContainer variant="table">
      <PageHeader
        title="Lịch làm việc"
        description="Xem lịch làm việc theo tuần của toàn bộ nhân viên."
      />

      <CompanyWorkSchedulesView />
    </PageContainer>
  )
}
