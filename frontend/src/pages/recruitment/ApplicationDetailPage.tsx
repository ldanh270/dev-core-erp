import { DetailNotFound, PageContainer } from "@/components/common"
import { ApplicationDetailBody } from "@/components/features/recruitment/application-detail/ApplicationDetailBody"
import { ApplicationDetailDialogs } from "@/components/features/recruitment/application-detail/ApplicationDetailDialogs"
import { ApplicationDetailHeader } from "@/components/features/recruitment/application-detail/ApplicationDetailHeader"
import { ApplicationDetailSkeleton } from "@/components/features/recruitment/application-detail/ApplicationDetailStates"
import { ApplicationPipelineStepper } from "@/components/features/recruitment/application-detail/ApplicationPipelineStepper"
import { useApplicationDetail } from "@/hooks/recruitment/use-application-detail"

import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for full-page Application Details.
 * Orchestrates pipeline stepper, application tabs, sidebar panel, and action dialogs.
 */
export default function ApplicationDetailPage() {
  const navigate = useNavigate()

  const {
    application,
    isLoading,
    interviews,
    isLoadingInterviews,
    notes,
    isLoadingNotes,
    employees,
    dynamicStages,
    canManage,
    activeTab,
    setActiveTab,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isOfferDialogOpen,
    setIsOfferDialogOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    noteText,
    setNoteText,
    roundTitle,
    setRoundTitle,
    roundFormat,
    setRoundFormat,
    roundScheduledAt,
    setRoundScheduledAt,
    roundDuration,
    setRoundDuration,
    roundInterviewerId,
    setRoundInterviewerId,
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
    handleOpenEditRound,
    handleOfferCreated,
    addNoteMutation,
    updateStatusMutation,
    assignRecruiterMutation,
    createInterviewMutation,
    updateInterviewRoundMutation,
  } = useApplicationDetail()

  if (isLoading) {
    return <ApplicationDetailSkeleton />
  }

  if (!application) {
    return (
      <DetailNotFound
        title="Không tìm thấy ứng viên"
        description="Hồ sơ ứng tuyển không tồn tại hoặc đã bị xóa."
        onBack={() => navigate(-1)}
      />
    )
  }

  return (
    <PageContainer className="space-y-6">
      <ApplicationDetailHeader
        application={application}
        canManage={canManage}
        onScheduleInterview={() => setIsScheduleModalOpen(true)}
        onAddNote={() => setActiveTab("notes")}
      />

      <ApplicationPipelineStepper
        application={application}
        dynamicStages={dynamicStages}
        interviews={interviews}
      />

      <ApplicationDetailBody
        application={application}
        employees={employees}
        canManage={canManage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        interviews={interviews}
        isLoadingInterviews={isLoadingInterviews}
        notes={notes}
        isLoadingNotes={isLoadingNotes}
        noteText={noteText}
        setNoteText={setNoteText}
        onScheduleInterview={() => setIsScheduleModalOpen(true)}
        onEditRound={handleOpenEditRound}
        onCreateOffer={() => setIsOfferDialogOpen(true)}
        onAddNote={(text) => addNoteMutation.mutate(text)}
        isAddingNote={addNoteMutation.isPending}
        onStatusChange={(status) => updateStatusMutation.mutate(status)}
        isStatusUpdating={updateStatusMutation.isPending}
        onAssignRecruiter={(empId) => assignRecruiterMutation.mutate(empId)}
        isAssignUpdating={assignRecruiterMutation.isPending}
      />

      <ApplicationDetailDialogs
        application={application}
        isOfferDialogOpen={isOfferDialogOpen}
        setIsOfferDialogOpen={setIsOfferDialogOpen}
        onOfferCreated={handleOfferCreated}
        isScheduleModalOpen={isScheduleModalOpen}
        setIsScheduleModalOpen={setIsScheduleModalOpen}
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
        onCreateInterview={() => createInterviewMutation.mutate()}
        isCreatingInterview={createInterviewMutation.isPending}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
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
        onUpdateRound={() => updateInterviewRoundMutation.mutate()}
        isUpdatingRound={updateInterviewRoundMutation.isPending}
      />
    </PageContainer>
  )
}
