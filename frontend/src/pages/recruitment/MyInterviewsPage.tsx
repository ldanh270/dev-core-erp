import { PageContainer, PageHeader } from "@/components/common"
import { InterviewFeedbackPanel } from "@/components/features/recruitment/InterviewFeedbackPanel"
import { MyInterviewsCalendarBoard } from "@/components/features/recruitment/MyInterviewsCalendarBoard"
import { MyInterviewsListView } from "@/components/features/recruitment/MyInterviewsListView"
import { MyInterviewsStatsRow } from "@/components/features/recruitment/MyInterviewsStatsRow"
import { MyInterviewsViewSwitcher } from "@/components/features/recruitment/MyInterviewsViewSwitcher"
import { useMyInterviews } from "@/hooks/recruitment/use-my-interviews"

/**
 * Tier 2 Page Orchestrator for personal interview schedule.
 * Delegates visual presentation to MyInterviewsViewSwitcher, MyInterviewsStatsRow,
 * MyInterviewsCalendarBoard, and MyInterviewsListView.
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
      <PageHeader
        title="Lịch phỏng vấn của tôi"
        description="Theo dõi thời khóa biểu và gửi đánh giá ứng viên các vòng phỏng vấn"
        actions={<MyInterviewsViewSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />}
      />

      <MyInterviewsStatsRow
        totalCount={interviewsCount}
        todayCount={todayCount}
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

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
