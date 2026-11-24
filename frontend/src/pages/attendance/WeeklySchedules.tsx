import { DataTablePage } from "@/components/common"
import { ApplyWeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/apply-weekly-schedule-template-dialog"
import { WeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/weekly-schedule-template-dialog"
import { getWeeklySchedulesColumns } from "@/components/features/attendance/weekly-schedules-columns"
import { useWeeklySchedulesManagement } from "@/hooks/attendance/use-weekly-schedules-management"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { Plus } from "lucide-react"
import { useMemo } from "react"

/**
 * Standardized Weekly Schedules Template page.
 * Thin declarative composition shell powered by DataTablePage, useWeeklySchedulesManagement, and getWeeklySchedulesColumns.
 */
export default function WeeklySchedules() {
  const {
    templates,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    dialogOpen,
    setDialogOpen,
    editing,
    applying,
    setApplying,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSearch,
  } = useWeeklySchedulesManagement()

  const columns = useMemo(
    () =>
      getWeeklySchedulesColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onApply: setApplying,
      }),
    [handleEdit, handleDelete, setApplying],
  )

  return (
    <>
      <DataTablePage<IWeeklyScheduleTemplate>
        title="Template Lịch Tuần"
        description="Định nghĩa khung lịch làm việc lặp lại theo tuần cho nhân sự"
        density="compact"
        primaryAction={{
          label: "Tạo template",
          icon: Plus,
          onClick: handleCreate,
        }}
        search={{
          placeholder: "Tìm template...",
          onSearch: handleSearch,
        }}
        columns={columns}
        data={templates}
        keyExtractor={(template) => template.id}
        isLoading={isLoading}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setCurrentPage,
          onItemsPerPageChange: setPageSize,
        }}
      />

      <WeeklyScheduleTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <ApplyWeeklyScheduleTemplateDialog
        open={Boolean(applying)}
        onOpenChange={(open) => {
          if (!open) setApplying(null)
        }}
        template={applying}
      />
    </>
  )
}
