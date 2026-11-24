import { DashboardLayout } from "@/components/common"
import { AttendanceMonthPicker } from "@/components/features/attendance/attendance-month-picker"
import { AttendanceSummaryContent } from "@/components/features/attendance/attendance-summary-content"
import { useAttendanceSummaryPeriod } from "@/hooks/attendance/use-attendance-summary-period"

/**
 * Standardized Attendance Summary Dashboard.
 * Powered by DashboardLayout shared component and useAttendanceSummaryPeriod hook.
 */
export default function AttendanceSummary() {
  const { year, month, goToPrev, goToNext } = useAttendanceSummaryPeriod()

  return (
    <DashboardLayout
      title="Tổng hợp chấm công"
      description="Tóm tắt tình hình đi làm, giờ công và kỷ luật chấm công trong tháng."
      actions={
        <AttendanceMonthPicker year={year} month={month} onPrev={goToPrev} onNext={goToNext} />
      }
      statsSection={<AttendanceSummaryContent year={year} month={month} />}
    />
  )
}
