import { routerNavigate } from "@/lib/router-navigator"
import { PageContainer, PageHeader } from "@/components/common"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRight,
  Briefcase,
  CheckCircle,
} from "lucide-react"
import {
  useRequisitionStats,
  useApplicationStats,
  useUpcomingInterviews,
  useOfferStats,
  useBackgroundCheckStats,
} from "@/hooks/recruitment/use-recruitment-queries"
import { ROUTES } from "@/config/routes.config"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import { vi } from "date-fns/locale"

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
}) {
  return (
    <Card className="cursor-pointer border border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 rounded-2xl" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center transition-transform hover:scale-110">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function InterviewItem({
  candidateName,
  positionTitle,
  scheduledAt,
  roundNumber,
}: {
  candidateName: string
  positionTitle: string
  scheduledAt: string
  roundNumber: number
}) {
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      if (isToday(date)) return "Hôm nay"
      if (isTomorrow(date)) return "Ngày mai"
      return format(date, "EEE, dd/MM", { locale: vi })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "HH:mm")
    } catch {
      return ""
    }
  }

  return (
    <div className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-xs font-bold text-primary">
            {candidateName ? candidateName.charAt(0).toUpperCase() : "?"}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{candidateName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {positionTitle} • <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0">Vòng {roundNumber}</Badge>
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-foreground">{formatDate(scheduledAt)}</p>
        <p className="text-[11px] font-mono text-muted-foreground">{formatTime(scheduledAt)}</p>
      </div>
    </div>
  )
}

function QuickLink({
  title,
  description,
  icon: Icon,
  to,
  count,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  count?: number
}) {
  return (
    <Card
      className="cursor-pointer border border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 rounded-2xl"
      onClick={() => routerNavigate(to)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 transition-transform hover:scale-105">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-foreground truncate">{title}</p>
            {count !== undefined && count > 0 && (
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                {count}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform hover:translate-x-1" />
      </CardContent>
    </Card>
  )
}

export default function RecruitmentDashboard() {
  const { data: reqStats, isLoading: isLoadingReqStats } = useRequisitionStats()
  const { data: appStats, isLoading: isLoadingAppStats } = useApplicationStats()
  const { data: upcomingInterviews, isLoading: isLoadingInterviews } = useUpcomingInterviews(7)
  const { data: offerStats, isLoading: isLoadingOfferStats } = useOfferStats()
  const { data: bgcStats, isLoading: isLoadingBgcStats } = useBackgroundCheckStats()

  const isLoading =
    isLoadingReqStats ||
    isLoadingAppStats ||
    isLoadingInterviews ||
    isLoadingOfferStats ||
    isLoadingBgcStats

  const totalApps = appStats?.total || 1

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard Tuyển dụng"
        description="Tổng quan tình hình tuyển dụng, tiến độ ứng viên và lịch phỏng vấn"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Yêu cầu tuyển dụng"
              value={reqStats?.total ?? 0}
              description={`${reqStats?.pending ?? 0} đang chờ phê duyệt`}
              icon={FileText}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            />
            <StatCard
              title="Ứng viên"
              value={appStats?.total ?? 0}
              description={`${appStats?.active ?? 0} đang trong quá trình`}
              icon={Users}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.CANDIDATES)}
            />
            <StatCard
              title="Offer"
              value={offerStats?.total ?? 0}
              description={`${offerStats?.pending ?? 0} đang chờ phản hồi`}
              icon={Briefcase}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            />
            <StatCard
              title="Background Check"
              value={bgcStats?.total ?? 0}
              description={`${bgcStats?.inProgress ?? 0} đang kiểm tra`}
              icon={CheckCircle}
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Interviews */}
        <Card className="rounded-2xl border border-border/60 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Lịch phỏng vấn sắp tới</CardTitle>
              <CardDescription className="text-xs">7 ngày tới</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.MY_INTERVIEWS)}
            >
              Xem tất cả
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingInterviews ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : upcomingInterviews && upcomingInterviews.length > 0 ? (
              <div className="divide-y divide-border/40">
                {upcomingInterviews.slice(0, 5).map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    candidateName={interview.candidateName ?? "N/A"}
                    positionTitle={interview.positionTitle ?? "N/A"}
                    scheduledAt={interview.scheduledAt ?? ""}
                    roundNumber={interview.roundNumber}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Không có lịch phỏng vấn nào trong 7 ngày tới
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Pipeline Summary with Progress Bars */}
        <Card className="rounded-2xl border border-border/60 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Pipeline ứng viên</CardTitle>
              <CardDescription className="text-xs">Tỷ lệ theo giai đoạn</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            >
              Xem Requisitions
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAppStats ? (
              <div className="space-y-3">
                <Skeleton className="h-8 rounded-xl" />
                <Skeleton className="h-8 rounded-xl" />
                <Skeleton className="h-8 rounded-xl" />
              </div>
            ) : appStats ? (
              <div className="space-y-3.5">
                {/* Mới */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Ứng viên mới</span>
                    <span>{appStats.byStatus?.new ?? 0}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((appStats.byStatus?.new ?? 0) / totalApps) * 100))}%` }} />
                  </div>
                </div>

                {/* Phỏng vấn */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Đang phỏng vấn</span>
                    <span>{appStats.byStatus?.interviewing ?? 0}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((appStats.byStatus?.interviewing ?? 0) / totalApps) * 100))}%` }} />
                  </div>
                </div>

                {/* Offer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" />Đã gửi Offer</span>
                    <span>{appStats.byStatus?.offer_sent ?? 0}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((appStats.byStatus?.offer_sent ?? 0) / totalApps) * 100))}%` }} />
                  </div>
                </div>

                {/* Đã tuyển */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />Tuyển dụng thành công</span>
                    <span>{appStats.byStatus?.hired ?? 0}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((appStats.byStatus?.hired ?? 0) / totalApps) * 100))}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Thao tác nhanh</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            title="Yêu cầu tuyển dụng"
            description="Tạo và quản lý yêu cầu"
            icon={FileText}
            to={ROUTES.RECRUITMENT.REQUISITIONS}
            count={reqStats?.pending ?? 0}
          />
          <QuickLink
            title="Quản lý ứng viên"
            description="Xem danh sách ứng viên"
            icon={Users}
            to={ROUTES.RECRUITMENT.CANDIDATES}
          />
          <QuickLink
            title="Lịch phỏng vấn của tôi"
            description="Đánh giá & chấm điểm"
            icon={TrendingUp}
            to={ROUTES.RECRUITMENT.MY_INTERVIEWS}
          />
          <QuickLink
            title="Tiếp nhận ứng viên"
            description="Nhập ứng viên hàng loạt"
            icon={CheckCircle}
            to={ROUTES.RECRUITMENT.APPLICANT_INTAKE}
          />
        </div>
      </div>
    </PageContainer>
  )
}
