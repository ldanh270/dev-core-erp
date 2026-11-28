import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InterviewRound } from "@/types/recruitment.types"

import { Calendar as CalendarIcon, Search } from "lucide-react"

import { MyInterviewCard } from "./MyInterviewCard"

export interface MyInterviewsListViewProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  activeTab: string
  onTabChange: (value: string) => void
  totalCount: number
  pendingCount: number
  completedCount: number
  interviews: InterviewRound[]
  isLoading: boolean
  onFeedback: (interview: InterviewRound) => void
}

/**
 * Pure UI presentational component rendering personal interview rounds in a filtered list layout.
 */
export function MyInterviewsListView({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalCount,
  pendingCount,
  completedCount,
  interviews,
  isLoading,
  onFeedback,
}: MyInterviewsListViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border/60 p-4 rounded-xl">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ứng viên, vị trí phỏng vấn..."
            className="h-10 rounded-full pl-9 text-xs"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 rounded-full sm:w-[320px]">
            <TabsTrigger value="all" className="rounded-full text-xs font-semibold">
              Tất cả ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-full text-xs font-semibold">
              Sắp tới ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full text-xs font-semibold">
              Đã xong ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Đang tải lịch phỏng vấn...
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-16 text-center space-y-3 bg-card/40">
          <CalendarIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Không tìm thấy lịch phỏng vấn nào.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <MyInterviewCard
              key={interview.id}
              interview={interview}
              onFeedback={() => onFeedback(interview)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
