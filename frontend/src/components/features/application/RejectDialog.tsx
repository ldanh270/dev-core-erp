"use client"

import { AppModal } from "@/components/common/app-modal"
import { Button } from "@/components/ui/button"
import type { IApplication } from "@/lib/api/application.api"

import { useState } from "react"

import { toast } from "sonner"

export interface RejectDialogProps {
  app: IApplication
  onCancel: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
  title?: string
  description?: string
  optionalReason?: boolean
}

export function RejectDialog({
  onCancel,
  onConfirm,
  isLoading,
  title = "Lý do không duyệt",
  description = "Vui lòng nhập lý do để nhân viên nắm được thông tin.",
  optionalReason,
}: RejectDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!optionalReason && !reason.trim()) {
      toast.error("Vui lòng nhập lý do không duyệt")
      return
    }
    onConfirm(reason)
  }

  return (
    <AppModal
      isOpen={true}
      onClose={onCancel}
      title={title}
      description={description}
      widthClassName="sm:max-w-md"
      footerActions={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full px-5 font-medium"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              handleSubmit()
            }}
            disabled={isLoading}
            className="rounded-full px-5 font-medium"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận không duyệt"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="reject-reason-input" className="text-sm font-medium text-foreground">
          Lý do {!optionalReason && <span className="text-destructive">*</span>}
        </label>
        <textarea
          id="reject-reason-input"
          rows={3}
          required={!optionalReason}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
          }}
          placeholder="Nhập lý do tại đây..."
          className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </form>
    </AppModal>
  )
}
