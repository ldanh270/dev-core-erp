import { PageContainer, PageHeader } from "@/components/common"
import { AttendanceMonthPicker } from "@/components/features/attendance/attendance-month-picker"
import { AttendanceSummaryContent } from "@/components/features/attendance/attendance-summary-content"

import { useState } from "react"

export default function AttendanceSummary() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const goToPrev = () => {
    if (month === 0) {
      setYear((currentYear) => currentYear - 1)
      setMonth(11)
      return
    }
    setMonth((currentMonth) => currentMonth - 1)
  }

  const goToNext = () => {
    if (month === 11) {
      setYear((currentYear) => currentYear + 1)
      setMonth(0)
      return
    }
    setMonth((currentMonth) => currentMonth + 1)
  }

  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Tổng hợp chấm công"
        description="Tóm tắt tình hình đi làm, giờ công và kỷ luật chấm công trong tháng."
        actions={
          <AttendanceMonthPicker year={year} month={month} onPrev={goToPrev} onNext={goToNext} />
        }
      />

      <AttendanceSummaryContent year={year} month={month} />
    </PageContainer>
  )
}
