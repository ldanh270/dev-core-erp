import { EditInterviewRoundDialog } from "@/components/features/recruitment/application-detail/EditInterviewRoundDialog"
import { ScheduleInterviewDialog } from "@/components/features/recruitment/application-detail/ScheduleInterviewDialog"
import { CreateOfferDialog } from "@/components/features/recruitment/create-offer-dialog"
import type { Employee } from "@/types/employee.types"
import type {
  KanbanApplication,
  RecruitmentApplication,
  RecruitmentPipelineStage,
} from "@/types/recruitment.types"

export interface ApplicationDetailDialogsProps {
  application: RecruitmentApplication
  /** Offer creation dialog state and callbacks */
  isOfferDialogOpen: boolean
  setIsOfferDialogOpen: (open: boolean) => void
  onOfferCreated: () => void
  /** Interview round scheduling dialog state and form controls */
  isScheduleModalOpen: boolean
  setIsScheduleModalOpen: (open: boolean) => void
  roundTitle: string
  setRoundTitle: (val: string) => void
  roundFormat: string
  setRoundFormat: (val: string) => void
  roundDuration: string
  setRoundDuration: (val: string) => void
  roundScheduledAt: string
  setRoundScheduledAt: (val: string) => void
  roundInterviewerId: string
  setRoundInterviewerId: (val: string) => void
  dynamicStages: RecruitmentPipelineStage[]
  employees: Employee[]
  onCreateInterview: () => void
  isCreatingInterview: boolean
  /** Interview round editing dialog state and form controls */
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  editTitle: string
  setEditTitle: (val: string) => void
  editFormat: string
  setEditFormat: (val: string) => void
  editDuration: string
  setEditDuration: (val: string) => void
  editScheduledAt: string
  setEditScheduledAt: (val: string) => void
  editInterviewerId: string
  setEditInterviewerId: (val: string) => void
  onUpdateRound: () => void
  isUpdatingRound: boolean
}

/**
 * Pure UI presenter orchestrating dialogs for candidate application management,
 * including creating offers, scheduling interview rounds, and editing rounds.
 */
export function ApplicationDetailDialogs({
  application,
  isOfferDialogOpen,
  setIsOfferDialogOpen,
  onOfferCreated,
  isScheduleModalOpen,
  setIsScheduleModalOpen,
  roundTitle,
  setRoundTitle,
  roundFormat,
  setRoundFormat,
  roundDuration,
  setRoundDuration,
  roundScheduledAt,
  setRoundScheduledAt,
  roundInterviewerId,
  setRoundInterviewerId,
  dynamicStages,
  employees,
  onCreateInterview,
  isCreatingInterview,
  isEditModalOpen,
  setIsEditModalOpen,
  editTitle,
  setEditTitle,
  editFormat,
  setEditFormat,
  editDuration,
  setEditDuration,
  editScheduledAt,
  setEditScheduledAt,
  editInterviewerId,
  setEditInterviewerId,
  onUpdateRound,
  isUpdatingRound,
}: ApplicationDetailDialogsProps) {
  return (
    <>
      <CreateOfferDialog
        open={isOfferDialogOpen}
        onOpenChange={setIsOfferDialogOpen}
        applications={[application as unknown as KanbanApplication]}
        onCreated={onOfferCreated}
      />

      <ScheduleInterviewDialog
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        roundTitle={roundTitle}
        setRoundTitle={setRoundTitle}
        roundFormat={roundFormat}
        setRoundFormat={setRoundFormat}
        roundDuration={roundDuration}
        setRoundDuration={setRoundDuration}
        roundScheduledAt={roundScheduledAt}
        setRoundScheduledAt={setRoundScheduledAt}
        roundInterviewerId={roundInterviewerId}
        setRoundInterviewerId={setRoundInterviewerId}
        dynamicStages={dynamicStages}
        employees={employees}
        onSubmit={onCreateInterview}
        isPending={isCreatingInterview}
      />

      <EditInterviewRoundDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editFormat={editFormat}
        setEditFormat={setEditFormat}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editScheduledAt={editScheduledAt}
        setEditScheduledAt={setEditScheduledAt}
        editInterviewerId={editInterviewerId}
        setEditInterviewerId={setEditInterviewerId}
        dynamicStages={dynamicStages}
        employees={employees}
        onSubmit={onUpdateRound}
        isPending={isUpdatingRound}
      />
    </>
  )
}
