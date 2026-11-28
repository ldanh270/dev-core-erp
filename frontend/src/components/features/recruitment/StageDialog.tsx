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
import { POSTING_STAGE_COLORS } from "@/hooks/recruitment/use-posting-kanban"

import type { FormEventHandler } from "react"

import { Check, Sparkles } from "lucide-react"

export interface StageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  onSubmit: FormEventHandler
  name: string
  setName: (name: string) => void
  color: string
  setColor: (color: string) => void
  completed: boolean
  setCompleted: (value: boolean) => void
  isDefault: boolean
  setDefault: (value: boolean) => void
  defaultDisabled?: boolean
  pending: boolean
}

/**
 * Modal dialog for configuring recruitment pipeline stages: title, color swatch,
 * default initial stage designation, and completion flags.
 */
export function StageDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  onSubmit,
  name,
  setName,
  color,
  setColor,
  completed,
  setCompleted,
  isDefault,
  setDefault,
  defaultDisabled,
  pending,
}: StageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="size-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Tên cột trạng thái</Label>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
              }}
              placeholder="Ví dụ: Đang đợi, QC, Hoàn tất..."
              required
              className="h-9 rounded-lg border-border text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
            <div className="flex flex-wrap gap-2.5">
              {POSTING_STAGE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c)
                  }}
                  className={`relative size-6 shrink-0 rounded-full border transition-all ${
                    color === c
                      ? "scale-110 border-transparent ring-2 ring-primary/45"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Check className="absolute inset-0 m-auto size-3 font-black text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border/40 pt-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={completed}
                onChange={(event) => {
                  setCompleted(event.target.checked)
                }}
                className="size-4 rounded border-border text-primary"
              />
              Đánh dấu là cột hoàn thành (isCompleted)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => {
                  setDefault(event.target.checked)
                }}
                disabled={defaultDisabled}
                className="size-4 rounded border-border text-primary disabled:opacity-40"
              />
              Trạng thái mặc định khi tạo ứng viên (isDefault)
            </label>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="h-9 rounded-full text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
