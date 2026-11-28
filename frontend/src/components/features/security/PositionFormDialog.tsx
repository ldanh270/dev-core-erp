import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { CheckSquare } from "lucide-react"

/**
 * Props for PositionFormDialog component.
 */
export interface PositionFormDialogProps {
  open: boolean
  editingId: string | null
  name: string
  code: string
  description: string
  allowedTrackers: string[]
  trackerLabels: Record<string, string>
  onOpenChange: (open: boolean) => void
  onNameChange: (val: string) => void
  onCodeChange: (val: string) => void
  onDescriptionChange: (val: string) => void
  onToggleTracker: (tracker: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

/**
 * Modal dialog for creating or editing position definitions and tracker authorization rules.
 */
export function PositionFormDialog({
  open,
  editingId,
  name,
  code,
  description,
  allowedTrackers,
  trackerLabels,
  onOpenChange,
  onNameChange,
  onCodeChange,
  onDescriptionChange,
  onToggleTracker,
  onSubmit,
}: PositionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingId ? "Chỉnh sửa chức vụ" : "Thêm chức vụ mới"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Thiết lập tên, mã và cấu hình chi tiết các giới hạn mặc định cho chức vụ này.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void onSubmit(e)
          }}
          className="space-y-6 py-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">
                Tên chức vụ *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  onNameChange(e.target.value)
                }}
                placeholder="Ví dụ: Lập trình viên"
                className="rounded-full h-10 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold">
                Mã chức vụ (Duy nhất) *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => {
                  onCodeChange(e.target.value)
                }}
                placeholder="Ví dụ: developer"
                className="rounded-full h-10 text-sm font-mono"
                disabled={!!editingId}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-bold">
              Mô tả chức vụ
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => {
                onDescriptionChange(e.target.value)
              }}
              placeholder="Nhập mô tả ngắn gọn về vai trò/chức năng của chức vụ này..."
              className="rounded-xl min-h-[60px] text-sm"
            />
          </div>

          <div className="space-y-3 border-t border-border/40 pt-4">
            <div>
              <Label className="text-xs font-black uppercase text-foreground">
                1. Cấu hình loại công việc được tạo (Mặc định)
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">
                Chọn các loại công việc mà chức vụ này được phép tạo (để trống nếu cho phép tạo tất
                cả).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(trackerLabels).map(([key, label]) => {
                  const isChecked = allowedTrackers.includes(key)
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        onToggleTracker(key)
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-full border text-left transition-all duration-200 cursor-pointer ${
                        isChecked
                          ? "bg-primary/5 border-primary text-primary"
                          : "bg-background border-border hover:bg-muted/30"
                      }`}
                    >
                      <CheckSquare
                        className={`size-4 shrink-0 ${isChecked ? "text-primary fill-primary/10" : "text-muted-foreground"}`}
                      />
                      <span className="text-xs font-semibold leading-tight line-clamp-1">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="rounded-full text-xs h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {editingId ? "Cập nhật thay đổi" : "Tạo chức vụ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
