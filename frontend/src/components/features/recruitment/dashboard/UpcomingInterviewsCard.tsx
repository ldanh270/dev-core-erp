import { InterviewItem } from "@/components/features/recruitment/recruitment-dashboard-widgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"
import type { InterviewRound } from "@/types/recruitment.types"

import { ArrowRight, Calendar } from "lucide-react"

/**
 * Props for UpcomingInterviewsCard component.
 */
export interface UpcomingInterviewsCardProps {
  interviews?: InterviewRound[]
  isLoading: boolean
}

/**
 * Presenter card displaying schedule of upcoming interview rounds for the next 7 days.
 */
export function UpcomingInterviewsCard({ interviews, isLoading }: UpcomingInterviewsCardProps) {
  return (
    <Card className="rounded-xl border border-border/60 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold">Lịch phỏng vấn sắp tới</CardTitle>
          <CardDescription className="text-xs">7 ngày tới</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-xs cursor-pointer"
          onClick={() => {
            routerNavigate(ROUTES.RECRUITMENT.MY_INTERVIEWS)
          }}
        >
          Xem tất cả
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ) : interviews && interviews.length > 0 ? (
          <div className="divide-y divide-border/40">
            {interviews.slice(0, 5).map((interview) => (
              <InterviewItem
                key={interview.id}
                candidateName={interview.candidateName ?? "N/A"}
                positionTitle={interview.positionTitle ?? "N/A"}
                scheduledAt={interview.scheduledAt ?? ""}
                roundNumber={interview.roundNumber ?? 1}
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
  )
}
