import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

interface GanttMonthZoomControlsProps {
  monthsInput: string
  setMonthsInput: (val: string) => void
  monthInput: number
  setMonthInput: (val: number) => void
  yearInput: number
  setYearInput: (val: number) => void
  availableYears: number[]
  handleApplyFilters: () => void
  handleClearFilters: () => void
  handleOpenSaveDialog: () => void
  handleZoomIn: () => void
  handleZoomOut: () => void
  shiftTimelineByMonth: (months: number) => void
  getMonthOffsetLabel: (months: number) => string
}

/** Zoom and timeline granularity controls for the Gantt view. */
export function GanttMonthZoomControls({
  monthsInput,
  setMonthsInput,
  monthInput,
  setMonthInput,
  yearInput,
  setYearInput,
  availableYears,
  handleApplyFilters,
  handleClearFilters,
  handleOpenSaveDialog,
  handleZoomIn,
  handleZoomOut,
  shiftTimelineByMonth,
  getMonthOffsetLabel,
}: GanttMonthZoomControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs pt-1 border-t border-border/5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={monthsInput}
          onChange={(e) => {
            setMonthsInput(e.target.value)
          }}
          className="w-12 h-8 rounded-full border border-border/40 px-2 text-center text-xs font-semibold focus:outline-none focus:border-primary bg-background"
          min="1"
          max="12"
        />
        <span className="text-muted-foreground font-medium">tháng từ</span>
        <Select
          value={String(monthInput)}
          onValueChange={(val) => {
            setMonthInput(parseInt(val))
          }}
        >
          <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="0">Tháng một</SelectItem>
            <SelectItem value="1">Tháng hai</SelectItem>
            <SelectItem value="2">Tháng ba</SelectItem>
            <SelectItem value="3">Tháng tư</SelectItem>
            <SelectItem value="4">Tháng năm</SelectItem>
            <SelectItem value="5">Tháng sáu</SelectItem>
            <SelectItem value="6">Tháng bảy</SelectItem>
            <SelectItem value="7">Tháng tám</SelectItem>
            <SelectItem value="8">Tháng chín</SelectItem>
            <SelectItem value="9">Tháng mười</SelectItem>
            <SelectItem value="10">Tháng mười một</SelectItem>
            <SelectItem value="11">Tháng mười hai</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(yearInput)}
          onValueChange={(val) => {
            setYearInput(parseInt(val))
          }}
        >
          <SelectTrigger className="h-8 rounded-full border border-border/40 px-3 text-xs font-semibold bg-background min-w-22.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {availableYears.map((yr: number) => (
              <SelectItem key={yr} value={String(yr)}>
                {yr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleApplyFilters}
          className="h-8 px-3 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="size-3.5" />
          Áp dụng
        </Button>
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          Xóa
        </Button>
        <Button
          variant="ghost"
          onClick={handleOpenSaveDialog}
          className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-dashed border-border/40 cursor-pointer"
        >
          <Save className="size-3.5" />
          Save truy vấn riêng
        </Button>
      </div>

      {/* Right Zoom and Quick Navigate Links */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2 border-r border-border/40 pr-4">
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Phóng to ngày"
          >
            <ZoomIn className="size-3.5" />
            <span>Phóng to</span>
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Thu nhỏ ngày"
          >
            <ZoomOut className="size-3.5" />
            <span>Thu nhỏ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              shiftTimelineByMonth(-1)
            }}
            className="text-primary hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            {getMonthOffsetLabel(-1)}
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={() => {
              shiftTimelineByMonth(1)
            }}
            className="text-primary hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            {getMonthOffsetLabel(1)}
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
