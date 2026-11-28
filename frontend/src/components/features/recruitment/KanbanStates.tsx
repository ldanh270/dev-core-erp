import { EmptyState } from "@/components/common"
import { Button } from "@/components/ui/button"

import { AlertCircle, FolderKanban } from "lucide-react"

/**
 * Presenter displayed when neither a requisition ID nor job posting ID is targeted.
 */
export function KanbanEmptySelectionState() {
  return (
    <EmptyState
      icon={FolderKanban}
      title="Chưa chọn yêu cầu tuyển dụng"
      description="Chọn một yêu cầu tuyển dụng hoặc bài đăng để xem và cập nhật tiến độ ứng viên trên Kanban."
      className="py-16"
    />
  )
}

/**
 * Props for {@link KanbanErrorState} component.
 */
export interface KanbanErrorStateProps {
  /** Callback to trigger board query refetch. */
  onRetry: () => void
}

/**
 * Presenter displayed when loading Kanban stages or application cards fails.
 */
export function KanbanErrorState({ onRetry }: KanbanErrorStateProps) {
  return (
    <div className="container space-y-3 p-8" role="alert">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-5" />
        <p className="font-semibold">Không tải được bảng Kanban.</p>
      </div>
      <p className="text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
      <Button variant="outline" className="rounded-full" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  )
}
