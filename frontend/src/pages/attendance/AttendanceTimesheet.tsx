/** Route page that hosts the admin-only workforce attendance matrix. */
import { PageContainer } from "@/components/common"
import { AttendanceMatrix } from "@/components/features/attendance/attendance-matrix"

/** Admin attendance route: focused workforce timesheet only. */
export default function AttendanceTimesheet() {
  return (
    <PageContainer variant="table">
      <AttendanceMatrix />
    </PageContainer>
  )
}
