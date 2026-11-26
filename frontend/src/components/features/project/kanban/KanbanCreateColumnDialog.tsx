import { Sparkles } from "lucide-react"
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
import { KanbanColorPicker } from "./ProjectKanbanDialogs"

interface KanbanCreateColumnDialogProps {
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
  onSubmit: (e: React.FormEvent) => void
  isCreating: boolean
}

/** Dialog for creating a new Kanban workflow status column. */
export function KanbanCreateColumnDialog({
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
  onSubmit,
  isCreating,
}: KanbanCreateColumnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-popover max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Tạo cột trạng thái
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-kanban-status-name" className="text-xs font-bold text-foreground">
              Tên cột trạng thái
            </Label>
            <Input
              id="create-kanban-status-name"
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
                className="size-4 text-primary border-border rounded"
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
              disabled={isCreating}
              className="h-9 text-xs rounded-full font-bold px-4"
            >
              Tạo cột
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
