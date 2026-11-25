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
import { Pencil } from "lucide-react"
import { InterviewRoundFields } from "./InterviewRoundFields"

export interface EditInterviewRoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTitle: string
  setEditTitle: (v: string) => void
  editFormat: string
  setEditFormat: (v: string) => void
  editDuration: string
  setEditDuration: (v: string) => void
  editScheduledAt: string
  setEditScheduledAt: (v: string) => void
  editInterviewerId: string
  setEditInterviewerId: (v: string) => void
  dynamicStages: RecruitmentPipelineStage[]
  employees: Employee[]
  onSubmit: () => void
  isPending: boolean
}

/**
 * Modal dialog for updating existing interview round properties (title, time, format, interviewer).
 */
export function EditInterviewRoundDialog({
  open,
  onOpenChange,
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
  dynamicStages,
  employees,
  onSubmit,
  isPending,
}: EditInterviewRoundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-2xs">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cập nhật thông tin vòng phỏng vấn
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chỉnh sửa thời gian, hình thức hoặc người phỏng vấn
              </p>
            </div>
          </div>
        </DialogHeader>

        <InterviewRoundFields
          title={editTitle}
          setTitle={setEditTitle}
          formatVal={editFormat}
          setFormatVal={setEditFormat}
          duration={editDuration}
          setDuration={setEditDuration}
          scheduledAt={editScheduledAt}
          setScheduledAt={setEditScheduledAt}
          interviewerId={editInterviewerId}
          setInterviewerId={setEditInterviewerId}
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
            disabled={!editTitle.trim() || !editScheduledAt || isPending}
            className="h-9 rounded-full bg-primary px-6 text-xs font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
          >
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
