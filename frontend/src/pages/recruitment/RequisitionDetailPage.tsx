import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { StatusPill } from "@/components/common/status-pill"
import { RecruitmentWorkspaceSkeleton } from "@/components/features/recruitment/recruitment-workspace-skeleton"
import { RequisitionDetailDialogs } from "@/components/features/recruitment/requisition-detail/RequisitionDetailDialogs"
import { RequisitionDetailTabsContent } from "@/components/features/recruitment/requisition-detail/RequisitionDetailTabsContent"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  REQUISITION_DETAIL_TABS,
  useRequisitionDetail,
} from "@/hooks/recruitment/use-requisition-detail"
import { extractErrorMessage } from "@/utils/error-helper"

import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for Requisition Details.
 * Composes requisition overview, candidates, kanban, interviews, offers, and dialogs.
 */
export default function RequisitionDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    id,
    activeTab,
    workspace,
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
  } = useRequisitionDetail()

  if (isLoading) return <RecruitmentWorkspaceSkeleton />

  if (error || !workspace) {
    return (
      <div className="container space-y-3 p-8">
        <p className="font-semibold text-destructive">Không tải được yêu cầu tuyển dụng.</p>
        <p className="text-sm text-muted-foreground">
          {error ? extractErrorMessage(error) : "Dữ liệu workspace trống."}
        </p>
      </div>
    )
  }

  const { requisition } = workspace
  const requisitionStatusLabel =
    requisition.status === "approved" ? "Đã duyệt" : requisition.status
  const requisitionStatusVariant = requisition.status === "approved" ? "success" : "neutral"
  const requisitionSubtitle = `${requisition.code} · ${requisition.department || "Chưa có phòng ban"} · ${requisition.position?.name ?? requisition.positionLevel}`

  const invalidateWorkspace = () => {
    void queryClient.invalidateQueries({
      queryKey: ["recruitment", "requisition-workspace", id],
    })
  }

  return (
    <>
      <DetailPageLayout
        title={requisition.title}
        subtitle={requisitionSubtitle}
        backHref="/recruitment/requisitions"
        backLabel="Yêu cầu tuyển dụng"
        statusBadge={<StatusPill label={requisitionStatusLabel} variant={requisitionStatusVariant} />}
        actions={
          <Button
            className="rounded-full"
            onClick={() => setIsPostingOpen(true)}
            disabled={!canManagePosting}
          >
            <Plus className="mr-2 size-4" />
            Tạo bài đăng
          </Button>
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
