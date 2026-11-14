import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useProcessApproval } from "@/hooks/attendance/use-shift-change-requests"

import { useState } from "react"

import { Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  approvalId: string
}

export default function RejectApprovalDialog({ open, onOpenChange, approvalId }: Props) {
  const [reason, setReason] = useState("")
  const mutation = useProcessApproval()

  const handleReject = () => {
    if (!reason.trim()) return
    mutation.mutate(
      { id: approvalId, status: "rejected", rejectReason: reason },
      {
        onSuccess: () => {
          setReason("")
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu</DialogTitle>
          <DialogDescription>Nhập lý do từ chối để thông báo đến nhân viên.</DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
          }}
          placeholder="Lý do từ chối..."
          className="resize-none h-24 mt-2"
        />

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!reason.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
