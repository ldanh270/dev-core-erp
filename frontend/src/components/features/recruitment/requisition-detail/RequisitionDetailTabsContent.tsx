import { RequisitionActivityTab } from "./RequisitionActivityTab"
import { RequisitionCandidatesTab } from "./RequisitionCandidatesTab"
import { RequisitionOverviewTab } from "./RequisitionOverviewTab"
import { RequisitionPostingsTab } from "./RequisitionPostingsTab"
import { RequisitionBackgroundChecksTab } from "../requisition-workspace/RequisitionBackgroundChecksTab"
import { RequisitionInterviewsTab } from "../requisition-workspace/RequisitionInterviewsTab"
import { RequisitionOffersTab } from "../requisition-workspace/RequisitionOffersTab"
import KanbanPage from "@/pages/recruitment/KanbanPage"
import type {
  JobPosting,
  JobRequisition,
  KanbanApplication,
  RecruitmentPipelineStage,
} from "@/types/recruitment.types"

export interface StageWithCount extends RecruitmentPipelineStage {
  count: number
}

export interface RequisitionActivityItem {
  id: string
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: { fullName: string } | null
}

interface RequisitionDetailTabsContentProps {
  activeTab: string
  requisition: JobRequisition
  applications: KanbanApplication[]
  stageCounts: StageWithCount[]
  postings: JobPosting[]
  onPublish: (postingId: string) => void
  isPublishing: boolean
  canManagePosting: boolean
  onSync: (postingId: string) => void
  isSyncing: boolean
  canManageIntake: boolean
  onOpenPosting: (posting: JobPosting) => void
  filteredCandidates: KanbanApplication[]
  search: string
  onSearchChange: (value: string) => void
  onSelectCandidate: (appId: string) => void
  requisitionId: string
  canCreate: boolean
  onInvalidateWorkspace: () => void
  activities: RequisitionActivityItem[]
}

export function RequisitionDetailTabsContent({
  activeTab,
  requisition,
  applications,
  stageCounts,
  postings,
  onPublish,
  isPublishing,
  canManagePosting,
  onSync,
  isSyncing,
  canManageIntake,
  onOpenPosting,
  filteredCandidates,
  search,
  onSearchChange,
  onSelectCandidate,
  requisitionId,
  canCreate,
  onInvalidateWorkspace,
  activities,
}: RequisitionDetailTabsContentProps) {
  return (
    <>
      {activeTab === "overview" && (
        <RequisitionOverviewTab
          requisition={requisition}
          applications={applications}
          stageCounts={stageCounts}
        />
      )}

      {activeTab === "postings" && (
        <RequisitionPostingsTab
          postings={postings}
          onPublish={onPublish}
          publishing={isPublishing}
          canPublish={canManagePosting}
          onSync={onSync}
          syncing={isSyncing}
          canSync={canManageIntake}
          onOpen={(postingId) => {
            const found = postings.find((p) => p.id === postingId)
            if (found) onOpenPosting(found)
          }}
        />
      )}

      {activeTab === "candidate" && (
        <RequisitionCandidatesTab
          applications={filteredCandidates}
          postings={postings}
          search={search}
          onSearchChange={onSearchChange}
          onSelectCandidate={onSelectCandidate}
        />
      )}

      {activeTab === "kanban" && <KanbanPage requisitionId={requisitionId} embedded />}

      {activeTab === "interviews" && (
        <RequisitionInterviewsTab
          applications={applications}
          canSchedule={canCreate}
          onCreated={onInvalidateWorkspace}
        />
      )}

      {activeTab === "offers" && (
        <RequisitionOffersTab
          applications={applications}
          canCreate={canCreate}
          onCreated={onInvalidateWorkspace}
        />
      )}

      {activeTab === "background-checks" && (
        <RequisitionBackgroundChecksTab applications={applications} />
      )}

      {activeTab === "activity" && <RequisitionActivityTab activities={activities} />}
    </>
  )
}
