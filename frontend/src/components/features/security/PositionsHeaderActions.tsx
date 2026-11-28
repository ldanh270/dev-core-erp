import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

/**
 * Props for PositionsHeaderActions component.
 */
export interface PositionsHeaderActionsProps {
  onOpenCreate: () => void
}

/**
 * Presenter component rendering the creation trigger button in PositionsManagement header.
 */
export function PositionsHeaderActions({ onOpenCreate }: PositionsHeaderActionsProps) {
  return (
    <Button
      onClick={onOpenCreate}
      size="default"
      className="rounded-full shadow-xs gap-2 font-semibold"
    >
      <Plus className="size-4" />
      Thêm chức vụ mới
    </Button>
  )
}
