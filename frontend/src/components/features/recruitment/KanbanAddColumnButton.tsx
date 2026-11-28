import { Button } from "@/components/ui/button"

import { Plus } from "lucide-react"

/**
 * Props for {@link KanbanAddColumnButton} component.
 */
export interface KanbanAddColumnButtonProps {
  /** Callback to trigger column creation dialog modal. */
  onClick: () => void
}

/**
 * Presenter button rendering the standardized action pill to add a new Kanban pipeline stage.
 */
export function KanbanAddColumnButton({ onClick }: KanbanAddColumnButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="rounded-full px-4 text-xs font-bold shadow-sm cursor-pointer"
    >
      <Plus className="mr-1 size-3.5" />
      Thêm cột trạng thái
    </Button>
  )
}
