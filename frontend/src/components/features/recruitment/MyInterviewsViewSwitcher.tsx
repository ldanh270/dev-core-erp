import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"

/**
 * Props for {@link MyInterviewsViewSwitcher} component.
 */
export interface MyInterviewsViewSwitcherProps {
  /** Active view mode ("calendar" or "list"). */
  viewMode: "calendar" | "list"
  /** Callback triggered when view mode transitions. */
  onViewModeChange: (mode: "calendar" | "list") => void
}

/**
 * Pure UI presenter component for switching between weekly calendar and list views in personal interviews.
 */
export function MyInterviewsViewSwitcher({
  viewMode,
  onViewModeChange,
}: MyInterviewsViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 shadow-2xs">
      <Button
        size="sm"
        variant={viewMode === "calendar" ? "default" : "ghost"}
        onClick={() => onViewModeChange("calendar")}
        className="h-8 rounded-full px-4 text-xs font-bold transition-all cursor-pointer"
      >
        <Grid className="mr-1.5 size-3.5" />
        Lịch tuần
      </Button>
      <Button
        size="sm"
        variant={viewMode === "list" ? "default" : "ghost"}
        onClick={() => onViewModeChange("list")}
        className="h-8 rounded-full px-4 text-xs font-bold transition-all cursor-pointer"
      >
        <List className="mr-1.5 size-3.5" />
        Danh sách
      </Button>
    </div>
  )
}
