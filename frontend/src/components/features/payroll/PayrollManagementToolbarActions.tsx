import { Button } from "@/components/ui/button"

import { Download } from "lucide-react"

interface PayrollManagementToolbarActionsProps {
  onExport: () => void
  canExport: boolean
}

/**
 * Presenter component for PayrollManagement toolbar actions.
 */
export function PayrollManagementToolbarActions({
  onExport,
  canExport,
}: PayrollManagementToolbarActionsProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onExport}
      disabled={!canExport}
      className="rounded-full gap-2 border-border cursor-pointer"
    >
      <Download className="size-4 text-muted-foreground" />
      Xuất CSV
    </Button>
  )
}
