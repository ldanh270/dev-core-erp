import { PageContainer, PageHeader } from "@/components/common"
import { AdminPartTimeAvailabilityView } from "@/components/features/attendance/part-time-availability/admin-part-time-availability-view"

export default function PartTimeAvailabilityPage() {
  // Admin-only page: assign shifts within employee-declared free-time windows.
  return (
    <PageContainer variant="table">
      <PageHeader
        title="Xếp ca part-time"
        description="Xếp ca theo giờ/phút trong khung rảnh nhân viên bán thời gian đã gửi."
      />
      <AdminPartTimeAvailabilityView />
    </PageContainer>
  )
}
