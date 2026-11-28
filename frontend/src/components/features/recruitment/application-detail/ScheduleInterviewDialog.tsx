import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Employee } from "@/types/employee.types"
import type { RecruitmentPipelineStage } from "@/types/recruitment.types"

import { CalendarClock } from "lucide-react"

import { InterviewRoundFields } from "./InterviewRoundFields"

/**
 * Props for {@link ScheduleInterviewDialog} component.
 */
export interface ScheduleInterviewDialogProps {
  /** Controls open visibility of the modal dialog. */
  open: boolean
  /** Callback fired when dialog open state transitions. */
  onOpenChange: (open: boolean) => void
  /** Title or stage name for the interview round. */
  roundTitle: string
  /** Callback to update interview round title. */
  setRoundTitle: (v: string) => void
  /** Interview format (video call, in-person, phone). */
  roundFormat: string
  /** Callback to update interview format. */
  setRoundFormat: (v: string) => void
  /** Total estimated duration in minutes. */
  roundDuration: string
  /** Callback to update interview duration. */
  setRoundDuration: (v: string) => void
  /** Scheduled date-time string in ISO or local representation. */
  roundScheduledAt: string
  /** Callback to update scheduled date-time. */
  setRoundScheduledAt: (v: string) => void
  /** Unique ID of the interviewer employee. */
  roundInterviewerId: string
  /** Callback to update selected interviewer employee ID. */
  setRoundInterviewerId: (v: string) => void
  /** Recruitment pipeline stages to populate stage options. */
  dynamicStages: RecruitmentPipelineStage[]
  /** Active employees list to populate interviewer options. */
  employees: Employee[]
  /** Submission handler to trigger creation mutation. */
  onSubmit: () => void
  /** Indicates whether the interview creation mutation is pending. */
  isPending: boolean
}

/**
 * Modal dialog for scheduling a new interview round for an active candidate application.
 */
export function ScheduleInterviewDialog({
  open,
  onOpenChange,
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
  onSubmit,
  isPending,
}: ScheduleInterviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Lên lịch phỏng vấn mới
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chọn vòng phỏng vấn (Cột Kanban), thời gian & người phụ trách
              </p>
            </div>
          </div>
        </DialogHeader>

        <InterviewRoundFields
          title={roundTitle}
          setTitle={setRoundTitle}
          formatVal={roundFormat}
          setFormatVal={setRoundFormat}
          duration={roundDuration}
          setDuration={setRoundDuration}
          scheduledAt={roundScheduledAt}
          setScheduledAt={setRoundScheduledAt}
          interviewerId={roundInterviewerId}
          setInterviewerId={setRoundInterviewerId}
          dynamicStages={dynamicStages}
          employees={employees}
        />

        <DialogFooter className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            className="h-9 rounded-full border-border/80 px-5 text-xs font-bold hover:bg-secondary"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!roundTitle.trim() || !roundScheduledAt || isPending}
            className="h-9 rounded-full bg-primary px-6 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
          >
            {isPending ? "Đang tạo..." : "Xác nhận tạo lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
