import { PageContainer } from "@/components/common"
import { ApplicationDetailDialogs } from "@/components/features/recruitment/application-detail/ApplicationDetailDialogs"
import { ApplicationDetailHeader } from "@/components/features/recruitment/application-detail/ApplicationDetailHeader"
import {
  ApplicationDetailSkeleton,
  ApplicationNotFound,
} from "@/components/features/recruitment/application-detail/ApplicationDetailStates"
import { ApplicationDetailTabs } from "@/components/features/recruitment/application-detail/ApplicationDetailTabs"
import { ApplicationPipelineStepper } from "@/components/features/recruitment/application-detail/ApplicationPipelineStepper"
import { ApplicationSidebarPanel } from "@/components/features/recruitment/application-detail/ApplicationSidebarPanel"
import { useApplicationDetail } from "@/hooks/recruitment/use-application-detail"

import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

/**
 * Tier 2 Page Orchestrator for full-page Application Details.
 * Orchestrates pipeline stepper, application tabs, sidebar panel, and action dialogs.
 */
export default function ApplicationDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    applicationId,
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
    // Schedule form state
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
    // Edit round form state
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
    // Handlers & mutations
    handleOpenEditRound,
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
    return <ApplicationNotFound onBack={() => navigate(-1)} />
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

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <ApplicationDetailTabs
            application={application}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            interviews={interviews}
            isLoadingInterviews={isLoadingInterviews}
            notes={notes}
            isLoadingNotes={isLoadingNotes}
            employees={employees}
            canManage={canManage}
            noteText={noteText}
            setNoteText={setNoteText}
            onScheduleInterview={() => setIsScheduleModalOpen(true)}
            onEditRound={handleOpenEditRound}
            onCreateOffer={() => setIsOfferDialogOpen(true)}
            onAddNote={(text) => addNoteMutation.mutate(text)}
            isAddingNote={addNoteMutation.isPending}
          />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <ApplicationSidebarPanel
            application={application}
            employees={employees}
            onStatusChange={(status) => updateStatusMutation.mutate(status)}
            isStatusUpdating={updateStatusMutation.isPending}
            onAssignRecruiter={(empId) => assignRecruiterMutation.mutate(empId)}
            isAssignUpdating={assignRecruiterMutation.isPending}
          />
        </div>
      </div>

      <ApplicationDetailDialogs
        application={application}
        isOfferDialogOpen={isOfferDialogOpen}
        setIsOfferDialogOpen={setIsOfferDialogOpen}
        onOfferCreated={() => {
          void queryClient.invalidateQueries({
            queryKey: ["recruitment", "application", applicationId],
          })
        }}
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
