import { DateRangePicker, TYPOGRAPHY } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Filter, RefreshCw } from "lucide-react"

/**
 * Props for ActivityLogsHeaderActions component.
 */
export interface ActivityLogsHeaderActionsProps {
  isFetching: boolean
  onRefresh: () => void
}

/**
 * Presenter component for the refresh button in the Activity Logs page header.
 */
export function ActivityLogsHeaderActions({
  isFetching,
  onRefresh,
}: ActivityLogsHeaderActionsProps) {
  return (
    <Button
      variant="outline"
      onClick={onRefresh}
      className="gap-1.5 rounded-full text-sm font-semibold cursor-pointer"
    >
      <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
      Làm mới
    </Button>
  )
}


/**
 * Props for ActivityLogsCategoryFilter component.
 */
export interface ActivityLogsCategoryFilterProps {
  category: string
  onCategoryChange: (cat: string) => void
}

/**
 * Filter dropdown for selecting activity log categories (AUTH, HRM, SECURITY, etc.).
 */
export function ActivityLogsCategoryFilter({
  category,
  onCategoryChange,
}: ActivityLogsCategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Filter className="size-4 text-muted-foreground shrink-0" />
      <Select
        value={category || "ALL"}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger
          className={cn("w-[155px] rounded-full bg-background", TYPOGRAPHY.TOOLBAR_CONTROL)}
        >
          <SelectValue placeholder="Danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả danh mục</SelectItem>
          <SelectItem value="AUTH">Xác thực</SelectItem>
          <SelectItem value="HRM">Nhân sự</SelectItem>
          <SelectItem value="SECURITY">Bảo mật</SelectItem>
          <SelectItem value="ATTENDANCE">Chấm công</SelectItem>
          <SelectItem value="SYSTEM">Hệ thống</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Props for ActivityLogsDateRangeToolbar component.
 */
export interface ActivityLogsDateRangeToolbarProps {
  fromDate?: string
  toDate?: string
  onDateRangeChange: (dates: { startDate?: string; endDate?: string }) => void
}

/**
 * Date range picker toolbar for filtering activity logs across specified start/end dates.
 */
export function ActivityLogsDateRangeToolbar({
  fromDate,
  toDate,
  onDateRangeChange,
}: ActivityLogsDateRangeToolbarProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={TYPOGRAPHY.TOOLBAR_LABEL}>Lọc theo ngày:</span>
      <DateRangePicker
        startDate={fromDate || null}
        endDate={toDate || null}
        onChange={({ startDate, endDate }) => {
          onDateRangeChange({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          })
        }}
        size="default"
        placeholder="Chọn khoảng ngày..."
        className="w-[210px] rounded-full shrink-0"
      />
    </div>
  )
}
