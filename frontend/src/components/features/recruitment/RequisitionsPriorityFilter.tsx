import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REQUISITION_PRIORITY } from "@/config/entities/recruitment.config"
import { Filter, RotateCcw } from "lucide-react"

export interface RequisitionsPriorityFilterProps {
  priorityFilter: string
  hasActiveFilters: boolean
  onPriorityChange: (value: string) => void
  onResetFilters: () => void
}

/**
 * Pure UI presenter rendering the priority select filter and reset filter button
 * for the Job Requisitions data table toolbar.
 */
export function RequisitionsPriorityFilter({
  priorityFilter,
  hasActiveFilters,
  onPriorityChange,
  onResetFilters,
}: RequisitionsPriorityFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[150px] text-sm font-semibold bg-background rounded-full">
          <SelectValue placeholder="Độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả ưu tiên</SelectItem>
          <SelectItem value={REQUISITION_PRIORITY.URGENT}>Khẩn cấp</SelectItem>
          <SelectItem value={REQUISITION_PRIORITY.HIGH}>Cao</SelectItem>
          <SelectItem value={REQUISITION_PRIORITY.MEDIUM}>Trung bình</SelectItem>
          <SelectItem value={REQUISITION_PRIORITY.LOW}>Thấp</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={onResetFilters}
          className="h-10 px-4 text-sm font-semibold gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Xóa lọc
        </Button>
      )}
    </div>
  )
}
