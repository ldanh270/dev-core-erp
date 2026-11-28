import { StatCard } from "@/components/features/recruitment/recruitment-dashboard-widgets"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"

import { Briefcase, CheckCircle, FileText, Users } from "lucide-react"

interface RecruitmentStatsGridProps {
  isLoading: boolean
  reqStats?: { total?: number; pending?: number }
  appStats?: { total?: number; active?: number }
  offerStats?: { total?: number; pending?: number }
  bgcStats?: { total?: number; inProgress?: number }
}

export function RecruitmentStatsGrid({
  isLoading,
  reqStats,
  appStats,
  offerStats,
  bgcStats,
}: RecruitmentStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isLoading ? (
        <>
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </>
      ) : (
        <>
          <StatCard
            title="Yêu cầu tuyển dụng"
            value={reqStats?.total ?? 0}
            description={`${reqStats?.pending ?? 0} đang chờ phê duyệt`}
            icon={FileText}
            onClick={() => {
              routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)
            }}
          />
          <StatCard
            title="Ứng viên"
            value={appStats?.total ?? 0}
            description={`${appStats?.active ?? 0} đang trong quá trình`}
            icon={Users}
            onClick={() => {
              routerNavigate(ROUTES.RECRUITMENT.CANDIDATES)
            }}
          />
          <StatCard
            title="Offer"
            value={offerStats?.total ?? 0}
            description={`${offerStats?.pending ?? 0} đang chờ phản hồi`}
            icon={Briefcase}
            onClick={() => {
              routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)
            }}
          />
          <StatCard
            title="Background Check"
            value={bgcStats?.total ?? 0}
            description={`${bgcStats?.inProgress ?? 0} đang kiểm tra`}
            icon={CheckCircle}
            onClick={() => {
              routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)
            }}
          />
        </>
      )}
    </div>
  )
}
