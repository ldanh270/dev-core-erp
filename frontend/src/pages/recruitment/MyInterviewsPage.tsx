import { PageContainer } from "@/components/common"
import { InterviewFeedbackPanel } from "@/components/features/recruitment/InterviewFeedbackPanel"
import { MyInterviewsCalendarBoard } from "@/components/features/recruitment/MyInterviewsCalendarBoard"
import { MyInterviewsListView } from "@/components/features/recruitment/MyInterviewsListView"
import { MyInterviewsStatsRow } from "@/components/features/recruitment/MyInterviewsStatsRow"
import { Button } from "@/components/ui/button"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useMyInterviews } from "@/hooks/recruitment/use-my-interviews"
import { CalendarDays, Grid, List } from "lucide-react"

/**
 * Tier 2 Page Orchestrator for personal interview schedule.
 * Delegates visual layout between MyInterviewsCalendarBoard and MyInterviewsListView.
 */
export default function MyInterviewsPage() {
  const {
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedInterview,
    handleSelectInterview,
    weekDays,
    filteredInterviews,
    interviewsCount,
    todayCount,
    pendingCount,
    completedCount,
    isLoading,
    handlePrevWeek,
    handleNextWeek,
    handleCurrentWeek,
  } = useMyInterviews()

  return (
    <PageContainer variant="table" className="gap-4">
      {/* ── Page Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.PAGE_TITLE}>Lịch phỏng vấn của tôi</h1>
              <p className={TYPOGRAPHY.PAGE_SUBTITLE}>
                Theo dõi thời khóa biểu và gửi đánh giá ứng viên các vòng phỏng vấn
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 shadow-2xs">
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "default" : "ghost"}
            onClick={() => setViewMode("calendar")}
            className="h-8 rounded-full px-4 text-xs font-bold transition-all"
          >
            <Grid className="mr-1.5 size-3.5" />
            Lịch tuần
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => setViewMode("list")}
            className="h-8 rounded-full px-4 text-xs font-bold transition-all"
          >
            <List className="mr-1.5 size-3.5" />
            Danh sách
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ─────────────────────────────────────────────────── */}
      <MyInterviewsStatsRow
        totalCount={interviewsCount}
        todayCount={todayCount}
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

      {/* ── Main View Content ────────────────────────────────────────────────────── */}
      {viewMode === "calendar" ? (
        <MyInterviewsCalendarBoard
          weekDays={weekDays}
          interviews={filteredInterviews}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onCurrentWeek={handleCurrentWeek}
          onSelectInterview={handleSelectInterview}
        />
      ) : (
        <MyInterviewsListView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={interviewsCount}
          pendingCount={pendingCount}
          completedCount={completedCount}
          interviews={filteredInterviews}
          isLoading={isLoading}
          onFeedback={handleSelectInterview}
        />
      )}

      {/* ── Interview Feedback & Rating Panel (Sheet) ─────────────────────────── */}
      <InterviewFeedbackPanel
        interview={selectedInterview}
        open={Boolean(selectedInterview)}
        onOpenChange={(open) => {
          if (!open) handleSelectInterview(null)
        }}
      />
    </PageContainer>
  )
}
