import { CreateJobPostingDialog } from "@/components/features/recruitment/CreateJobPostingDialog"
import { ApplicationDetailPanel } from "@/components/features/recruitment/application-detail-panel"
import { ViewJobPostingDialog } from "@/components/features/recruitment/view-job-posting-dialog"
import type { JobPosting, JobRequisition } from "@/types/recruitment.types"

interface RequisitionDetailDialogsProps {
  isPostingOpen: boolean
  onPostingOpenChange: (open: boolean) => void
  requisition: JobRequisition
  requisitionId: string
  selectedPosting: JobPosting | null
  setSelectedPosting: (posting: JobPosting | null) => void
  selectedAppId: string | null
  setSelectedAppId: (id: string | null) => void
}

/**
 * Encapsulates modal dialogs and slide-over panels for requisition detail views,
 * including posting creation, posting details, and candidate application review.
 */
export function RequisitionDetailDialogs({
  isPostingOpen,
  onPostingOpenChange,
  requisition,
  requisitionId,
  selectedPosting,
  setSelectedPosting,
  selectedAppId,
  setSelectedAppId,
}: RequisitionDetailDialogsProps) {
  return (
    <>
      <CreateJobPostingDialog
        open={isPostingOpen}
        onOpenChange={onPostingOpenChange}
        jobRequisitions={[requisition]}
        initialRequisitionId={requisitionId}
      />

      <ViewJobPostingDialog
        open={Boolean(selectedPosting)}
        onOpenChange={(open) => {
          if (!open) setSelectedPosting(null)
        }}
        posting={selectedPosting}
      />

      <ApplicationDetailPanel
        open={Boolean(selectedAppId)}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null)
        }}
        applicationId={selectedAppId}
      />
    </>
  )
}
