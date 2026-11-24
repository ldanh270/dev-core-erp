import { Button } from "@/components/ui/button"
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface HolidaysYearToolbarProps {
  year: number
  isAdmin: boolean
  onPreviousYear: () => void
  onNextYear: () => void
  onOpenCreate: () => void
}

/**
 * Presenter toolbar for navigating between calendar years and triggering holiday creation.
 * Encapsulates previous/next year controls and administrative action permissions.
 */
export function HolidaysYearToolbar({
  year,
  isAdmin,
  onPreviousYear,
  onNextYear,
  onOpenCreate,
}: HolidaysYearToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="font-semibold text-foreground">Năm {year}</span>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Button
            size="default"
            className="rounded-full shadow-xs gap-1.5 font-semibold cursor-pointer"
            onClick={onOpenCreate}
          >
            <Plus className="size-4" />
            Thêm ngày lễ
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-8 cursor-pointer"
          onClick={onPreviousYear}
          aria-label="Năm trước"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-8 cursor-pointer"
          onClick={onNextYear}
          aria-label="Năm sau"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
