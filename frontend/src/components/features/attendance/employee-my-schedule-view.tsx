import { PageContainer, PageHeader } from "@/components/common"
import { PersonalAttendanceSchedulePanel } from "@/components/features/attendance/personal-attendance-schedule-panel"

export function EmployeeMyScheduleView() {
  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Lịch của tôi"
        description="Chấm công và xem thời khóa biểu ca làm việc trong tuần."
      />

      <PersonalAttendanceSchedulePanel />
    </PageContainer>
  )
}
