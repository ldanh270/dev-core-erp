import { DatePicker, TimePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSubmitPayslipFeedback } from "@/hooks/payroll/use-my-payslips"

import { useEffect, useState } from "react"

import { toast } from "sonner"

interface PayslipFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payslipId: string
  initialDate?: string
}

/**
 * Dialog enabling employees to submit inquiries or dispute calculations on their payslip.
 */
export function PayslipFeedbackDialog({
  open,
  onOpenChange,
  payslipId,
  initialDate = "",
}: PayslipFeedbackDialogProps) {
  const submitFeedback = useSubmitPayslipFeedback()
  const [feedbackDate, setFeedbackDate] = useState(initialDate)
  const [feedbackReason, setFeedbackReason] = useState("")
  const [checkInAt, setCheckInAt] = useState("")
  const [checkOutAt, setCheckOutAt] = useState("")

  useEffect(() => {
    if (open) {
      setFeedbackDate(initialDate)
      setFeedbackReason("")
      setCheckInAt("")
      setCheckOutAt("")
    }
  }, [open, initialDate])

  const handleSubmit = () => {
    if (!feedbackDate || !feedbackReason.trim()) {
      toast.error("Chọn ngày và nhập nội dung feedback")
      return
    }
    submitFeedback.mutate(
      {
        payslipId,
        payload: {
          date: feedbackDate,
          reason: feedbackReason,
          checkInAt: checkInAt || null,
          checkOutAt: checkOutAt || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi feedback phiếu lương")
          onOpenChange(false)
        },
        onError: () => {
          toast.error("Không gửi được feedback. Kiểm tra ngày có ca làm rồi thử lại.")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] rounded-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-base">Feedback phiếu lương</DialogTitle>
          <DialogDescription className="text-sm">
            Chọn ngày bị sai và mô tả vấn đề để HR kiểm tra trước khi chốt lương.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-4 space-y-3">
          <div className="space-y-2">
            <Label
              htmlFor="payroll-feedback-date"
              className="text-xs font-medium text-muted-foreground"
            >
              Ngày sai lệch
            </Label>
            <DatePicker
              id="payroll-feedback-date"
              value={feedbackDate || null}
              onChange={(val) => {
                setFeedbackDate(val || "")
              }}
              placeholder="Chọn ngày sai lệch..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="payroll-feedback-check-in"
                className="text-xs font-medium text-muted-foreground"
              >
                Giờ vào đúng
              </Label>
              <TimePicker
                id="payroll-feedback-check-in"
                value={checkInAt}
                onChange={setCheckInAt}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="payroll-feedback-check-out"
                className="text-xs font-medium text-muted-foreground"
              >
                Giờ ra đúng
              </Label>
              <TimePicker
                id="payroll-feedback-check-out"
                value={checkOutAt}
                onChange={setCheckOutAt}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="payroll-feedback-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              Nội dung
            </Label>
            <Textarea
              id="payroll-feedback-reason"
              value={feedbackReason}
              onChange={(event) => {
                setFeedbackReason(event.target.value)
              }}
              placeholder="Ví dụ: ngày này em có làm nhưng hệ thống tính thiếu giờ..."
              className="min-h-24 resize-none rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Huỷ
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            onClick={handleSubmit}
            disabled={submitFeedback.isPending}
          >
            Gửi feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
