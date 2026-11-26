import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RecruitmentPipelineStage } from "@/types/recruitment.types"

import { AlertCircle, RefreshCw } from "lucide-react"

interface DeleteColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedColumn: RecruitmentPipelineStage | null
  fallbackColumnId: string
  setFallbackColumnId: (id: string) => void
  statuses: RecruitmentPipelineStage[]
  onConfirm: () => void
  isPending: boolean
}

/**
 * Confirmation dialog for deleting a pipeline stage, requiring safe fallback
 * stage selection to reassign existing candidate applications.
 */
export function DeleteColumnDialog({
  open,
  onOpenChange,
  selectedColumn,
  fallbackColumnId,
  setFallbackColumnId,
  statuses,
  onConfirm,
  isPending,
}: DeleteColumnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
            <AlertCircle className="size-4" />
            Xóa cột trạng thái?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 text-xs">
          <p className="leading-relaxed text-muted-foreground">
            Bạn đang yêu cầu xóa trạng thái{" "}
            <span className="font-bold text-foreground">“{selectedColumn?.name}”</span>. Các ứng
            viên thuộc cột này sẽ được chuyển sang cột thay thế.
          </p>
          <div className="space-y-2 rounded-xl border border-border/50 bg-secondary/35 p-3.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <RefreshCw className="mr-1 inline size-3" />
              Chuyển ứng viên hiện tại sang cột:
            </Label>
            <Select value={fallbackColumnId} onValueChange={setFallbackColumnId}>
              <SelectTrigger className="h-9 rounded-full border-border bg-background text-xs">
                <SelectValue placeholder="Chọn cột thay thế..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                {statuses
                  .filter((stage) => stage.id !== selectedColumn?.id)
                  .map((stage) => (
                    <SelectItem
                      key={stage.id}
                      value={stage.id}
                      className="rounded-lg text-xs font-semibold"
                    >
                      {stage.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-full text-xs"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending || !fallbackColumnId}
            className="h-9 rounded-full px-4 text-xs font-bold"
          >
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
