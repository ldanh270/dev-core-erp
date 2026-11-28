import { DataTablePage } from "@/components/common"
import { CreateJobPostingDialog } from "@/components/features/recruitment/CreateJobPostingDialog"
import { getJobPostingsColumns } from "@/components/features/recruitment/job-postings-columns"
import {
  JOB_POSTINGS_TABS,
  useJobPostingsManagement,
} from "@/hooks/recruitment/use-job-postings-management"
import type { JobPosting } from "@/types/recruitment.types"

import { useMemo } from "react"
import { Plus, Share2 } from "lucide-react"

/**
 * Tier 2 Page Orchestrator for Job Postings.
 * Thin declarative composition shell connecting useJobPostingsManagement, DataTablePage, and CreateJobPostingDialog.
 */
export default function JobPostingsPage() {
  const {
    postings,
    requisitions,
    isLoading,
    canManage,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    tabCounts,
    createModalOpen,
    setCreateModalOpen,
    initialRequisitionId,
    handleOpenWorkspace,
    handleCreateNew,
    handleSearch,
    handleTabChange,
  } = useJobPostingsManagement()

  const columns = useMemo(
    () => getJobPostingsColumns(handleOpenWorkspace),
    [handleOpenWorkspace],
  )

  const tabsConfig = useMemo(
    () => ({
      items: JOB_POSTINGS_TABS.map((tab) => ({
        ...tab,
        count: tabCounts[tab.id as keyof typeof tabCounts] ?? 0,
      })),
      activeTab,
      onTabChange: handleTabChange,
    }),
    [tabCounts, activeTab, handleTabChange],
  )

  return (
    <>
      <DataTablePage<JobPosting>
        title="Tin đăng tuyển dụng"
        description="Quản lý việc phát hành vị trí tuyển dụng lên các kênh mạng xã hội, Google Form và cổng việc làm"
        density="compact"
        primaryAction={
          canManage
            ? {
                label: "Tạo bài đăng",
                icon: Plus,
                onClick: handleCreateNew,
              }
            : undefined
        }
        tabs={tabsConfig}
        search={{
          placeholder: "Tìm theo tiêu đề vị trí, kênh, mã nguồn...",
          onSearch: handleSearch,
        }}
        columns={columns}
        data={postings}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        onRowClick={handleOpenWorkspace}
        emptyState={{
          icon: Share2,
          title: "Chưa có bài đăng tuyển dụng",
          description: "Tạo bài đăng tuyển dụng để mở kênh tiếp nhận hồ sơ ứng viên.",
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setCurrentPage,
          onItemsPerPageChange: setPageSize,
        }}
      />

      <CreateJobPostingDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialRequisitionId={initialRequisitionId}
        jobRequisitions={requisitions}
      />
    </>
  )
}
