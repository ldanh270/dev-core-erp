import { PageCard, PageHeader, useConfirm } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { ShiftDialog } from "@/components/features/attendance/shift-sheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WORKING_SHIFT_FORM_RULES } from "@/config/rules/attendance.config"
import { useDeleteShift, useShifts } from "@/hooks/attendance/use-shifts"
import { minutesToTime } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useState } from "react"

import { Clock, Loader2, MapPin, MoreHorizontal, Plus } from "lucide-react"

const { TABLE_COLUMN_COUNT } = WORKING_SHIFT_FORM_RULES

/**
 * ShiftManagement — Management page for Defining and configuring Working Shifts.
 * Accessible to HR/Admins.
 */
export default function ShiftManagement() {
  const confirm = useConfirm()
  /**
   * useShifts — Custom hook to fetch the list of all defined working shifts.
   * Calls API: shiftsApi.getAll
   * Returns: { data: shifts, isLoading, isError }
   */
  const { data: shifts, isLoading, isError } = useShifts()
  /**
   * useDeleteShift — Mutation hook to delete a shift.
   * Calls API: shiftsApi.delete
   */
  const deleteMutation = useDeleteShift()

  // sheetOpen: Controls the "Add/Edit Shift" side sheet.
  const [sheetOpen, setSheetOpen] = useState(false)
  // editing: Holds the shift object currently being edited, or null for creation mode.
  const [editing, setEditing] = useState<IWorkingShift | null>(null)

  /**
   * handleCreate — Initializes creation mode by clearing selection and opening the sheet.
   */
  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  /**
   * handleEdit — Initializes edit mode for a specific shift.
   * @param {IWorkingShift} shift — The shift data to populate the form.
   */
  const handleEdit = (shift: IWorkingShift) => {
    setEditing(shift)
    setSheetOpen(true)
  }

  /**
   * handleDelete — Triggers deletion of a shift after user confirmation.
   * Uses useConfirm modal provider.
   * @param {string} id — The unique ID of the shift to delete.
   */
  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa ca làm việc",
      description: "Bạn có chắc chắn muốn xoá ca làm việc này không?",
      confirmText: "Xóa ca",
      variant: "destructive",
    })
    if (!isConfirmed) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Quản lý ca làm việc"
        description="Tạo và quản lý các ca làm việc, giờ vào/ra và cấu hình GPS."
        actions={
          <Button className="gap-2" onClick={handleCreate}>
            <Plus size={16} /> Tạo ca mới
          </Button>
        }
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                  #
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Tên ca
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Giờ làm
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Giờ nghỉ
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Ân hạn
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  GPS
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Trạng thái
                </TableHead>
                <TableHead className="min-w-12 px-4 py-3" />
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border">
              {isLoading ? (
                // Loading spinner across full table body
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMN_COUNT} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                // Error feedback cell
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="h-24 text-center text-destructive"
                  >
                    Lỗi khi tải danh sách ca làm việc.
                  </TableCell>
                </TableRow>
              ) : !shifts || shifts.length === 0 ? (
                // Empty data feedback
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Chưa có ca làm việc nào. Tạo ca đầu tiên ngay.
                  </TableCell>
                </TableRow>
              ) : (
                // Shift data rendering
                shifts.map((shift, index) => (
                  <TableRow key={shift.id} className="hover:bg-muted/30">
                    <TableCell className="px-4 py-4 text-muted-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium text-foreground">
                      <button
                        onClick={() => {
                          handleEdit(shift)
                        }}
                        className="hover:text-primary hover:underline focus:outline-none"
                      >
                        {shift.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {minutesToTime(shift.startTime)} – {minutesToTime(shift.endTime)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {/* A dash preserves compatibility with legacy shifts created before break fields existed. */}
                      {shift.breakStartTime != null && shift.breakEndTime != null
                        ? `${minutesToTime(shift.breakStartTime)} – ${minutesToTime(shift.breakEndTime)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {shift.gracePeriodMinutes} phút
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {shift.gpsLat ? (
                        <span className="inline-flex items-center gap-1 text-xs text-info-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {shift.gpsRadiusMeters}m
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <StatusPill
                        label={shift.isActive ? "Đang dùng" : "Tạm dừng"}
                        variant={shift.isActive ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      {/* Context menu for Edit/Delete actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageCard>

      <ShiftDialog open={sheetOpen} onOpenChange={setSheetOpen} initialData={editing} />
    </div>
  )
}
