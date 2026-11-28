import { BoardPageLayout } from "@/components/common"
import { KanbanAddColumnButton } from "@/components/features/recruitment/KanbanAddColumnButton"
import { KanbanBoardSkeleton } from "@/components/features/recruitment/KanbanBoardSkeleton"
import { KanbanContent } from "@/components/features/recruitment/KanbanContent"
import {
  KanbanEmptySelectionState,
  KanbanErrorState,
} from "@/components/features/recruitment/KanbanStates"
import { useKanbanManagement } from "@/hooks/recruitment/use-kanban-management"

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
 * Pure declarative wiring shell connecting useKanbanManagement with Tier 3 presenters.
 */
export default function KanbanPage({
  postingId: givenPostingId,
  requisitionId = "",
  embedded = false,
}: KanbanPageProps) {
  const { hasTarget, selectedApplicationId, setSelectedApplicationId, board, handleOpenAddColumn } =
    useKanbanManagement({ givenPostingId, requisitionId })

  if (!hasTarget) {
    return <KanbanEmptySelectionState />
  }

  if (board.isLoadingStatuses || board.isLoadingTasks) {
    return <KanbanBoardSkeleton />
  }

  if (board.isError) {
    return <KanbanErrorState onRetry={() => void board.refetch()} />
  }

  if (embedded) {
    return (
      <KanbanContent
        board={board}
        selectedApplicationId={selectedApplicationId}
        setSelectedApplicationId={setSelectedApplicationId}
        embedded
      />
    )
  }

  return (
    <BoardPageLayout
      title="Kanban Board"
      description="Kéo thả để cập nhật tiến độ ứng viên theo từng giai đoạn tuyển dụng"
      actions={
        board.canManageStages ? <KanbanAddColumnButton onClick={handleOpenAddColumn} /> : undefined
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
