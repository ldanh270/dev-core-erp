import { Skeleton } from "@/components/ui/skeleton"
import type { InterviewRound } from "@/types/recruitment.types"

import { InterviewCard } from "./InterviewCard"

export interface InterviewsCardsGridProps {
  interviews: InterviewRound[]
  isLoading: boolean
  hasFilter: boolean
  onViewDetails: (interview: InterviewRound) => void
}

/**
 * Pure UI presentational grid rendering responsive interview cards with skeleton loading.
 */
export function InterviewsCardsGrid({
  interviews,
  isLoading,
  hasFilter,
  onViewDetails,
}: InterviewsCardsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (interviews.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {hasFilter
          ? "Không tìm thấy lịch phỏng vấn phù hợp với bộ lọc"
          : "Chưa có lịch phỏng vấn nào"}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {interviews.map((interview) => (
        <InterviewCard
          key={interview.id}
          interview={interview}
          onClick={() => onViewDetails(interview)}
        />
      ))}
    </div>
  )
}
