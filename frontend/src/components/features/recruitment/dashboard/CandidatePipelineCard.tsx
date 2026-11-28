import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"

import { ArrowRight, Users } from "lucide-react"

/**
 * Props for CandidatePipelineCard component.
 */
export interface CandidatePipelineCardProps {
  appStats?: {
    byStatus?: {
      applied?: number
      interviewing?: number
      offer_sent?: number
      hired?: number
    }
  }
  totalApps: number
}

/**
 * Presenter card displaying candidate pipeline progress and status distribution.
 */
export function CandidatePipelineCard({
  appStats,
  totalApps,
}: CandidatePipelineCardProps) {
  return (
    <Card className="rounded-xl border border-border/60 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold">Pipeline ứng viên</CardTitle>
          <CardDescription className="text-xs">Tỷ lệ theo giai đoạn</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-xs cursor-pointer"
          onClick={() => {
            routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)
          }}
        >
          Xem Pipeline
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {totalApps > 0 ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/40" />
                  Mới ứng tuyển
                </span>
                <span>{appStats?.byStatus?.applied ?? 0}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((appStats?.byStatus?.applied ?? 0) / totalApps) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/60" />
                  Đang phỏng vấn
                </span>
                <span>{appStats?.byStatus?.interviewing ?? 0}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((appStats?.byStatus?.interviewing ?? 0) / totalApps) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Đã gửi Offer
                </span>
                <span>{appStats?.byStatus?.offer_sent ?? 0}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((appStats?.byStatus?.offer_sent ?? 0) / totalApps) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Tuyển dụng thành công
                </span>
                <span>{appStats?.byStatus?.hired ?? 0}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((appStats?.byStatus?.hired ?? 0) / totalApps) * 100))}%`,
                  }}
                />
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
  )
}
