import { DataTablePage, type DataTableColumn, StatusPill } from "@/components/common"
import { ShiftDialog } from "@/components/features/attendance/shift-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDeleteShift, useShifts } from "@/hooks/attendance/use-shifts"
import { minutesToTime } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useMemo, useState } from "react"
import { Clock, MapPin, MoreHorizontal, Plus } from "lucide-react"

/**
 * ShiftManagement — Standardized Management page for Defining and configuring Working Shifts.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, sticky actions, and seamless responsive design.
 */
export default function ShiftManagement() {
  const { data: shifts = [], isLoading } = useShifts()
  const deleteMutation = useDeleteShift()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<IWorkingShift | null>(null)

  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const handleEdit = (shift: IWorkingShift) => {
    setEditing(shift)
    setSheetOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("Xác nhận xoá ca làm việc này?")) return
    deleteMutation.mutate(id)
  }

  const columns: DataTableColumn<IWorkingShift>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: "56px",
        minWidth: "56px",
        align: "center",
        sticky: true,
        cell: (_, idx) => (
          <span className="font-mono text-xs text-muted-foreground">{idx + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Tên ca",
        width: "220px",
        minWidth: "180px",
        sticky: true,
        cell: (shift) => (
          <button
            type="button"
            onClick={() => { handleEdit(shift); }}
            className="rounded-full text-left font-medium text-foreground hover:text-primary hover:underline focus:outline-none truncate block max-w-full"
          >
            {shift.name}
          </button>
        ),
      },
      {
        id: "workingHours",
        header: "Giờ làm",
        width: "180px",
        minWidth: "160px",
        cell: (shift) => (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
            <Clock className="h-3.5 w-3.5" />
            {minutesToTime(shift.startTime)} – {minutesToTime(shift.endTime)}
          </span>
        ),
      },
      {
        id: "breakHours",
        header: "Giờ nghỉ",
        width: "160px",
        minWidth: "140px",
        cell: (shift) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {shift.breakStartTime != null && shift.breakEndTime != null
              ? `${minutesToTime(shift.breakStartTime)} – ${minutesToTime(shift.breakEndTime)}`
              : "—"}
          </span>
        ),
      },
      {
        id: "gracePeriod",
        header: "Ân hạn",
        width: "120px",
        minWidth: "100px",
        cell: (shift) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {shift.gracePeriodMinutes} phút
          </span>
        ),
      },
      {
        id: "gps",
        header: "GPS",
        width: "120px",
        minWidth: "100px",
        cell: (shift) =>
          shift.gpsLat ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary whitespace-nowrap">
              <MapPin className="h-3.5 w-3.5" />
              {shift.gpsRadiusMeters}m
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: "130px",
        minWidth: "120px",
        cell: (shift) => (
          <StatusPill
            label={shift.isActive ? "Đang dùng" : "Tạm dừng"}
            variant={shift.isActive ? "success" : "neutral"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: "60px",
        minWidth: "60px",
        align: "right",
        cell: (shift) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { handleEdit(shift); }}>Chỉnh sửa</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { handleDelete(shift.id); }}>
                Xoá ca
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  return (
    <DataTablePage<IWorkingShift>
      title="Quản lý ca làm việc"
      description="Tạo và quản lý các ca làm việc, giờ vào/ra và cấu hình GPS."
      primaryAction={{
        label: "Tạo ca mới",
        icon: Plus,
        onClick: handleCreate,
      }}
      columns={columns}
      data={shifts}
      isLoading={isLoading}
      keyExtractor={(shift) => shift.id}
      emptyState={{
        title: "Chưa có ca làm việc nào",
        description: "Tạo ca làm việc đầu tiên để thiết lập lịch công cho nhân sự.",
      }}
      extraContent={
        <ShiftDialog open={sheetOpen} onOpenChange={setSheetOpen} initialData={editing} />
      }
    />
  )
}
