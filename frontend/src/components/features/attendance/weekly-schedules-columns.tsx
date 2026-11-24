import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { MoreHorizontal } from "lucide-react"

function countAssignedDays(template: IWeeklyScheduleTemplate): number {
  return template.weeks.reduce(
    (total, week) => total + week.days.filter((day) => day.shiftId).length,
    0,
  )
}

interface WeeklySchedulesColumnsProps {
  onEdit: (template: IWeeklyScheduleTemplate) => void
  onDelete: (id: string) => void
  onApply: (template: IWeeklyScheduleTemplate) => void
}

/**
 * Factory function defining data table column schema for weekly schedule templates.
 * Computes cycle week length, assigned shift counts, and template action triggers.
 */
export function getWeeklySchedulesColumns({
  onEdit,
  onDelete,
  onApply,
}: WeeklySchedulesColumnsProps): DataTableColumn<IWeeklyScheduleTemplate>[] {
  return [
      {
        id: "name",
        header: "Tên",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (template) => (
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => {
                onEdit(template)
              }}
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "rounded-full text-left hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block max-w-full cursor-pointer",
              )}
            >
              {template.name}
            </button>
            {template.description && (
              <p className={cn("mt-0.5", TYPOGRAPHY.CELL_SECONDARY)} title={template.description}>
                {template.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "cycleWeeks",
        header: "Chu kỳ",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.TIME}px`,
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>{template.cycleWeeks} tuần</span>
        ),
      },
      {
        id: "assignedDays",
        header: "Ca đã gán",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.TIME}px`,
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>
            {countAssignedDays(template)} / {template.cycleWeeks * 7} ca
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (template) => (
          <StatusPill
            label={template.isActive ? "Đang dùng" : "Ngừng dùng"}
            variant={template.isActive ? "success" : "neutral"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        align: "right",
        sticky: true,
        cell: (template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-md border-border">
              <DropdownMenuItem
                onClick={() => {
                  onApply(template)
                }}
                className="cursor-pointer text-xs font-medium"
              >
                Áp dụng
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onEdit(template)
                }}
                className="cursor-pointer text-xs font-medium"
              >
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDelete(template.id)
                }}
                className="cursor-pointer text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ]
}
