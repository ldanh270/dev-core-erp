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

export interface ScheduleInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roundTitle: string
  setRoundTitle: (v: string) => void
  roundFormat: string
  setRoundFormat: (v: string) => void
  roundDuration: string
  setRoundDuration: (v: string) => void
  roundScheduledAt: string
  setRoundScheduledAt: (v: string) => void
  roundInterviewerId: string
  setRoundInterviewerId: (v: string) => void
  dynamicStages: RecruitmentPipelineStage[]
  employees: Employee[]
  onSubmit: () => void
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
            onClick={() => onOpenChange(false)}
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
