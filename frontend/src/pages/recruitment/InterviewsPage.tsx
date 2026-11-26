import { DataTablePage } from "@/components/common"
import { InterviewsCardsView } from "@/components/features/recruitment/InterviewsCardsView"
import { InterviewsViewToggle } from "@/components/features/recruitment/InterviewsViewToggle"
import { getInterviewsColumns } from "@/components/features/recruitment/interviews-columns"
import { ViewInterviewDialog } from "@/components/features/recruitment/view-interview-dialog"
import { useInterviewsManagement } from "@/hooks/recruitment/use-interviews-management"
import type { InterviewRound } from "@/types/recruitment.types"
import { Plus } from "lucide-react"
import { useMemo } from "react"

/**
 * Tier 2 Page Orchestrator for upcoming interview rounds.
 * Switches between table and card grid presentations via pure prop-binding.
 */
export default function InterviewsPage() {
  const {
    viewMode,
    setViewMode,
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    keyword,
    handleSearch,
    filteredInterviews,
    paginatedInterviews,
    isLoading,
    selectedInterview,
    viewInterviewOpen,
    handleCloseModal,
    tabsConfig,
    handleViewDetails,
  } = useInterviewsManagement()

  const columns = useMemo(
    () => getInterviewsColumns({ onViewDetails: handleViewDetails }),
    [handleViewDetails],
  )

  const paginationConfig = {
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(filteredInterviews.length / pageSize)),
    totalItems: filteredInterviews.length,
    itemsPerPage: pageSize,
    onPageChange: setPage,
    onItemsPerPageChange: handlePageSizeChange,
  }

  const primaryAction = {
    label: "Tạo lịch phỏng vấn",
    icon: Plus,
    onClick: () => {},
  }

  const viewToggle = (
    <InterviewsViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
  )

  return (
    <>
      {viewMode === "cards" ? (
        <InterviewsCardsView
          title="Lịch phỏng vấn"
          description="Quản lý lịch phỏng vấn và đánh giá ứng viên"
          primaryAction={primaryAction}
          viewToggle={viewToggle}
          tabs={tabsConfig}
          searchQuery={keyword}
          onSearchChange={handleSearch}
          searchPlaceholder="Tìm theo tên ứng viên, vị trí tuyển dụng..."
          interviews={paginatedInterviews}
          isLoading={isLoading}
          hasFilter={Boolean(keyword || tabsConfig.activeTab !== "all")}
          onViewDetails={handleViewDetails}
          pagination={paginationConfig}
        />
      ) : (
        <DataTablePage<InterviewRound>
          title="Lịch phỏng vấn"
          description="Quản lý lịch phỏng vấn và đánh giá ứng viên"
          variant="viewport"
          data={paginatedInterviews}
          columns={columns}
          isLoading={isLoading}
          tabs={tabsConfig}
          keyExtractor={(item) => item.id}
          search={{
            value: keyword,
            onSearch: handleSearch,
            placeholder: "Tìm theo tên ứng viên, vị trí tuyển dụng...",
          }}
          filters={viewToggle}
          primaryAction={primaryAction}
          onRowClick={handleViewDetails}
          emptyState={{
            title:
              keyword || tabsConfig.activeTab !== "all"
                ? "Không tìm thấy lịch phỏng vấn phù hợp với bộ lọc"
                : "Chưa có lịch phỏng vấn nào",
            description: "Hiện tại không có lịch phỏng vấn nào trong trạng thái này.",
          }}
          pagination={paginationConfig}
        />
      )}

      <ViewInterviewDialog
        open={viewInterviewOpen}
        onOpenChange={handleCloseModal}
        interview={selectedInterview}
      />
    </>
  )
}
