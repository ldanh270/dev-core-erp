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
import { cn, minutesToTime } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { Clock, MapPin, MoreHorizontal } from "lucide-react"

interface ShiftColumnsProps {
  currentPage: number
  pageSize: number
  onEdit: (shift: IWorkingShift) => void
  onDelete: (id: string) => void
}

/**
 * Factory function defining data table column schema for working shift entities.
 * Configures shift timings, break periods, GPS geofencing status, and row-level actions.
 */
export function getShiftColumns({
  currentPage,
  pageSize,
  onEdit,
  onDelete,
}: ShiftColumnsProps): DataTableColumn<IWorkingShift>[] {
  return [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        sticky: true,
        cell: (_, idx) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(currentPage - 1) * pageSize + idx + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Tên ca",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.SCHEDULE}px`,
        sticky: true,
        cell: (shift) => (
          <button
            type="button"
            onClick={() => {
              onEdit(shift)
            }}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "rounded-full text-left hover:text-primary hover:underline focus:outline-none block max-w-full cursor-pointer",
            )}
          >
            {shift.name}
          </button>
        ),
      },
      {
        id: "workingHours",
        header: "Giờ làm",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (shift) => (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              TYPOGRAPHY.CELL_TIME,
            )}
          >
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            {minutesToTime(shift.startTime)} – {minutesToTime(shift.endTime)}
          </span>
        ),
      },
      {
        id: "breakHours",
        header: "Giờ nghỉ",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (shift) => (
          <span className={cn("whitespace-nowrap", TYPOGRAPHY.CELL_TIME)}>
            {shift.breakStartTime != null && shift.breakEndTime != null
              ? `${minutesToTime(shift.breakStartTime)} – ${minutesToTime(shift.breakEndTime)}`
              : "—"}
          </span>
        ),
      },
      {
        id: "gracePeriod",
        header: "Ân hạn",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        cell: (shift) => (
          <span className={cn("whitespace-nowrap", TYPOGRAPHY.CELL_SECONDARY)}>
            {shift.gracePeriodMinutes} phút
          </span>
        ),
      },
      {
        id: "gps",
        header: "GPS",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        cell: (shift) =>
          shift.gpsLat ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-primary whitespace-nowrap font-medium",
                TYPOGRAPHY.CELL_SECONDARY,
              )}
            >
              <MapPin className="size-3 text-primary shrink-0" />
              {shift.gpsRadiusMeters}m
            </span>
          ) : (
            <span className={cn("text-muted-foreground", TYPOGRAPHY.CELL_SECONDARY)}>—</span>
          ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (shift) => (
          <StatusPill
            label={shift.isActive ? "Đang áp dụng" : "Ngừng dùng"}
            variant={shift.isActive ? "success" : "neutral"}
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
        cell: (shift) => (
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
                  onEdit(shift)
                }}
                className="cursor-pointer text-xs font-medium"
              >
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onDelete(shift.id)
                }}
                className="cursor-pointer text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Xóa ca
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ]
}
