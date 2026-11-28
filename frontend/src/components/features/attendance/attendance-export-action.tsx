import { Button } from "@/components/ui/button"

import { Download } from "lucide-react"

interface AttendanceExportActionProps {
  onExport: () => void
}

/**
 * Presenter button for triggering attendance records CSV export.
 * Adheres to The Pill Rule with rounded-full styling.
 */
export function AttendanceExportAction({ onExport }: AttendanceExportActionProps) {
  return (
    <Button
      variant="outline"
      size="default"
      className="gap-2 rounded-full shadow-xs font-semibold cursor-pointer"
      onClick={onExport}
    >
      <Download className="size-4" /> Xuất CSV
    </Button>
  )
}
