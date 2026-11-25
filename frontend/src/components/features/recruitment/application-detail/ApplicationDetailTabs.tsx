import { ApplicationInterviewsTab } from "@/components/features/recruitment/application-detail/ApplicationInterviewsTab"
import { ApplicationNotesTab } from "@/components/features/recruitment/application-detail/ApplicationNotesTab"
import { ApplicationOffersTab } from "@/components/features/recruitment/application-detail/ApplicationOffersTab"
import { ApplicationOverviewTab } from "@/components/features/recruitment/application-detail/ApplicationOverviewTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Employee } from "@/types/employee.types"
import type {
  ApplicationNote,
  InterviewRound,
  RecruitmentApplication,
} from "@/types/recruitment.types"

interface ApplicationDetailTabsProps {
  application: RecruitmentApplication
  activeTab: string
  setActiveTab: (tab: string) => void
  interviews: InterviewRound[]
  isLoadingInterviews: boolean
  notes: ApplicationNote[]
  isLoadingNotes: boolean
  employees: Employee[]
  canManage: boolean
  noteText: string
  setNoteText: (text: string) => void
  onScheduleInterview: () => void
  onEditRound: (round: InterviewRound) => void
  onCreateOffer: () => void
  onAddNote: (text: string) => void
  isAddingNote: boolean
}

/**
 * Pure UI presentational tab navigator switching between Application Overview,
 * Interview rounds, Offer history, and collaborative internal Notes.
 */
export function ApplicationDetailTabs({
  application,
  activeTab,
  setActiveTab,
  interviews,
  isLoadingInterviews,
  notes,
  isLoadingNotes,
  employees,
  canManage,
  noteText,
  setNoteText,
  onScheduleInterview,
  onEditRound,
  onCreateOffer,
  onAddNote,
  isAddingNote,
}: ApplicationDetailTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="inline-flex max-w-full overflow-x-auto rounded-full border border-border/40 bg-secondary p-1">
        <TabsTrigger
          value="overview"
          className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Tổng quan
        </TabsTrigger>
        <TabsTrigger
          value="interviews"
          className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Vòng phỏng vấn ({interviews.length})
        </TabsTrigger>
        <TabsTrigger
          value="offers"
          className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Offer
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Ghi chú ({notes.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="m-0 space-y-6">
        <ApplicationOverviewTab application={application} />
      </TabsContent>

      <TabsContent value="interviews" className="m-0 space-y-4">
        <ApplicationInterviewsTab
          interviews={interviews}
          isLoadingInterviews={isLoadingInterviews}
          canManage={canManage}
          employees={employees}
          onScheduleInterview={onScheduleInterview}
          onEditRound={onEditRound}
        />
      </TabsContent>

      <TabsContent value="offers" className="m-0 space-y-4">
        <ApplicationOffersTab
          offers={application.offers}
          canManage={canManage}
          onCreateOffer={onCreateOffer}
        />
      </TabsContent>

      <TabsContent value="notes" className="m-0 space-y-4">
        <ApplicationNotesTab
          notes={notes}
          isLoadingNotes={isLoadingNotes}
          noteText={noteText}
          setNoteText={setNoteText}
          onAddNote={onAddNote}
          isPending={isAddingNote}
        />
      </TabsContent>
    </Tabs>
  )
}
