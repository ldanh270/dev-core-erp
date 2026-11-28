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

import { useState } from "react"

import { toast } from "sonner"

interface CustomAllowanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddAllowanceOption: (name: string) => void
}

export function CustomAllowanceModal({
  open,
  onOpenChange,
  onAddAllowanceOption,
}: CustomAllowanceModalProps) {
  const [newAllowanceName, setNewAllowanceName] = useState("")

  const handleCreateCustomAllowance = () => {
    if (!newAllowanceName.trim()) return
    const name = newAllowanceName.trim()
    onAddAllowanceOption(name)
    setNewAllowanceName("")
    onOpenChange(false)
    toast.success(`Đã thêm khoản phụ cấp mới: ${name}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Tạo mới khoản phụ cấp</DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-2">
          <Label className="text-xs font-medium">Tên khoản phụ cấp</Label>
          <Input
            placeholder="VD: Phụ cấp độc hại, Phụ cấp chuyên cần..."
            value={newAllowanceName}
            onChange={(e) => {
              setNewAllowanceName(e.target.value)
            }}
            className="rounded-full"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
            }}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleCreateCustomAllowance}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
