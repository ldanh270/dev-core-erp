import { DetailNotFound, DetailPageLayout, StatusPill } from "@/components/common"
import { RecruitmentWorkspaceSkeleton } from "@/components/features/recruitment/recruitment-workspace-skeleton"
import { RequisitionCreatePostingButton } from "@/components/features/recruitment/requisition-detail/RequisitionCreatePostingButton"
import { RequisitionDetailDialogs } from "@/components/features/recruitment/requisition-detail/RequisitionDetailDialogs"
import { RequisitionDetailTabsContent } from "@/components/features/recruitment/requisition-detail/RequisitionDetailTabsContent"
import {
  REQUISITION_DETAIL_TABS,
  useRequisitionDetail,
} from "@/hooks/recruitment/use-requisition-detail"
import { extractErrorMessage } from "@/utils/error-helper"

import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for Requisition Details.
 * Pure composition shell connecting useRequisitionDetail with detail tabs, actions, and dialogs.
 */
export default function RequisitionDetailPage() {
  const navigate = useNavigate()

  const {
    id,
    activeTab,
    workspace,
    requisition,
    requisitionStatusLabel,
    requisitionStatusVariant,
    requisitionSubtitle,
    postings,
    applications,
    activities,
    filteredCandidates,
    stageCounts,
    search,
    setSearch,
    isPostingOpen,
    setIsPostingOpen,
    handlePostingOpenChange,
    selectedPosting,
    setSelectedPosting,
    selectedAppId,
    setSelectedAppId,
    isLoading,
    error,
    handleTabChange,
    publishMutation,
    syncMutation,
    canManagePosting,
    canManageIntake,
    canCreate,
    invalidateWorkspace,
  } = useRequisitionDetail()

  if (isLoading) {
    return <RecruitmentWorkspaceSkeleton />
  }

  if (error || !workspace || !requisition) {
    return (
      <DetailNotFound
        title="Không tải được yêu cầu tuyển dụng"
        description={error ? extractErrorMessage(error) : "Dữ liệu workspace trống hoặc đã bị xóa."}
        onBack={() => navigate(-1)}
      />
    )
  }

  return (
    <>
      <DetailPageLayout
        title={requisition.title}
        subtitle={requisitionSubtitle}
        backHref="/recruitment/requisitions"
        backLabel="Yêu cầu tuyển dụng"
        statusBadge={
          <StatusPill label={requisitionStatusLabel} variant={requisitionStatusVariant} />
        }
        actions={
          <RequisitionCreatePostingButton
            canManagePosting={canManagePosting}
            onClick={() => setIsPostingOpen(true)}
          />
        }
        tabs={{
          items: REQUISITION_DETAIL_TABS.map((t) => ({ id: t.id, label: t.label })),
          activeTab,
          onTabChange: handleTabChange,
        }}
      >
        <RequisitionDetailTabsContent
          activeTab={activeTab}
          requisition={requisition}
          applications={applications}
          stageCounts={stageCounts}
          postings={postings}
          onPublish={(postingId) => publishMutation.mutate(postingId)}
          isPublishing={publishMutation.isPending}
          canManagePosting={canManagePosting}
          onSync={(postingId) => syncMutation.mutate(postingId)}
          isSyncing={syncMutation.isPending}
          canManageIntake={canManageIntake}
          onOpenPosting={setSelectedPosting}
          filteredCandidates={filteredCandidates}
          search={search}
          onSearchChange={setSearch}
          onSelectCandidate={(appId) => navigate(`/recruitment/applications/${appId}`)}
          requisitionId={id}
          canCreate={canCreate}
          onInvalidateWorkspace={invalidateWorkspace}
          activities={activities}
        />
      </DetailPageLayout>

      <RequisitionDetailDialogs
        isPostingOpen={isPostingOpen}
        onPostingOpenChange={handlePostingOpenChange}
        requisition={requisition}
        requisitionId={id}
        selectedPosting={selectedPosting}
        setSelectedPosting={setSelectedPosting}
        selectedAppId={selectedAppId}
        setSelectedAppId={setSelectedAppId}
      />
    </>
  )
}
