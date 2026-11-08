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
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useDeleteShift, useShifts } from "@/hooks/attendance/use-shifts"
import { cn, minutesToTime } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useCallback, useMemo, useState } from "react"
import { Clock, MapPin, MoreHorizontal, Plus } from "lucide-react"

/**
 * ShiftManagement — Standardized Management page for Defining and configuring Working Shifts.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, sticky actions, and seamless responsive design.
 */
export default function ShiftManagement() {
  const { data: shifts = [], isLoading } = useShifts()
  const deleteMutation = useDeleteShift()

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<IWorkingShift | null>(null)

  const handleCreate = useCallback(() => {
    setEditing(null)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback((shift: IWorkingShift) => {
    setEditing(shift)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Xác nhận xoá ca làm việc này?")) return
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const filteredShifts = useMemo(() => {
    if (!searchQuery.trim()) return shifts
    const query = searchQuery.toLowerCase().trim()
    return shifts.filter((shift) => shift.name.toLowerCase().includes(query))
  }, [shifts, searchQuery])

  const totalItems = filteredShifts.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredShifts.slice(startIndex, startIndex + pageSize)
  }, [filteredShifts, currentPage, pageSize])

  const columns: DataTableColumn<IWorkingShift>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        sticky: true,
        cell: (_, idx) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            {(currentPage - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        id: "name",
        header: "Tên ca",
        width: getTableColWidthPx("TITLE"),
        minWidth: "180px",
        sticky: true,
        cell: (shift) => (
          <button
            type="button"
            onClick={() => {
              handleEdit(shift)
            }}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "rounded-full text-left hover:text-primary hover:underline focus:outline-none block max-w-full",
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
        minWidth: "160px",
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
        minWidth: "140px",
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
        minWidth: "100px",
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
        minWidth: "100px",
        cell: (shift) =>
          shift.gpsLat ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-primary whitespace-nowrap font-medium",
                TYPOGRAPHY.CELL_SECONDARY,
              )}
            >
              <MapPin className="size-3.5 text-primary shrink-0" />
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
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "right",
        cell: (shift) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  handleEdit(shift)
                }}
              >
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  handleDelete(shift.id)
                }}
              >
                Xoá ca
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [currentPage, pageSize, handleEdit, handleDelete],
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
      search={{
        placeholder: "Tìm kiếm ca làm việc...",
        value: searchQuery,
        onSearch: handleSearch,
        onClear: () => {
          handleSearch("")
        },
      }}
      columns={columns}
      data={paginatedData}
      isLoading={isLoading}
      keyExtractor={(shift) => shift.id}
      emptyState={{
        title: searchQuery ? "Không tìm thấy ca làm việc" : "Chưa có ca làm việc nào",
        description: searchQuery
          ? `Không có ca làm việc nào khớp với từ khóa "${searchQuery}".`
          : "Tạo ca làm việc đầu tiên để thiết lập lịch công cho nhân sự.",
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: (limit) => {
          setPageSize(limit)
          setCurrentPage(1)
        },
      }}
      extraContent={
        <ShiftDialog open={sheetOpen} onOpenChange={setSheetOpen} initialData={editing} />
      }
    />
  )
}
