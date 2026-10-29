import { StatusPill } from "@/components/common/status-pill"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BGC_GROUP_LABELS, BGC_STATUS_LABELS } from "@/config/entities/recruitment.config"
import type { BackgroundCheck } from "@/types/recruitment.types"

import { ShieldCheck, UserCheck } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  backgroundCheck: BackgroundCheck | null
}

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning",
  in_progress: "info",
  completed: "info",
  passed: "success",
  failed: "danger",
}

export function ViewBackgroundCheckDialog({ open, onOpenChange, backgroundCheck }: Props) {
  if (!backgroundCheck) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-xl border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full border-primary text-primary">
              {BGC_GROUP_LABELS[backgroundCheck.group] || `Nhóm ${backgroundCheck.group}`}
            </Badge>
            <StatusPill
              label={BGC_STATUS_LABELS[backgroundCheck.status] || backgroundCheck.status}
              variant={
                statusVariantMap[backgroundCheck.status as keyof typeof statusVariantMap] ??
                "neutral"
              }
            />
          </div>
          <DialogTitle className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            Kiểm tra thông tin (Background Check)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-3 text-sm">
          <div className="rounded-lg bg-muted/30 p-4 border border-border space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Ứng viên</span>
              <span className="text-sm font-semibold text-foreground">
                {backgroundCheck.candidateName}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Vị trí tuyển dụng
              </span>
              <span className="text-sm font-medium text-foreground">
                {backgroundCheck.positionTitle}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Người thẩm định / kiểm tra
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {backgroundCheck.verifiedByName || "Chưa phân công"}
                </span>
              </div>
            </div>
          </div>

          {backgroundCheck.remarks && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground block font-medium">
                Ghi chú / Kết quả thẩm định
              </span>
              <div className="rounded-lg bg-muted/20 p-3 border border-border text-xs text-foreground whitespace-pre-wrap">
                {backgroundCheck.remarks}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div>
              <span>Ngày bắt đầu: </span>
              <span className="font-medium text-foreground">
                {backgroundCheck.createdAt
                  ? new Date(backgroundCheck.createdAt).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div>
              <span>Hoàn thành: </span>
              <span className="font-medium text-foreground">
                {backgroundCheck.completedAt
                  ? new Date(backgroundCheck.completedAt).toLocaleDateString("vi-VN")
                  : "Chưa xong"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-muted"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
