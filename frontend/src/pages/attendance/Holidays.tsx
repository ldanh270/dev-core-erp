import { PageCard, PageContainer, PageHeader } from "@/components/common"
import { DeleteHolidayDialog } from "@/components/features/attendance/DeleteHolidayDialog"
import { HolidayCardsGrid } from "@/components/features/attendance/HolidayCardsGrid"
import { HolidayFormDialog } from "@/components/features/attendance/HolidayFormDialog"
import { HolidaysYearToolbar } from "@/components/features/attendance/HolidaysYearToolbar"
import { useHolidaysManagement } from "@/hooks/attendance/use-holidays-management"
import type { IHolidayPayload } from "@/types/attendance.types"

/**
 * Holidays admin page — company-wide or scoped date-range holidays.
 * Standardized Card Grid layout adhering to DevCore design tokens, Pill rule, and StatusPill.
 * Decoupled presentation shell powered by useHolidaysManagement presenter hook.
 */
export default function Holidays() {
  const {
    year,
    holidays,
    isLoading,
    isAdmin,
    isDialogOpen,
    setIsDialogOpen,
    editingHoliday,
    deletingHoliday,
    setDeletingHoliday,
    isSaving,
    openCreateDialog,
    openEditDialog,
    createMutation,
    updateMutation,
    deleteMutation,
    handlePreviousYear,
    handleNextYear,
  } = useHolidaysManagement()

  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Ngày lễ"
        description="Quản lý ngày nghỉ lễ áp dụng cho lịch làm việc nhân viên."
      />

      <PageCard className="space-y-4">
        <HolidaysYearToolbar
          year={year}
          isAdmin={isAdmin}
          onPreviousYear={handlePreviousYear}
          onNextYear={handleNextYear}
          onOpenCreate={openCreateDialog}
        />

        <HolidayCardsGrid
          holidays={holidays}
          isLoading={isLoading}
          isAdmin={isAdmin}
          year={year}
          onEdit={openEditDialog}
          onDelete={setDeletingHoliday}
          onOpenCreate={openCreateDialog}
        />
      </PageCard>

      <HolidayFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingHoliday={editingHoliday}
        isSaving={isSaving}
        onSubmitCreate={(payload: IHolidayPayload) => {
          createMutation.mutate(payload)
        }}
        onSubmitUpdate={(id: string, payload: Pick<IHolidayPayload, "name" | "date" | "type">) => {
          updateMutation.mutate({ id, data: payload })
        }}
      />

      <DeleteHolidayDialog
        holiday={deletingHoliday}
        onClose={() => {
          setDeletingHoliday(null)
        }}
        onConfirm={() => {
          if (deletingHoliday) {
            deleteMutation.mutate(deletingHoliday.id)
          }
        }}
      />
    </PageContainer>
  )
}
