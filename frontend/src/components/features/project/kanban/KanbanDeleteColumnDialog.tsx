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
import type { ProjectTaskStatus } from "@/types/project-task-status.types"

import { AlertCircle, RefreshCw } from "lucide-react"

interface KanbanDeleteColumnDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedColumn: ProjectTaskStatus | null
  statuses: ProjectTaskStatus[]
  fallbackColumnId: string
  setFallbackColumnId: (id: string) => void
  onConfirmDelete: () => void
  isDeleting: boolean
}

/** Confirmation dialog for deleting a Kanban workflow status column. */
export function KanbanDeleteColumnDialog({
  isOpen,
  onOpenChange,
  selectedColumn,
  statuses,
  fallbackColumnId,
  setFallbackColumnId,
  onConfirmDelete,
  isDeleting,
}: KanbanDeleteColumnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Xóa cột trạng thái?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Bạn đang yêu cầu xóa trạng thái{" "}
            <span className="font-bold text-foreground">&quot;{selectedColumn?.name}&quot;</span>.
            Các công việc thuộc cột này sẽ bị ảnh hưởng.
          </p>

          {statuses.length > 1 && (
            <div className="space-y-2 bg-secondary/35 border border-border/50 rounded-xl p-3.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <RefreshCw className="size-3" />
                Chuyển công việc hiện tại sang cột:
              </Label>
              <Select value={fallbackColumnId} onValueChange={setFallbackColumnId}>
                <SelectTrigger className="w-full h-9 border-border rounded-full text-xs bg-background">
                  <SelectValue placeholder="Chọn cột thay thế..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {statuses
                    .filter((s) => s.id !== selectedColumn?.id)
                    .map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        className="rounded-lg text-xs font-semibold"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-full"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting || (statuses.length > 1 && !fallbackColumnId)}
            className="h-9 text-xs rounded-full font-bold px-4"
          >
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
