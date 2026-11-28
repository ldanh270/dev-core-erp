import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { RefreshCw } from "lucide-react"

export type SecurityTimeRange = "today" | "7days" | "30days"

/**
 * Props for SecurityDashboardActions component.
 */
export interface SecurityDashboardActionsProps {
  timeRange: SecurityTimeRange
  onTimeRangeChange: (val: SecurityTimeRange) => void
  onRefresh: () => void
}

/**
 * Presenter component for time range selection and refresh trigger on Security Dashboard.
 */
export function SecurityDashboardActions({
  timeRange,
  onTimeRangeChange,
  onRefresh,
}: SecurityDashboardActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-[160px] h-10 rounded-full text-sm font-medium cursor-pointer">
          <SelectValue placeholder="Chọn khoảng thời gian" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="today" className="text-sm">
            Hôm nay
          </SelectItem>
          <SelectItem value="7days" className="text-sm">
            7 ngày qua
          </SelectItem>
          <SelectItem value="30days" className="text-sm">
            30 ngày qua
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        className="h-10 gap-1.5 rounded-full text-sm font-medium cursor-pointer"
        onClick={onRefresh}
      >
        <RefreshCw className="h-4 w-4" />
        Làm mới
      </Button>
    </div>
  )
}
