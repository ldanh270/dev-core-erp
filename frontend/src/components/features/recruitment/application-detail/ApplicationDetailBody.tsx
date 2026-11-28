import { ApplicationDetailTabs } from "@/components/features/recruitment/application-detail/ApplicationDetailTabs"
import { ApplicationSidebarPanel } from "@/components/features/recruitment/application-detail/ApplicationSidebarPanel"
import type { Employee } from "@/types/employee.types"
import type {
  ApplicationNote,
  InterviewRound,
  RecruitmentApplication,
} from "@/types/recruitment.types"

export interface ApplicationDetailBodyProps {
  application: RecruitmentApplication
  employees: Employee[]
  canManage: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
  interviews: InterviewRound[]
  isLoadingInterviews: boolean
  notes: ApplicationNote[]
  isLoadingNotes: boolean
  noteText: string
  setNoteText: (text: string) => void
  onScheduleInterview: () => void
  onEditRound: (round: InterviewRound) => void
  onCreateOffer: () => void
  onAddNote: (text: string) => void
  isAddingNote: boolean
  onStatusChange: (status: string) => void
  isStatusUpdating: boolean
  onAssignRecruiter: (empId: string) => void
  isAssignUpdating: boolean
}

/**
 * Presenter container rendering the dual-column layout for application tabs and sidebar management panel.
 */
export function ApplicationDetailBody({
  application,
  employees,
  canManage,
  activeTab,
  setActiveTab,
  interviews,
  isLoadingInterviews,
  notes,
  isLoadingNotes,
  noteText,
  setNoteText,
  onScheduleInterview,
  onEditRound,
  onCreateOffer,
  onAddNote,
  isAddingNote,
  onStatusChange,
  isStatusUpdating,
  onAssignRecruiter,
  isAssignUpdating,
}: ApplicationDetailBodyProps) {
  return (
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
          onScheduleInterview={onScheduleInterview}
          onEditRound={onEditRound}
          onCreateOffer={onCreateOffer}
          onAddNote={onAddNote}
          isAddingNote={isAddingNote}
        />
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-4">
        <ApplicationSidebarPanel
          application={application}
          employees={employees}
          onStatusChange={onStatusChange}
          isStatusUpdating={isStatusUpdating}
          onAssignRecruiter={onAssignRecruiter}
          isAssignUpdating={isAssignUpdating}
        />
      </div>
    </div>
  )
}
