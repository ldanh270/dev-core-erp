import { PageContainer } from "@/components/common"
import { EmployeePartTimeAvailabilityView } from "@/components/features/attendance/part-time-availability/employee-part-time-availability-view"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/config/routes.config"
import { useProfile } from "@/hooks/use-profile"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util"

import { Navigate } from "react-router-dom"

export default function MyPartTimeAvailability() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <Skeleton className="h-40 w-full rounded-xl" />
      </PageContainer>
    )
  }

  if (!profile || !isPartTimeWorkSchedule(profile)) {
    // Full-time employees use fixed weekly schedule, not availability submission.
    return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
  }

  return (
    <PageContainer variant="default">
      <EmployeePartTimeAvailabilityView />
    </PageContainer>
  )
}
