import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { IPayslipTemplate } from "@/types/payroll.types"

interface DeletePayslipTemplateDialogProps {
  template: IPayslipTemplate | null
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

/**
 * Confirmation dialog for permanently deleting an unassigned payslip template.
 */
export function DeletePayslipTemplateDialog({
  template,
  onClose,
  onConfirm,
  isDeleting,
}: DeletePayslipTemplateDialogProps) {
  return (
    <Dialog open={Boolean(template)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Xác nhận xoá</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-4 text-base">
            Bạn có chắc chắn muốn xoá mẫu phiếu lương{" "}
            <span className="font-semibold text-foreground">{template?.name}</span>? Hành động này
            không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-full border-border hover:bg-accent px-6 shadow-none cursor-pointer"
            onClick={onClose}
            disabled={isDeleting}
          >
            Huỷ
          </Button>
          <Button
            variant="destructive"
            className="rounded-full px-6 shadow-none cursor-pointer"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xoá..." : "Xoá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
