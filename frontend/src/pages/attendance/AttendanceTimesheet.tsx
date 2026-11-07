/** Route page that hosts the admin-only workforce attendance matrix. */
import { AttendanceMatrix } from "@/components/features/attendance/attendance-matrix"

/** Admin attendance route: focused workforce timesheet powered by DataTablePage. */
export default function AttendanceTimesheet() {
  return <AttendanceMatrix />
}
