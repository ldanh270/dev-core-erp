import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export interface RequisitionCreatePostingButtonProps {
  canManagePosting: boolean
  onClick: () => void
}

/**
 * Presenter action button triggering the Create Job Posting dialog.
 */
export function RequisitionCreatePostingButton({
  canManagePosting,
  onClick,
}: RequisitionCreatePostingButtonProps) {
  return (
    <Button
      className="rounded-full font-semibold"
      onClick={onClick}
      disabled={!canManagePosting}
    >
      <Plus className="mr-2 size-4" />
      Tạo bài đăng
    </Button>
  )
}
