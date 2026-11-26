import { BoardPageLayout } from "@/components/common"
import { KanbanBoardSkeleton } from "@/components/features/recruitment/KanbanBoardSkeleton"
import { KanbanContent } from "@/components/features/recruitment/KanbanContent"
import { Button } from "@/components/ui/button"
import { useKanbanManagement } from "@/hooks/recruitment/use-kanban-management"
import { Plus } from "lucide-react"

/**
 * Props for {@link KanbanPage} component.
 */
export interface KanbanPageProps {
  /** Optional job posting ID to load specific posting Kanban board. */
  postingId?: string
  /** Optional requisition ID to load requisition-level aggregate Kanban board. */
  requisitionId?: string
  /** Whether the board is rendered embedded inside another page tab. */
  embedded?: boolean
}

/**
 * Tier 2 Page Orchestrator for recruitment Kanban boards.
 * Switches between requisition and posting boards, delegating UI rendering to KanbanContent.
 */
export default function KanbanPage({
  postingId: givenPostingId,
  requisitionId = "",
  embedded = false,
}: KanbanPageProps) {
  const {
    hasTarget,
    selectedApplicationId,
    setSelectedApplicationId,
    board,
    handleOpenAddColumn,
  } = useKanbanManagement({ givenPostingId, requisitionId })

  if (!hasTarget) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Chọn một yêu cầu tuyển dụng để xem Kanban.
      </p>
    )
  }

  if (board.isLoadingStatuses || board.isLoadingTasks) return <KanbanBoardSkeleton />

  if (board.isError) {
    return (
      <div className="container space-y-3 p-8" role="alert">
        <p className="font-semibold text-destructive">Không tải được bảng Kanban.</p>
        <p className="text-sm text-muted-foreground">Kiểm tra kết nối rồi thử lại.</p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            void board.refetch()
          }}
        >
          Thử lại
        </Button>
      </div>
    )
  }

  if (embedded) {
    return (
      <div className="space-y-6">
        <KanbanContent
          board={board}
          selectedApplicationId={selectedApplicationId}
          setSelectedApplicationId={setSelectedApplicationId}
        />
      </div>
    )
  }

  return (
    <BoardPageLayout
      title="Kanban Board"
      description="Kéo thả để cập nhật tiến độ ứng viên theo từng giai đoạn tuyển dụng"
      actions={
        board.canManageStages ? (
          <Button
            onClick={handleOpenAddColumn}
            className="rounded-full px-4 text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="mr-1 size-3.5" />
            Thêm cột trạng thái
          </Button>
        ) : undefined
      }
    >
      <KanbanContent
        board={board}
        selectedApplicationId={selectedApplicationId}
        setSelectedApplicationId={setSelectedApplicationId}
      />
    </BoardPageLayout>
  )
}
