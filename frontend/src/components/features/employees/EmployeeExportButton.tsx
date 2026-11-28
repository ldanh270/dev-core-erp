import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export interface EmployeeExportButtonProps {
  onExport?: () => void
  disabled?: boolean
}

/**
 * Presentational export button for triggering employee Excel export workflows.
 */
export function EmployeeExportButton({ onExport, disabled }: EmployeeExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full gap-2 cursor-pointer"
      onClick={onExport}
      disabled={disabled}
    >
      <FileDown className="size-4" />
      Xuất Excel
    </Button>
  )
}
