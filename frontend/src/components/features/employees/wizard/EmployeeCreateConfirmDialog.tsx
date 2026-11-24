import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

export interface EmployeeCreateConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onConfirm: () => void
}

/**
 * Confirmation dialog triggered before submitting the final employee creation wizard payload.
 */
export function EmployeeCreateConfirmDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: EmployeeCreateConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-xl text-center">
        <DialogHeader className="items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <HelpCircle size={28} />
          </div>
          <DialogTitle className="text-center font-bold text-lg">Xác nhận</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground pt-1">
            Xác nhận tạo mới nhân sự
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-center gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full min-w-24"
            disabled={isSubmitting}
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="rounded-full min-w-24 bg-primary text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Đồng ý"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
