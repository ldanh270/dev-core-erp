import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"
import { KanbanColorPicker } from "./ProjectKanbanDialogs"

interface KanbanEditColumnDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  columnName: string
  setColumnName: (name: string) => void
  columnColor: string
  setColumnColor: (color: string) => void
  columnIsCompleted: boolean
  setColumnIsCompleted: (isCompleted: boolean) => void
  columnIsDefault: boolean
  setColumnIsDefault: (isDefault: boolean) => void
  selectedColumn: ProjectTaskStatus | null
  onSubmit: (e: React.FormEvent) => void
  isUpdating: boolean
}

/** Dialog for modifying existing Kanban workflow status column properties. */
export function KanbanEditColumnDialog({
  isOpen,
  onOpenChange,
  columnName,
  setColumnName,
  columnColor,
  setColumnColor,
  columnIsCompleted,
  setColumnIsCompleted,
  columnIsDefault,
  setColumnIsDefault,
  selectedColumn,
  onSubmit,
  isUpdating,
}: KanbanEditColumnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Settings className="size-4 text-primary" />
            Cấu hình cột trạng thái
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-kanban-status-name" className="text-xs font-bold text-foreground">
              Tên cột trạng thái
            </Label>
            <Input
              id="edit-kanban-status-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
              required
              className="h-9 text-xs border-border rounded-full"
            />
          </div>

          <KanbanColorPicker columnColor={columnColor} setColumnColor={setColumnColor} />

          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={columnIsCompleted}
                onChange={(e) => setColumnIsCompleted(e.target.checked)}
                className="size-4 text-primary border-border rounded"
              />
              Đánh dấu là cột hoàn thành (isCompleted)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={columnIsDefault}
                onChange={(e) => setColumnIsDefault(e.target.checked)}
                disabled={selectedColumn?.isDefault}
                className="size-4 text-primary border-border rounded disabled:opacity-40"
              />
              Trạng thái mặc định khi tạo issue (isDefault)
            </label>
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
              disabled={isUpdating}
              className="h-9 text-xs rounded-full font-bold px-4"
            >
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
