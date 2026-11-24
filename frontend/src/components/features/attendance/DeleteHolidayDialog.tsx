import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { IHoliday } from "@/types/attendance.types"

interface DeleteHolidayDialogProps {
  holiday: IHoliday | null
  onClose: () => void
  onConfirm: () => void
}

/**
 * Confirmation dialog presenter for deleting configured holiday events.
 * Encapsulates destructive action alert dialog with standardized pill button styling.
 */
export function DeleteHolidayDialog({
  holiday,
  onClose,
  onConfirm,
}: DeleteHolidayDialogProps) {
  return (
    <AlertDialog
      open={Boolean(holiday)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa ngày lễ</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa ngày lễ &ldquo;{holiday?.name}&rdquo;? Hành động này sẽ ảnh
            hưởng đến lịch làm việc của nhân viên trong ngày này.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full cursor-pointer">Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            onClick={onConfirm}
          >
            Xác nhận xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
