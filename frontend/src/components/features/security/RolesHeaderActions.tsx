import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

/**
 * Props for RolesHeaderActions component.
 */
export interface RolesHeaderActionsProps {
  onOpenCreate: () => void
}

/**
 * Presenter component rendering the create role button for the RolesManagement page.
 */
export function RolesHeaderActions({ onOpenCreate }: RolesHeaderActionsProps) {
  return (
    <Button onClick={onOpenCreate} className="gap-1.5 rounded-full text-sm font-semibold">
      <Plus size={16} strokeWidth={2.5} />
      Thêm vai trò
    </Button>
  )
}
