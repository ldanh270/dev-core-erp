import { DataTablePage } from "@/components/common"
import { ShiftDialog } from "@/components/features/attendance/ShiftDialog"
import { getShiftColumns } from "@/components/features/attendance/shift-columns"
import { useShiftManagement } from "@/hooks/attendance/use-shift-management"
import type { IWorkingShift } from "@/types/attendance.types"

import { Clock, Plus } from "lucide-react"
import { useMemo } from "react"

/**
 * ShiftManagement — Standardized Management page for Defining and configuring Working Shifts.
 * Thin declarative composition shell powered by DataTablePage, useShiftManagement, and getShiftColumns.
 */
export default function ShiftManagement() {
  const {
    shifts,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sheetOpen,
    setSheetOpen,
    editing,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSearch,
  } = useShiftManagement()

  const columns = useMemo(
    () =>
      getShiftColumns({
        currentPage,
        pageSize,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [currentPage, pageSize, handleEdit, handleDelete],
  )

  return (
    <>
      <DataTablePage<IWorkingShift>
        title="Quản lý ca làm việc"
        description="Định nghĩa các khung giờ làm việc chuẩn cho toàn công ty"
        density="compact"
        primaryAction={{
          label: "Thêm ca làm việc",
          icon: Plus,
          onClick: handleCreate,
        }}
        search={{
          placeholder: "Tìm theo tên ca...",
          onSearch: handleSearch,
        }}
        columns={columns}
        data={shifts}
        keyExtractor={(shift) => shift.id}
        isLoading={isLoading}
        emptyState={{
          icon: Clock,
          title: "Chưa có ca làm việc nào",
          description: "Tạo ca làm việc để áp dụng vào lịch phân ca cho nhân viên.",
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setCurrentPage,
          onItemsPerPageChange: setPageSize,
        }}
      />

      <ShiftDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialData={editing}
      />
    </>
  )
}
