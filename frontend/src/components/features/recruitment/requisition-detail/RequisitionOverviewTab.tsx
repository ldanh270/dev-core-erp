import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TABLE_COL_WIDTH } from "@/config/table-columns.config"
import type {
  JobRequisition,
  KanbanApplication,
  RecruitmentPipelineStage,
} from "@/types/recruitment.types"
import { BarChart3, TrendingUp } from "lucide-react"
import { useMemo } from "react"

interface StageWithCount extends RecruitmentPipelineStage {
  count: number
}

interface DonutSegment {
  id: string
  color: string
  segmentPercent: number
  accumulatedOffset: number
}

function calculateDonutSegments(
  stageCounts: StageWithCount[],
  totalAppsCount: number,
  circumference: number,
): DonutSegment[] {
  let accumulated = 0
  const segments: DonutSegment[] = []
  for (const stage of stageCounts) {
    const segmentPercent = (stage.count / totalAppsCount) * 100
    const accumulatedOffset = -(accumulated / 100) * circumference
    accumulated += segmentPercent
    segments.push({
      id: stage.id,
      color: stage.color || "hsl(var(--primary))",
      segmentPercent,
      accumulatedOffset,
    })
  }
  return segments
}

function RequisitionHiringProgressCard({
  headcount,
  hiredCount,
  completionRate,
  circumference,
}: {
  headcount: number
  hiredCount: number
  completionRate: number
  circumference: number
}) {
  return (
    <PageCard className="col-span-12 flex flex-col items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-card to-card/50 p-6 text-center transition-all hover:shadow-md lg:col-span-4 relative">
      <div className="absolute left-4 top-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <TrendingUp className="size-3.5 text-emerald-500" />
        Tiến độ Tuyển dụng
      </div>
      <div className="relative my-6 flex items-center justify-center">
        <svg className="size-32 -rotate-90 transform">
          <circle
            cx="64"
            cy="64"
            r="50"
            className="stroke-muted/30"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r="50"
            className="stroke-emerald-500 transition-all duration-500"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - completionRate / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-foreground">{completionRate}%</span>
          <span className="text-[10px] font-medium text-muted-foreground">Chỉ tiêu</span>
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground">
        Đã tuyển <span className="font-bold text-emerald-500">{hiredCount}</span> / Chỉ tiêu{" "}
        <span className="font-bold text-foreground">{headcount}</span> nhân sự
      </div>
    </PageCard>
  )
}

function RequisitionPipelineDistributionCard({
  stageCounts,
  totalApplications,
  circumference,
}: {
  stageCounts: StageWithCount[]
  totalApplications: number
  circumference: number
}) {
  const totalAppsCount = totalApplications || 1

  const donutSegments = useMemo(
    () => calculateDonutSegments(stageCounts, totalAppsCount, circumference),
    [stageCounts, totalAppsCount, circumference],
  )

  return (
    <PageCard className="col-span-12 flex flex-col items-center gap-8 overflow-hidden border border-border/60 bg-gradient-to-br from-card to-card/50 p-6 transition-all hover:shadow-md md:flex-row lg:col-span-8 relative">
      <div className="absolute left-4 top-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <BarChart3 className="size-3.5 text-blue-500" />
        Phân bổ Pipeline
      </div>

      <div className="relative mt-4 flex size-36 shrink-0 items-center justify-center md:mt-0">
        <svg className="size-32 -rotate-90 transform">
          {donutSegments.map((segment) => (
            <circle
              key={segment.id}
              cx="64"
              cy="64"
              r="50"
              style={{ stroke: segment.color }}
              className="transition-all duration-300 hover:opacity-80"
              strokeWidth="14"
              fill="transparent"
              strokeDasharray={`${(segment.segmentPercent / 100) * circumference} ${circumference}`}
              strokeDashoffset={segment.accumulatedOffset}
            />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-foreground">{totalApplications}</span>
          <span className="text-[10px] font-medium text-muted-foreground">Ứng viên</span>
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 md:mt-0">
        {stageCounts.map((stage) => {
          const percent =
            totalAppsCount > 0 ? Math.round((stage.count / totalAppsCount) * 100) : 0
          return (
            <div
              key={stage.id}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-2.5 transition-all duration-200 hover:bg-muted/20"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color || "currentColor" }}
                />
                <span className="truncate text-xs font-semibold text-muted-foreground">
                  {stage.name}
                </span>
              </div>
              <div className="ml-1 flex shrink-0 items-center gap-1">
                <span className="text-xs font-bold text-foreground">{stage.count}</span>
                <span className="text-[9px] font-medium text-muted-foreground">
                  ({percent}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </PageCard>
  )
}

function RequisitionStageBreakdownCard({
  stageCounts,
  totalApplications,
}: {
  stageCounts: StageWithCount[]
  totalApplications: number
}) {
  const totalApps = totalApplications || 1

  return (
    <PageCard className="border border-border/60 p-6">
      <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
        Chi tiết các giai đoạn Tuyển dụng
      </h3>
      <div className="relative overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="h-10">
              <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                Tên giai đoạn
              </TableHead>
              <TableHead
                className="text-center text-xs font-semibold uppercase text-muted-foreground"
                style={{ width: `${TABLE_COL_WIDTH.PRIORITY}px` }}
              >
                Ứng viên
              </TableHead>
              <TableHead
                className="text-center text-xs font-semibold uppercase text-muted-foreground"
                style={{ width: `${TABLE_COL_WIDTH.TIME}px` }}
              >
                Tỷ lệ (%)
              </TableHead>
              <TableHead
                className="text-right text-xs font-semibold uppercase text-muted-foreground"
                style={{ width: `${TABLE_COL_WIDTH.STATUS}px` }}
              >
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stageCounts.map((stage) => {
              const percent = Math.round((stage.count / totalApps) * 100)
              return (
                <TableRow key={stage.id} className="h-12 hover:bg-muted/30">
                  <TableCell className="flex items-center gap-2 py-3 text-xs font-bold text-foreground">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.color || "currentColor" }}
                    />
                    {stage.name}
                  </TableCell>
                  <TableCell className="text-center text-xs font-bold text-foreground">
                    {stage.count}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 font-mono">{percent}%</span>
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: stage.color || "currentColor",
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusPill
                      label={stage.isCompleted ? "Hoàn thành" : "Đang xử lý"}
                      variant={stage.isCompleted ? "success" : "info"}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </PageCard>
  )
}

function RequisitionMetaInfoCard({ requisition }: { requisition: JobRequisition }) {
  return (
    <PageCard className="border border-border/60 p-6">
      <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
        Thông tin Yêu cầu tuyển dụng
      </h3>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between border-b border-border/40 pb-2">
          <span className="font-medium text-muted-foreground">Mã yêu cầu:</span>
          <span className="font-mono font-bold text-foreground">{requisition.code}</span>
        </div>
        <div className="flex justify-between border-b border-border/40 pb-2">
          <span className="font-medium text-muted-foreground">Phòng ban:</span>
          <span className="font-semibold text-foreground">
            {requisition.department || "Chưa có"}
          </span>
        </div>
        <div className="flex justify-between border-b border-border/40 pb-2">
          <span className="font-medium text-muted-foreground">Hình thức làm việc:</span>
          <span className="font-semibold text-foreground">{requisition.employmentType}</span>
        </div>
        <div className="flex justify-between border-b border-border/40 pb-2">
          <span className="font-medium text-muted-foreground">Độ ưu tiên:</span>
          <Badge variant="outline" className="rounded-full text-[10px] font-bold uppercase">
            {requisition.priority}
          </Badge>
        </div>
        <div className="flex justify-between border-b border-border/40 pb-2">
          <span className="font-medium text-muted-foreground">Mức lương dự kiến:</span>
          <span className="font-semibold text-foreground">
            {requisition.salaryMin
              ? `${requisition.salaryMin.toLocaleString()} - ${requisition.salaryMax?.toLocaleString() ?? "Thỏa thuận"}`
              : "Thỏa thuận"}
          </span>
        </div>
      </div>
    </PageCard>
  )
}

const CIRCUMFERENCE = 2 * Math.PI * 50

interface RequisitionOverviewTabProps {
  requisition: JobRequisition
  applications: KanbanApplication[]
  stageCounts: StageWithCount[]
}

export function RequisitionOverviewTab({
  requisition,
  applications,
  stageCounts,
}: RequisitionOverviewTabProps) {
  const headcount = requisition.headcount || 1
  const hiredCount = applications.filter(
    (app) => app.status === "hired" || app.pipelineStage?.isCompleted,
  ).length
  const completionRate = Math.min(100, Math.round((hiredCount / headcount) * 100))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <RequisitionHiringProgressCard
          headcount={headcount}
          hiredCount={hiredCount}
          completionRate={completionRate}
          circumference={CIRCUMFERENCE}
        />

        <RequisitionPipelineDistributionCard
          stageCounts={stageCounts}
          totalApplications={applications.length}
          circumference={CIRCUMFERENCE}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <RequisitionStageBreakdownCard
            stageCounts={stageCounts}
            totalApplications={applications.length}
          />
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-5">
          <RequisitionMetaInfoCard requisition={requisition} />
        </div>
      </div>
    </div>
  )
}
