import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { useState } from "react"

interface RejectRequisitionDialogProps {
  requisitionCode: string
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}

export function RejectRequisitionDialog({
  requisitionCode,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: RejectRequisitionDialogProps) {
  const [reason, setReason] = useState("")

  const close = (nextOpen: boolean) => {
    if (!nextOpen) setReason("")
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md rounded-xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu {requisitionCode}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="rejection-reason">Lý do từ chối</Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
            }}
            placeholder="Nêu rõ lý do để người tạo có thể xử lý..."
            className="min-h-28 rounded-xl"
            maxLength={500}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              close(false)
            }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={!reason.trim() || pending}
            onClick={() => {
              onConfirm(reason.trim())
            }}
          >
            {pending ? "Đang từ chối..." : "Xác nhận từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
