import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LayoutGrid, List } from "lucide-react"

export interface InterviewsViewToggleProps {
  viewMode: "table" | "cards"
  onViewModeChange: (mode: "table" | "cards") => void
}

/**
 * Pure UI presenter rendering a toggle button group between table and card view modes.
 */
export function InterviewsViewToggle({
  viewMode,
  onViewModeChange,
}: InterviewsViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border border-border rounded-full p-0.5 bg-muted/20">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="h-7 px-3 rounded-full text-xs gap-1.5"
          >
            <List className="h-3.5 w-3.5" />
            Bảng
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xem dạng bảng</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("cards")}
            className="h-7 px-3 rounded-full text-xs gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Thẻ
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xem dạng thẻ</TooltipContent>
      </Tooltip>
    </div>
  )
}
